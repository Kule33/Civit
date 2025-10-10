namespace backend.DTOs
{
    public class PaperSearchDto
    {
        public string? Country { get; set; }
        public string? ExamType { get; set; }
        public string? Stream { get; set; }
        public string? Subject { get; set; }
        public string? PaperType { get; set; }
        public string? PaperCategory { get; set; }
        public int? Year { get; set; }
        public string? Term { get; set; }
        public string? SchoolName { get; set; }
    }
}
