using backend.Config; // This line is crucial for SupabaseSettings
using backend.Data;
using backend.Repositories;
using backend.Repositories.Interfaces;
using backend.Services;
using backend.Services.Interfaces;
using backend.Models;
using Npgsql;
using Microsoft.EntityFrameworkCore;
using CloudinaryDotNet;
using Microsoft.OpenApi.Models;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using Microsoft.Extensions.Options; // Ensure this is present if using IOptions<T> elsewhere
using System.Security.Claims;
using System.Text.Json;
using DotNetEnv;
using Microsoft.AspNetCore.HttpOverrides;

// Load environment variables from .env file
Env.Load();

// Map flat .env variables to ASP.NET nested config keys if provided
var flatProjectUrl = Environment.GetEnvironmentVariable("SUPABASE_PROJECT_URL");
if (!string.IsNullOrWhiteSpace(flatProjectUrl))
{
    Environment.SetEnvironmentVariable("Supabase__ProjectUrl", flatProjectUrl);
}

var flatJwt = Environment.GetEnvironmentVariable("SUPABASE_JWT_SECRET");
if (!string.IsNullOrWhiteSpace(flatJwt))
{
    Environment.SetEnvironmentVariable("Supabase__JwtSecret", flatJwt);
}

var flatServiceKey = Environment.GetEnvironmentVariable("SUPABASE_SERVICE_ROLE_KEY");
if (!string.IsNullOrWhiteSpace(flatServiceKey))
{
    Environment.SetEnvironmentVariable("Supabase__ServiceRoleKey", flatServiceKey);
}
var flatAnonKey = Environment.GetEnvironmentVariable("SUPABASE_ANON_KEY");
if (!string.IsNullOrWhiteSpace(flatAnonKey))
{
    Environment.SetEnvironmentVariable("Supabase__AnonKey", flatAnonKey);
}

var builder = WebApplication.CreateBuilder(args);

// Ensure environment variables are included in configuration
builder.Configuration.AddEnvironmentVariables();

// Explicitly bind Supabase settings from environment variables into configuration
var envSupabaseUrl = Environment.GetEnvironmentVariable("SUPABASE_PROJECT_URL");
var envSupabaseJwt = Environment.GetEnvironmentVariable("SUPABASE_JWT_SECRET");
var envSupabaseServiceKey = Environment.GetEnvironmentVariable("SUPABASE_SERVICE_ROLE_KEY");
var envSupabaseAnonKey = Environment.GetEnvironmentVariable("SUPABASE_ANON_KEY");

if (!string.IsNullOrWhiteSpace(envSupabaseUrl))
    builder.Configuration["Supabase:ProjectUrl"] = envSupabaseUrl;
if (!string.IsNullOrWhiteSpace(envSupabaseJwt))
    builder.Configuration["Supabase:JwtSecret"] = envSupabaseJwt;
if (!string.IsNullOrWhiteSpace(envSupabaseServiceKey))
    builder.Configuration["Supabase:ServiceRoleKey"] = envSupabaseServiceKey;
if (!string.IsNullOrWhiteSpace(envSupabaseAnonKey))
    builder.Configuration["Supabase:AnonKey"] = envSupabaseAnonKey;

// Override DB connection string from environment variables only if present
var dbHost = Environment.GetEnvironmentVariable("DB_HOST");
var dbPort = Environment.GetEnvironmentVariable("DB_PORT");
var dbName = Environment.GetEnvironmentVariable("DB_NAME");
var dbUser = Environment.GetEnvironmentVariable("DB_USERNAME");
var dbPass = Environment.GetEnvironmentVariable("DB_PASSWORD");
var dbSslMode = Environment.GetEnvironmentVariable("DB_SSLMODE");

if (!string.IsNullOrWhiteSpace(dbHost) &&
    !string.IsNullOrWhiteSpace(dbPort) &&
    !string.IsNullOrWhiteSpace(dbName) &&
    !string.IsNullOrWhiteSpace(dbUser) &&
    !string.IsNullOrWhiteSpace(dbPass))
{
    // Default SSL mode: Disable in Development if not explicitly set; Require otherwise
    var isDev = string.Equals(builder.Environment.EnvironmentName, "Development", StringComparison.OrdinalIgnoreCase);
    var sslMode = !string.IsNullOrWhiteSpace(dbSslMode)
        ? dbSslMode
        : (isDev ? "Disable" : "Require");

    builder.Configuration["ConnectionStrings:DefaultConnection"] =
        $"Host={dbHost};" +
        $"Port={dbPort};" +
        $"Database={dbName};" +
        $"Username={dbUser};" +
        $"Password={dbPass};" +
        $"Ssl Mode={sslMode};Timeout=120;Command Timeout=30;Maximum Pool Size=100;" +
        "Minimum Pool Size=2;Connection Idle Lifetime=300;Connection Pruning Interval=10;" +
        "Search Path=public;Pooling=true;Enlist=false;No Reset On Close=true;";
}

builder.Configuration["CloudinarySettings:CloudName"] = Environment.GetEnvironmentVariable("CLOUDINARY_CLOUD_NAME");
builder.Configuration["CloudinarySettings:ApiKey"] = Environment.GetEnvironmentVariable("CLOUDINARY_API_KEY");
builder.Configuration["CloudinarySettings:ApiSecret"] = Environment.GetEnvironmentVariable("CLOUDINARY_API_SECRET");

builder.Configuration["EmailSettings:AdminEmail"] = Environment.GetEnvironmentVariable("ADMIN_EMAIL");
builder.Configuration["EmailSettings:SmtpHost"] = Environment.GetEnvironmentVariable("SMTP_HOST");
builder.Configuration["EmailSettings:SmtpPort"] = Environment.GetEnvironmentVariable("SMTP_PORT");
builder.Configuration["EmailSettings:SmtpUsername"] = Environment.GetEnvironmentVariable("SMTP_USERNAME");
builder.Configuration["EmailSettings:SmtpPassword"] = Environment.GetEnvironmentVariable("SMTP_PASSWORD");
builder.Configuration["EmailSettings:SenderEmail"] = Environment.GetEnvironmentVariable("SENDER_EMAIL");
builder.Configuration["EmailSettings:SenderName"] = Environment.GetEnvironmentVariable("SENDER_NAME");

// Add services to the container.

// Configure AppSettings
builder.Services.Configure<CloudinarySettings>(builder.Configuration.GetSection("CloudinarySettings"));
builder.Services.Configure<TempFilesSettings>(builder.Configuration.GetSection("TempFilesSettings"));

// Configure SupabaseSettings - this will correctly pick up from environment variables now
builder.Services.Configure<SupabaseSettings>(builder.Configuration.GetSection("Supabase"));
// builder.Services.Configure<PricingSettings>(builder.Configuration.GetSection("Pricing"));

// Add JWT Authentication
builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    // Retrieve the Supabase JWT Secret from configuration.
    // This will now correctly pull from your environment variables.
    var supabaseSettings = builder.Configuration.GetSection("Supabase").Get<SupabaseSettings>();
    if (string.IsNullOrEmpty(supabaseSettings?.JwtSecret))
    {
        throw new InvalidOperationException("Supabase:JwtSecret is not configured. Please ensure it's set in appsettings.json or environment variables.");
    }

    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = false,
        ValidateAudience = false,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(supabaseSettings.JwtSecret)),
        ClockSkew = TimeSpan.Zero,
        NameClaimType = "sub",
        RoleClaimType = ClaimTypes.Role
    };

    // Map Supabase user_metadata.role -> ClaimTypes.Role so [Authorize(Roles=...)] works
    options.Events = new JwtBearerEvents
    {
        OnTokenValidated = context =>
        {
            try
            {
                var identity = context.Principal?.Identity as ClaimsIdentity;
                if (identity == null)
                {
                    return Task.CompletedTask;
                }

                // If a Role claim exists but is just "authenticated", we'll try to override it
                var existingRoleClaim = identity.Claims.FirstOrDefault(c => c.Type == ClaimTypes.Role);
                var existingRoleIsAppRole = existingRoleClaim != null &&
                    (string.Equals(existingRoleClaim.Value, "admin", StringComparison.OrdinalIgnoreCase) ||
                     string.Equals(existingRoleClaim.Value, "teacher", StringComparison.OrdinalIgnoreCase));

                // If token already has a top-level "role" claim, only map if it matches expected app roles
                var topLevelRole = identity.FindFirst("role")?.Value;
                string? mappedRole = null;
                if (!string.IsNullOrWhiteSpace(topLevelRole) &&
                    (string.Equals(topLevelRole, "admin", StringComparison.OrdinalIgnoreCase) ||
                     string.Equals(topLevelRole, "teacher", StringComparison.OrdinalIgnoreCase)))
                {
                    mappedRole = topLevelRole.ToLowerInvariant();
                }

                // Supabase typically embeds user metadata in the "user_metadata" claim as JSON
                var userMetadataClaim = identity.FindFirst("user_metadata")?.Value;
                if (!string.IsNullOrWhiteSpace(userMetadataClaim))
                {
                    using var doc = JsonDocument.Parse(userMetadataClaim);
                    if (doc.RootElement.TryGetProperty("role", out var roleElement) &&
                        roleElement.ValueKind == JsonValueKind.String)
                    {
                        var role = roleElement.GetString();
                        if (!string.IsNullOrWhiteSpace(role))
                        {
                            mappedRole = role.ToLowerInvariant();
                        }
                    }
                }

                // Supabase sometimes places data in app_metadata
                var appMetadataClaim = identity.FindFirst("app_metadata")?.Value;
                if (!string.IsNullOrWhiteSpace(appMetadataClaim))
                {
                    using var doc = JsonDocument.Parse(appMetadataClaim);
                    if (doc.RootElement.TryGetProperty("role", out var roleElement) &&
                        roleElement.ValueKind == JsonValueKind.String)
                    {
                        var role = roleElement.GetString();
                        if (!string.IsNullOrWhiteSpace(role))
                        {
                            mappedRole = role.ToLowerInvariant();
                        }
                    }
                }

                // Hasura-style claims used by Supabase
                var hasuraClaim = identity.FindFirst("https://hasura.io/jwt/claims")?.Value;
                if (!string.IsNullOrWhiteSpace(hasuraClaim))
                {
                    using var doc = JsonDocument.Parse(hasuraClaim);
                    if (doc.RootElement.TryGetProperty("x-hasura-default-role", out var defaultRoleElement) &&
                        defaultRoleElement.ValueKind == JsonValueKind.String)
                    {
                        var role = defaultRoleElement.GetString();
                        if (!string.IsNullOrWhiteSpace(role))
                        {
                            mappedRole = role.ToLowerInvariant();
                        }
                    }
                }

                // If we found a mapped role and it's an app role, replace any existing generic role
                if (!string.IsNullOrWhiteSpace(mappedRole) &&
                    (mappedRole == "admin" || mappedRole == "teacher"))
                {
                    if (existingRoleClaim != null && !existingRoleIsAppRole)
                    {
                        identity.RemoveClaim(existingRoleClaim);
                    }
                    if (!identity.HasClaim(c => c.Type == ClaimTypes.Role && c.Value.Equals(mappedRole, StringComparison.OrdinalIgnoreCase)))
                    {
                        identity.AddClaim(new Claim(ClaimTypes.Role, mappedRole));
                    }
                }

                // Diagnostic: log claims to server console
                try
                {
                    var claimsDebug = string.Join(", ", identity.Claims.Select(c => $"{c.Type}={c.Value}"));
                    //Console.WriteLine($"[Auth] Token validated. Claims: {claimsDebug}");
                }
                catch { }
            }
            catch
            {
                // Swallow mapping errors to avoid failing auth if claim is missing
            }
            return Task.CompletedTask;
        }
    };
});


// Configure PostgreSQL with EF Core
var dbConnectionString = builder.Configuration.GetConnectionString("DefaultConnection");
if (string.IsNullOrWhiteSpace(dbConnectionString))
{
    throw new InvalidOperationException("Missing connection string: DefaultConnection");
}

var dataSourceBuilder = new NpgsqlDataSourceBuilder(dbConnectionString);
dataSourceBuilder.MapEnum<AdminNotificationType>("notification_type");
var dataSource = dataSourceBuilder.Build();

builder.Services.AddDbContext<AppDbContext>(options =>
{
    options.UseNpgsql(dataSource, npgsqlOptions =>
        npgsqlOptions.MapEnum<AdminNotificationType>("notification_type"));
    // Suppress pending model changes warning to allow startup despite migration issues
    options.ConfigureWarnings(w => w.Ignore(Microsoft.EntityFrameworkCore.Diagnostics.RelationalEventId.PendingModelChangesWarning));
});

// Configure Cloudinary
builder.Services.AddSingleton(provider => {
    var config = provider.GetRequiredService<IOptions<CloudinarySettings>>().Value;
    return new CloudinaryDotNet.Cloudinary(new Account(
        config.CloudName,
        config.ApiKey,
        config.ApiSecret
    ));
});

// Register Repositories
builder.Services.AddScoped<IQuestionRepository, QuestionRepository>();
builder.Services.AddScoped<ISubjectRepository, SubjectRepository>();
builder.Services.AddScoped<ISchoolRepository, SchoolRepository>();
builder.Services.AddScoped<ITypesetRepository, TypesetRepository>();
builder.Services.AddScoped<IPaperGenerationRepository, PaperGenerationRepository>();
builder.Services.AddScoped<IUserProfileRepository, UserProfileRepository>();
builder.Services.AddScoped<INotificationRepository, NotificationRepository>();
builder.Services.AddScoped<IPaperRepository, PaperRepository>();
builder.Services.AddScoped<IMarkingRepository, MarkingRepository>();
builder.Services.AddScoped<IPaperDownloadRepository, PaperDownloadRepository>();
builder.Services.AddScoped<ITypesetRequestRepository, TypesetRequestRepository>();

// Register Services
builder.Services.AddScoped<ICloudinaryService, CloudinaryService>();
builder.Services.AddScoped<ITypesetService, TypesetService>();
builder.Services.AddScoped<IPaperGenerationService, PaperGenerationService>();
builder.Services.AddScoped<IUserProfileService, UserProfileService>();
builder.Services.AddScoped<INotificationService, NotificationService>();
builder.Services.AddScoped<IPaperService, PaperService>();
builder.Services.AddScoped<IMarkingService, MarkingService>();
builder.Services.AddScoped<ITempFileService, TempFileService>();
builder.Services.AddScoped<IEmailService, EmailService>();
builder.Services.AddScoped<ITypesetRequestService, TypesetRequestService>();

// Payment services
builder.Services.AddScoped<backend.Services.Payment.Interfaces.IPaymentService, backend.Services.Payment.PaymentService>();
builder.Services.AddHttpClient<backend.Services.Payment.API.PaymentServerClient>();
builder.Services.AddScoped<backend.Services.Payment.API.PaymentServerClient>();
builder.Services.AddScoped<IDocumentMergeService, DocumentMergeService>();

// S2S webhook security
// NOTE: S2S verification is implemented via attributes (see RequireS2S / RequireJwtOrS2S)

// Add this line to register IHttpContextAccessor
builder.Services.AddHttpContextAccessor();

// Update QuestionService to accept new repositories and IHttpContextAccessor
builder.Services.AddScoped<IQuestionService, QuestionService>(provider =>
    new QuestionService(
        provider.GetRequiredService<IQuestionRepository>(),
        provider.GetRequiredService<ISubjectRepository>(),
        provider.GetRequiredService<ISchoolRepository>(),
        provider.GetRequiredService<Microsoft.AspNetCore.Http.IHttpContextAccessor>(),
        provider.GetRequiredService<ITypesetRepository>()
    ));

// Register HttpClient for API calls
builder.Services.AddHttpClient();

builder.Services.AddControllers();

// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "Question Upload API", Version = "v1" });
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "JWT Authorization header using the Bearer scheme. Example: \"Authorization: Bearer {token}\"",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });
    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                },
                Scheme = "oauth2",
                Name = "Bearer",
                In = ParameterLocation.Header,
            },
            new List<string>()
        }
    });
});

// Configure CORS PROPERLY
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend",
        policy =>
        {
            var defaultOrigins = new[]
            {
                "http://localhost:5173",
                "http://localhost:5174",
                "http://127.0.0.1:5173",
                "http://127.0.0.1:5174"
            };

            var extraOriginsRaw = Environment.GetEnvironmentVariable("CORS_ALLOWED_ORIGINS");
            var extraOrigins = string.IsNullOrWhiteSpace(extraOriginsRaw)
                ? Array.Empty<string>()
                : extraOriginsRaw
                    .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

            var allowedOrigins = defaultOrigins.Concat(extraOrigins).Distinct().ToArray();

            // Use SetIsOriginAllowed to technically allow any origin but with Credentials support
            // This is useful for development setups involving tunnels or varing ports
            policy.SetIsOriginAllowed(origin => true) 
                .AllowAnyHeader()
                .AllowAnyMethod()
                .AllowCredentials();
        });
});

var app = builder.Build();

// When running behind a reverse proxy/tunnel (e.g., DevTunnels), respect forwarded headers
// so HTTPS redirection doesn't bounce clients to localhost HTTPS ports.
var forwardedHeadersOptions = new ForwardedHeadersOptions
{
    ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto
};
forwardedHeadersOptions.KnownNetworks.Clear();
forwardedHeadersOptions.KnownProxies.Clear();
app.UseForwardedHeaders(forwardedHeadersOptions);

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    // Try applying EF Core migrations automatically in Development
    try
    {
        using var scope = app.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        db.Database.Migrate();
        Console.WriteLine("[DB] Migrations applied successfully.");
    }
    catch (Exception ex)
    {
        Console.WriteLine($"[DB] Migration failed: {ex.Message}");
    }

    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "Question Upload API V1");
        c.RoutePrefix = string.Empty;
    });
}

app.UseHttpsRedirection();

// Log incoming requests
app.Use(async (context, next) =>
{
    if (context.Request.Path.StartsWithSegments("/api/payments"))
    {
        Console.WriteLine($"[Middleware] Incoming {context.Request.Method} request to {context.Request.Path}");
        Console.WriteLine($"[Middleware] Origin: {context.Request.Headers["Origin"]}");
    }
    await next();
});

// CORS MUST come before routing and authentication
app.UseCors("AllowFrontend");

app.UseRouting();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();