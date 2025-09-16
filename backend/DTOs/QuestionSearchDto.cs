namespace backend.DTOs
{
    public class QuestionSearchDto
    {
        public string? Country { get; set; }
        public string? ExamType { get; set; }
        public string? Stream { get; set; }
        public string? Subject { get; set; } // Will be subject name
        public string? PaperType { get; set; }
        public string? PaperCategory { get; set; }
        public int? Year { get; set; }
        public string? Term { get; set; }
        public string? SchoolName { get; set; } // Will be school name
    }
}