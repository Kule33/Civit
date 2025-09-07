// backend/Helpers/KeyGenerator.cs
using backend.Models;
using System;
using System.Collections.Generic;
using System.Linq;

namespace backend.Helpers
{
    public static class KeyGenerator
    {
        /// <summary>
        /// Generates a unique key for a question based on its metadata and a timestamp.
        /// Format: Q-[COUNTRY]-[EXAM_TYPE]-[STREAM]-[SUBJECT]-[PAPER_TYPE]-[CATEGORY]-[YEAR]-[TERM]-[TIMESTAMP]
        /// </summary>
        /// <param name="question">The question entity containing metadata</param>
        /// <returns>A unique string key that identifies the question</returns>
        public static string GenerateUniqueQuestionKey(Question question)
        {
            var parts = new List<string> { "Q" }; // Prefix for Question

            // Always add Country and ExamType (required fields)
            parts.Add(CleanString(question.Country));
            parts.Add(CleanString(question.ExamType));

            // Conditionally add other parts if they exist (optional fields)
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

            // Add paper category (required field)
            parts.Add(CleanString(question.PaperCategory));

            // Add year if available (optional field)
            if (question.Year.HasValue)
            {
                parts.Add(question.Year.Value.ToString());
            }
            
            // Add term if available (optional field)
            if (!string.IsNullOrWhiteSpace(question.Term))
            {
                parts.Add(CleanString(question.Term));
            }

            // ✅ CRITICAL: Add unique timestamp to prevent duplicate keys
            // Using UTC ticks ensures each key is unique even for identical metadata
            parts.Add(DateTime.UtcNow.Ticks.ToString());

            // Join all non-empty parts with hyphens and convert to uppercase
            return string.Join("-", parts.Where(p => !string.IsNullOrWhiteSpace(p))).ToUpperInvariant();
        }

        /// <summary>
        /// Cleans and formats a string for use in the unique key
        /// - Removes special characters
        /// - Replaces spaces with underscores
        /// - Converts to uppercase
        /// </summary>
        /// <param name="input">The input string to clean</param>
        /// <returns>A cleaned and formatted string suitable for the key</returns>
        private static string CleanString(string? input)
        {
            if (string.IsNullOrWhiteSpace(input)) return string.Empty;
            
            // Remove non-alphanumeric characters (keep letters, numbers, and spaces)
            var cleaned = System.Text.RegularExpressions.Regex.Replace(input, @"[^a-zA-Z0-9\s]", "");
            
            // Replace spaces with underscores
            cleaned = cleaned.Replace(" ", "_");
            
            // Convert to uppercase for consistency
            return cleaned.ToUpperInvariant();
        }
    }
}