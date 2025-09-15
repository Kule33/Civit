namespace backend.DTOs
{
    public class QuestionFilterDto
    {
        public string? Country { get; set; }
        public string? ExamType { get; set; }
        public string? Subject { get; set; }
        public string? PaperType { get; set; }
        public int? Year { get; set; }
        public string? Term { get; set; }
        public string? School { get; set; }
    }
}