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
            Console.WriteLine("[S2S] Authorization started");

            if (_mode == S2SAuthorizationMode.JwtOrS2S &&
                (context.HttpContext.User?.Identity?.IsAuthenticated ?? false))
            {
                Console.WriteLine("[S2S] JWT already authenticated; skipping S2S check");
                return;
            }

            var request = context.HttpContext.Request;
            var apiKey = request.Headers["x-api-key"].ToString();
            var signature = request.Headers["x-signature"].ToString();
            var timestamp = request.Headers["x-timestamp"].ToString();
            var nonce = request.Headers["x-nonce"].ToString();

            Console.WriteLine("[S2S Filter] Received request headers:");
            Console.WriteLine($"  x-api-key: {(string.IsNullOrWhiteSpace(apiKey) ? "NOT SET" : apiKey)}");
            Console.WriteLine($"  x-signature: {(string.IsNullOrWhiteSpace(signature) ? "NOT SET" : signature.Substring(0, Math.Min(20, signature.Length)) + "...")}");
            Console.WriteLine($"  x-timestamp: {(string.IsNullOrWhiteSpace(timestamp) ? "NOT SET" : timestamp)}");
            Console.WriteLine($"  x-nonce: {(string.IsNullOrWhiteSpace(nonce) ? "NOT SET" : nonce)}");

            if (string.IsNullOrWhiteSpace(apiKey) ||
                string.IsNullOrWhiteSpace(signature) ||
                string.IsNullOrWhiteSpace(timestamp) ||
                string.IsNullOrWhiteSpace(nonce))
            {
                Console.WriteLine("[S2S Filter] ❌ Missing required headers (api-key/signature/timestamp/nonce)");
                context.Result = new UnauthorizedObjectResult("Unauthorized: Missing S2S headers");
                return;
            }

            var apiKeys = GetConfiguredSecrets("S2S:ApiKeys");
            var hmacSecrets = GetConfiguredSecrets("S2S:HmacSecrets");

            Console.WriteLine($"[S2S Filter] Configured API keys count: {apiKeys.Length}");
            Console.WriteLine($"[S2S Filter] Configured HMAC secrets count: {hmacSecrets.Length}");

            if (apiKeys.Length == 0 || hmacSecrets.Length == 0)
            {
                Console.WriteLine("[S2S Filter] ❌ No API keys or HMAC secrets configured");
                context.Result = new UnauthorizedObjectResult("Unauthorized: S2S keys not configured");
                return;
            }

            if (!apiKeys.Any(k => string.Equals(k, apiKey, StringComparison.Ordinal)))
            {
                Console.WriteLine($"[S2S Filter] ❌ Invalid API key. Received: {apiKey}");
                Console.WriteLine($"[S2S Filter] Expected one of: {string.Join(", ", apiKeys.Select(k => k.Substring(0, Math.Min(10, k.Length)) + "..."))}");
                context.Result = new UnauthorizedObjectResult("Unauthorized: Invalid API key");
                return;
            }

            Console.WriteLine("[S2S Filter] ✅ API key is valid");

            // Replay protection (5 min window)
            if (!long.TryParse(timestamp, NumberStyles.Integer, CultureInfo.InvariantCulture, out var ts))
            {
                Console.WriteLine($"[S2S Filter] ❌ Invalid timestamp format: {timestamp}");
                context.Result = new UnauthorizedObjectResult("Unauthorized: Invalid timestamp");
                return;
            }

            var now = DateTimeOffset.UtcNow.ToUnixTimeSeconds();
            var timeDiff = Math.Abs(now - ts);
            Console.WriteLine($"[S2S Filter] Timestamp validation: now={now}, received={ts}, diff={timeDiff}s");
            if (timeDiff > 300)
            {
                Console.WriteLine($"[S2S Filter] ❌ Timestamp expired or too far in the future (diff > 300s)");
                context.Result = new UnauthorizedObjectResult("Unauthorized: Expired");
                return;
            }

            Console.WriteLine("[S2S Filter] ✅ Timestamp is valid");

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

            Console.WriteLine("[S2S Filter] Canonical string for signature:");
            Console.WriteLine($"  Method: {methodUpper}");
            Console.WriteLine($"  Path+Query: {pathAndQuery}");
            Console.WriteLine($"  Timestamp: {timestamp}");
            Console.WriteLine($"  Nonce: {nonce}");
            Console.WriteLine($"  Body: {rawBody}");
            Console.WriteLine($"  Full Payload: {payload}");

            var receivedSig = signature.Trim().ToLowerInvariant();
            Console.WriteLine($"[S2S Filter] Received signature: {receivedSig}");
            
            var isValid = false;
            string? matchedSecret = null;
            foreach (var secret in hmacSecrets)
            {
                var computed = ComputeHmacSha256HexLower(secret, payload);
                Console.WriteLine($"[S2S Filter] Trying secret ({secret.Substring(0, Math.Min(10, secret.Length))}...)");
                Console.WriteLine($"  Computed signature: {computed}");
                
                if (FixedTimeEquals(receivedSig, computed))
                {
                    isValid = true;
                    matchedSecret = secret.Substring(0, Math.Min(10, secret.Length)) + "...";
                    Console.WriteLine($"  ✅ Signature match!");
                    break;
                }
                else
                {
                    Console.WriteLine($"  ❌ Signature mismatch");
                }
            }

            if (!isValid)
            {
                Console.WriteLine("[S2S Filter] ❌ Signature validation FAILED for all secrets");
                context.Result = new UnauthorizedObjectResult("Unauthorized: Signature mismatch");
                return;
            }

            Console.WriteLine($"[S2S Filter] ✅ Authorization succeeded with secret {matchedSecret}");
            context.HttpContext.Items[S2SConstants.IsAuthenticatedItemKey] = true;
            context.HttpContext.Items[S2SConstants.ApiKeyItemKey] = apiKey;
        }

        private string[] GetConfiguredSecrets(string configArrayKey)
        {
            // Load ONLY from appsettings array: "S2S": { "ApiKeys": [...], "HmacSecrets": [...] }
            // These arrays are populated in Program.cs from environment variables
            var fromArray = _configuration.GetSection(configArrayKey).Get<string[]>();
            if (fromArray != null && fromArray.Length > 0)
            {
                return fromArray
                    .Where(s => !string.IsNullOrWhiteSpace(s))
                    .Select(s => s.Trim())
                    .Distinct(StringComparer.Ordinal)
                    .ToArray();
            }

            return Array.Empty<string>();
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

