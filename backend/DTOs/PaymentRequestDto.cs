using System.ComponentModel.DataAnnotations;

namespace backend.DTOs
{
    public class PaymentRequestDto : IValidatableObject
    {
        [Required]
        [Range(0.01, double.MaxValue, ErrorMessage = "Amount must be greater than 0")]
        public decimal Amount { get; set; }

        public string PaperId { get; set; } = string.Empty;

        // Optional support for multi-paper payments. If provided, PaperId can be empty.
        public List<string> PaperIds { get; set; } = new();

        [Required]
        public string Currency { get; set; } = string.Empty;

        [Required]
        public string PaymentId { get; set; } = string.Empty;

        public List<string> QuestionsList { get; set; } = new();

        public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
        {
            var hasSingle = !string.IsNullOrWhiteSpace(PaperId);
            var hasList = PaperIds != null && PaperIds.Any(p => !string.IsNullOrWhiteSpace(p));

            if (!hasSingle && !hasList)
            {
                yield return new ValidationResult(
                    "Either PaperId or PaperIds must be provided.",
                    new[] { nameof(PaperId), nameof(PaperIds) }
                );
            }
        }
    }
}
