// File: Config/SupabaseSettings.cs
namespace backend.Config
{
    public class SupabaseSettings
    {
        public string ProjectUrl { get; set; } = string.Empty;
        public string JwtSecret { get; set; } = string.Empty;
        public string ServiceRoleKey { get; set; } = string.Empty;
        public string AnonKey { get; set; } = string.Empty;
    }
}