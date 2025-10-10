using backend.Config; // This line is crucial for SupabaseSettings
using backend.Data;
using backend.Repositories;
using backend.Repositories.Interfaces;
using backend.Services;
using backend.Services.Interfaces;
using Microsoft.EntityFrameworkCore;
using CloudinaryDotNet;
using Microsoft.OpenApi.Models;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using Microsoft.Extensions.Options; // Ensure this is present if using IOptions<T> elsewhere
using System.Security.Claims;
using System.Text.Json;

// Load environment variables from .env if present
try
{
    DotNetEnv.Env.Load();
}
catch { }

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

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.

// Configure AppSettings
builder.Services.Configure<CloudinarySettings>(builder.Configuration.GetSection("CloudinarySettings"));

// Configure SupabaseSettings - this will correctly pick up from environment variables now
builder.Services.Configure<SupabaseSettings>(builder.Configuration.GetSection("Supabase"));

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
                    Console.WriteLine($"[Auth] Token validated. Claims: {claimsDebug}");
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
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

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

// Register Services
builder.Services.AddScoped<ICloudinaryService, CloudinaryService>();
builder.Services.AddScoped<ITypesetService, TypesetService>();
builder.Services.AddScoped<IPaperGenerationService, PaperGenerationService>();
builder.Services.AddScoped<IUserProfileService, UserProfileService>();
builder.Services.AddScoped<INotificationService, NotificationService>();
builder.Services.AddScoped<IPaperService, PaperService>();
builder.Services.AddScoped<IMarkingService, MarkingService>();

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
            policy.WithOrigins(
                      "http://localhost:5173",
                      "http://localhost:5174",
                      "http://127.0.0.1:5173",
                      "http://127.0.0.1:5174"
                  )
                  .AllowAnyHeader()
                  .AllowAnyMethod();
        });
});

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "Question Upload API V1");
        c.RoutePrefix = string.Empty;
    });
}

app.UseHttpsRedirection();

app.UseRouting();

app.UseCors("AllowFrontend");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();