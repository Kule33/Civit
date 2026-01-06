using System.Globalization;
using System.Security.Cryptography;
using System.Text;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.Extensions.Configuration;

namespace backend.Security
{
    public static class S2SConstants
    {
        public const string IsAuthenticatedItemKey = "S2S:IsAuthenticated";
        public const string ApiKeyItemKey = "S2S:ApiKey";
    }

    public enum S2SAuthorizationMode
    {
        S2SOnly = 0,
        JwtOrS2S = 1
    }

    /// <summary>
    /// Verifies server-to-server HMAC signature using headers:
    /// x-api-key, x-timestamp, x-nonce, x-signature.
    /// Canonical string: METHOD + (PathBase+Path+Query) + timestamp + nonce + rawBody
    /// Signature: HMAC-SHA256 (UTF-8), lowercase hex.
    /// </summary>
    public sealed class S2SAuthorizationFilter : IAsyncAuthorizationFilter
    {
        private readonly IConfiguration _configuration;
        private readonly S2SAuthorizationMode _mode;

        public S2SAuthorizationFilter(IConfiguration configuration, S2SAuthorizationMode mode)
        {
            _configuration = configuration;
            _mode = mode;
        }

        public async Task OnAuthorizationAsync(AuthorizationFilterContext context)
        {
            if (_mode == S2SAuthorizationMode.JwtOrS2S &&
                (context.HttpContext.User?.Identity?.IsAuthenticated ?? false))
            {
                return;
            }

            var request = context.HttpContext.Request;
            var apiKey = request.Headers["x-api-key"].ToString();
            var signature = request.Headers["x-signature"].ToString();
            var timestamp = request.Headers["x-timestamp"].ToString();
            var nonce = request.Headers["x-nonce"].ToString();

            if (string.IsNullOrWhiteSpace(apiKey) ||
                string.IsNullOrWhiteSpace(signature) ||
                string.IsNullOrWhiteSpace(timestamp) ||
                string.IsNullOrWhiteSpace(nonce))
            {
                context.Result = new UnauthorizedObjectResult("Unauthorized: Missing S2S headers");
                return;
            }

            var apiKeys = GetConfiguredSecrets(
                "S2S:ApiKeys",
                "S2S:ApiKey",
                "PAPERMAKER_API_KEY",
                "S2S_API_KEY",
                "S2S_API_KEYS");

            var hmacSecrets = GetConfiguredSecrets(
                "S2S:HmacSecrets",
                "S2S:HmacSecret",
                "PAPERMAKER_HMAC_SECRET",
                "S2S_HMAC_SECRET",
                "S2S_HMAC_SECRETS");

            if (apiKeys.Length == 0 || hmacSecrets.Length == 0)
            {
                context.Result = new UnauthorizedObjectResult("Unauthorized: S2S keys not configured");
                return;
            }

            if (!apiKeys.Any(k => string.Equals(k, apiKey, StringComparison.Ordinal)))
            {
                context.Result = new UnauthorizedObjectResult("Unauthorized: Invalid API key");
                return;
            }

            // Replay protection (5 min window)
            if (!long.TryParse(timestamp, NumberStyles.Integer, CultureInfo.InvariantCulture, out var ts))
            {
                context.Result = new UnauthorizedObjectResult("Unauthorized: Invalid timestamp");
                return;
            }

            var now = DateTimeOffset.UtcNow.ToUnixTimeSeconds();
            if (Math.Abs(now - ts) > 300)
            {
                context.Result = new UnauthorizedObjectResult("Unauthorized: Expired");
                return;
            }

            request.EnableBuffering();
            if (request.Body.CanSeek)
            {
                request.Body.Position = 0;
            }

            string rawBody;
            using (var reader = new StreamReader(request.Body, Encoding.UTF8, detectEncodingFromByteOrderMarks: false, leaveOpen: true))
            {
                rawBody = await reader.ReadToEndAsync();
            }

            if (request.Body.CanSeek)
            {
                request.Body.Position = 0;
            }

            var methodUpper = request.Method.ToUpperInvariant();
            var pathAndQuery = (request.PathBase + request.Path + request.QueryString).ToString();
            var payload = methodUpper + pathAndQuery + timestamp + nonce + rawBody;

            var receivedSig = signature.Trim().ToLowerInvariant();
            var isValid = hmacSecrets.Any(secret =>
            {
                var computed = ComputeHmacSha256HexLower(secret, payload);
                return FixedTimeEquals(receivedSig, computed);
            });

            if (!isValid)
            {
                context.Result = new UnauthorizedObjectResult("Unauthorized: Signature mismatch");
                return;
            }

            context.HttpContext.Items[S2SConstants.IsAuthenticatedItemKey] = true;
            context.HttpContext.Items[S2SConstants.ApiKeyItemKey] = apiKey;
        }

        private string[] GetConfiguredSecrets(
            string configArrayKey,
            string configSingleKey,
            params string[] envKeys)
        {
            // Prefer array form in appsettings: "S2S": { "ApiKeys": ["..."] }
            var fromArray = _configuration.GetSection(configArrayKey).Get<string[]>();
            if (fromArray != null && fromArray.Length > 0)
            {
                return fromArray
                    .Select(NormalizeConfiguredSecret)
                    .Where(s => !string.IsNullOrWhiteSpace(s))
                    .Distinct(StringComparer.Ordinal)
                    .ToArray();
            }

            // Fallback to single keys (config or env), supporting comma-separated lists.
            var candidates = new List<string?>
            {
                _configuration[configSingleKey]
            };

            foreach (var envKey in envKeys)
            {
                candidates.Add(Environment.GetEnvironmentVariable(envKey));
            }

            var raw = candidates.FirstOrDefault(v => !string.IsNullOrWhiteSpace(v)) ?? string.Empty;
            return raw
                .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                .Select(NormalizeConfiguredSecret)
                .Where(s => !string.IsNullOrWhiteSpace(s))
                .Distinct(StringComparer.Ordinal)
                .ToArray();
        }

        private static string NormalizeConfiguredSecret(string value)
        {
            if (string.IsNullOrWhiteSpace(value)) return string.Empty;

            var trimmed = value.Trim();

            // Allow accidentally-pasted formats like "Key=pm_secret_test_key".
            var eqIndex = trimmed.IndexOf('=');
            if (eqIndex > -1 && eqIndex < trimmed.Length - 1)
            {
                var left = trimmed[..eqIndex].Trim();
                if (left.Equals("key", StringComparison.OrdinalIgnoreCase) ||
                    left.Equals("apikey", StringComparison.OrdinalIgnoreCase) ||
                    left.Equals("api_key", StringComparison.OrdinalIgnoreCase) ||
                    left.Equals("secret", StringComparison.OrdinalIgnoreCase) ||
                    left.Equals("hmac", StringComparison.OrdinalIgnoreCase) ||
                    left.Equals("hmac_secret", StringComparison.OrdinalIgnoreCase))
                {
                    return trimmed[(eqIndex + 1)..].Trim();
                }
            }

            return trimmed;
        }

        private static string ComputeHmacSha256HexLower(string secret, string payload)
        {
            var keyBytes = Encoding.UTF8.GetBytes(secret);
            var payloadBytes = Encoding.UTF8.GetBytes(payload);
            using var hmac = new HMACSHA256(keyBytes);
            var hash = hmac.ComputeHash(payloadBytes);
            return Convert.ToHexString(hash).ToLowerInvariant();
        }

        private static bool FixedTimeEquals(string a, string b)
        {
            var aBytes = Encoding.UTF8.GetBytes(a);
            var bBytes = Encoding.UTF8.GetBytes(b);
            return aBytes.Length == bBytes.Length && CryptographicOperations.FixedTimeEquals(aBytes, bBytes);
        }
    }

    /// <summary>
    /// Allows access ONLY via valid S2S headers.
    /// Easy undo: remove this attribute from controllers/actions.
    /// </summary>
    [AttributeUsage(AttributeTargets.Class | AttributeTargets.Method, AllowMultiple = false, Inherited = true)]
    public sealed class RequireS2SAttribute : TypeFilterAttribute
    {
        public RequireS2SAttribute() : base(typeof(S2SAuthorizationFilter))
        {
            Arguments = new object[] { S2SAuthorizationMode.S2SOnly };
        }
    }

    /// <summary>
    /// Allows access via Supabase JWT OR valid S2S headers.
    /// Easy undo: remove this attribute + the [AllowAnonymous] override.
    /// </summary>
    [AttributeUsage(AttributeTargets.Class | AttributeTargets.Method, AllowMultiple = false, Inherited = true)]
    public sealed class RequireJwtOrS2SAttribute : TypeFilterAttribute
    {
        public RequireJwtOrS2SAttribute() : base(typeof(S2SAuthorizationFilter))
        {
            Arguments = new object[] { S2SAuthorizationMode.JwtOrS2S };
        }
    }
}

