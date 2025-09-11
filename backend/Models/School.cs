using System.ComponentModel.DataAnnotations;
using System.Collections.Generic;

namespace backend.Models
{
    public class School
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [StringLength(500)]
        public string Name { get; set; } = string.Empty;

        // Navigation property back to Questions
        public virtual ICollection<Question> Questions { get; set; } = new List<Question>();
    }
}