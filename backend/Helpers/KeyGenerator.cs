// backend/Helpers/KeyGenerator.cs
using backend.Models;
using System;
using System.Globalization;

namespace backend.Helpers
{
    public static class KeyGenerator
    {
        public static string GenerateUniqueQuestionKey(Question question)
        {
            // Use fallback "UNKNOWN" if properties are null or empty
            string country = string.IsNullOrEmpty(question.Country) ? "UNKNOWN" : question.Country.Replace(" ", "_").ToUpperInvariant();
            string examType = string.IsNullOrEmpty(question.ExamType) ? "UNKNOWN" : question.ExamType.Replace(" ", "_").ToUpperInvariant();
            string stream = string.IsNullOrEmpty(question.Stream) ? "NA" : question.Stream.Replace(" ", "_").ToUpperInvariant();
            
            // Access the Name property of the Subject navigation property
            string subject = string.IsNullOrEmpty(question.Subject?.Name) ? "NA" : question.Subject.Name.Replace(" ", "_").ToUpperInvariant();
            
            string paperType = string.IsNullOrEmpty(question.PaperType) ? "NA" : question.PaperType.Replace(" ", "_").ToUpperInvariant();
            string paperCategory = string.IsNullOrEmpty(question.PaperCategory) ? "UNKNOWN" : question.PaperCategory.Replace(" ", "_").ToUpperInvariant();
            string year = question.Year?.ToString() ?? "NA";
            string term = string.IsNullOrEmpty(question.Term) ? "NA" : question.Term.Replace(" ", "_").ToUpperInvariant();
            
            // Access the Name property of the School navigation property
            string schoolName = string.IsNullOrEmpty(question.School?.Name) ? "NA" : question.School.Name.Replace(" ", "_").ToUpperInvariant();

            // Uploader is optional and might be dynamic, use a placeholder if not provided
            string uploader = string.IsNullOrEmpty(question.Uploader) ? "ANON" : question.Uploader.Replace(" ", "_").ToUpperInvariant();

            // Include a timestamp component to ensure uniqueness for identical metadata
            string timestamp = DateTime.UtcNow.ToString("yyyyMMddHHmmssfff", CultureInfo.InvariantCulture);

            // Construct the key
            return $"Q-{country}-{examType}-{stream}-{subject}-{paperType}-{paperCategory}-{year}-{term}-{schoolName}-{uploader}-{timestamp}";
        }
    }
}