using backend.Config;
using backend.Data;
using backend.Repositories;
using backend.Repositories.Interfaces;
using backend.Services;
using backend.Services.Interfaces;
using Microsoft.EntityFrameworkCore;
using CloudinaryDotNet;
using Microsoft.OpenApi.Models;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.

// Configure AppSettings
builder.Services.Configure<CloudinarySettings>(builder.Configuration.GetSection("CloudinarySettings"));

// Configure PostgreSQL with EF Core
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

// Configure Cloudinary
builder.Services.AddSingleton(provider => {
    var config = provider.GetRequiredService<Microsoft.Extensions.Options.IOptions<CloudinarySettings>>().Value;
    return new CloudinaryDotNet.Cloudinary(new Account(
        config.CloudName,
        config.ApiKey,
        config.ApiSecret
    ));
});

// Register Repositories
builder.Services.AddScoped<IQuestionRepository, QuestionRepository>();
builder.Services.AddScoped<ISubjectRepository, SubjectRepository>(); // Register new Subject Repository
builder.Services.AddScoped<ISchoolRepository, SchoolRepository>();   // Register new School Repository

// Register Services
builder.Services.AddScoped<ICloudinaryService, CloudinaryService>();

// Update QuestionService to accept new repositories
builder.Services.AddScoped<IQuestionService, QuestionService>(provider =>
    new QuestionService(
        provider.GetRequiredService<IQuestionRepository>(),
        provider.GetRequiredService<ISubjectRepository>(), // Pass Subject Repository
        provider.GetRequiredService<ISchoolRepository>()   // Pass School Repository
    ));

builder.Services.AddControllers();

// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "Question Upload API", Version = "v1" });
});

// Configure CORS PROPERLY
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend",
        policy =>
        {
            policy.WithOrigins("http://localhost:5173") // Your React frontend URL
                  .AllowAnyHeader()
                  .AllowAnyMethod();
            // If you need to allow credentials (cookies, auth tokens), add:
            // .AllowCredentials();
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

app.UseRouting(); // Important: Must be before UseCors

app.UseCors("AllowFrontend"); // Use the specific policy name

app.UseAuthorization();

app.MapControllers();

app.Run();