// backend/Helpers/KeyGenerator.cs
using backend.Models;
using System;

namespace backend.Helpers
{
    public static class KeyGenerator
    {
        public static string GenerateUniqueQuestionKey(Question question)
        {
            // Example format: Q-[COUNTRY]-[EXAM_TYPE]-[STREAM]-[SUBJECT]-[PAPER_TYPE]-[CATEGORY]-[YEAR]-[TERM]
            // We'll clean up and concatenate available metadata.

            var parts = new List<string> { "Q" }; // Prefix for Question

            // Always add Country and ExamType
            parts.Add(CleanString(question.Country));
            parts.Add(CleanString(question.ExamType));

            // Conditionally add other parts if they exist
            if (!string.IsNullOrWhiteSpace(question.Stream))
            {
                parts.Add(CleanString(question.Stream));
            }
            if (!string.IsNullOrWhiteSpace(question.Subject))
            {
                parts.Add(CleanString(question.Subject));
            }
            if (!string.IsNullOrWhiteSpace(question.PaperType))
            {
                parts.Add(CleanString(question.PaperType));
            }

            parts.Add(CleanString(question.PaperCategory));

            if (question.Year.HasValue)
            {
                parts.Add(question.Year.Value.ToString());
            }
            if (!string.IsNullOrWhiteSpace(question.Term))
            {
                parts.Add(CleanString(question.Term));
            }

            // Join all parts with a hyphen and convert to uppercase
            return string.Join("-", parts.Where(p => !string.IsNullOrWhiteSpace(p))).ToUpperInvariant();
        }

        private static string CleanString(string? input)
        {
            if (string.IsNullOrWhiteSpace(input)) return string.Empty;
            // Remove non-alphanumeric characters, replace spaces with underscores, and convert to uppercase
            return System.Text.RegularExpressions.Regex.Replace(input, @"[^a-zA-Z0-9\s]", "")
                                                .Replace(" ", "_")
                                                .ToUpperInvariant();
        }
    }
}