namespace backend.Config
{
    public class TempFilesSettings
    {
        public string Path { get; set; } = string.Empty;
        public int MaxFileSizeMB { get; set; } = 50;
    }
}
