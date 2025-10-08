using backend.DTOs;
using backend.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Security.Claims;
using System.Threading.Tasks;

namespace backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class TypesetsController : ControllerBase
    {
        private readonly ITypesetService _typesetService;
        private readonly IQuestionService _questionService;
        private readonly INotificationService _notificationService;
        private readonly ILogger<TypesetsController> _logger;

        public TypesetsController(
            ITypesetService typesetService,
            IQuestionService questionService,
            INotificationService notificationService,
            ILogger<TypesetsController> logger)
        {
            _typesetService = typesetService;
            _questionService = questionService;
            _notificationService = notificationService;
            _logger = logger;
        }

        /// <summary>
        /// Create or replace a typeset for a question (Admin only)
        /// </summary>
        [HttpPost]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> Upsert([FromBody] TypesetUploadDto dto)
        {
            try
            {
                if (dto.QuestionId == Guid.Empty || string.IsNullOrWhiteSpace(dto.FileUrl))
                {
                    return BadRequest(new { message = "QuestionId and FileUrl are required." });
                }

                var result = await _typesetService.UpsertAsync(dto);
                
                // Get user ID from JWT token
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value 
                          ?? User.FindFirst("sub")?.Value 
                          ?? User.FindFirst("userId")?.Value;

                if (!string.IsNullOrEmpty(userId) && result != null)
                {
                    // Get question details for comprehensive notification
                    var question = await _questionService.GetQuestionByIdAsync(dto.QuestionId);
                    var questionDetails = question != null 
                        ? BuildQuestionDetailsFromModel(question) 
                        : $"Question {dto.QuestionId}";

                    // 1. Notify uploader (admin who uploaded)
                    try
                    {
                        await _notificationService.CreateNotificationAsync(new CreateNotificationDto
                        {
                            UserId = userId,
                            Type = "success",
                            Title = "Typeset Uploaded Successfully",
                            Message = $"Typeset for {questionDetails} uploaded successfully",
                            Link = "/admin/typesets"
                        });
                        
                        _logger.LogInformation($"Created typeset notification for user {userId} - {questionDetails}");
                    }
                    catch (Exception notifEx)
                    {
                        _logger.LogError(notifEx, "Failed to create notification for uploader but continuing operation");
                    }

                    // 2. Broadcast to all admins
                    try
                    {
                        await _notificationService.CreateAdminNotificationAsync(
                            "info",
                            "New Typeset Uploaded",
                            $"New typeset uploaded for {questionDetails}",
                            "/admin/typesets"
                        );
                        
                        _logger.LogInformation($"Broadcasted typeset upload notification to all admins - {questionDetails}");
                    }
                    catch (Exception notifEx)
                    {
                        _logger.LogError(notifEx, "Failed to broadcast notification to admins but continuing operation");
                    }
                }

                return Ok(result);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                Console.Error.WriteLine($"Error upserting typeset: {ex.Message}");
                return StatusCode(500, new { message = "An error occurred while processing the typeset." });
            }
        }

        /// <summary>
        /// Get typeset by question ID (Admin and Teacher)
        /// </summary>
        [HttpGet("by-question/{questionId:guid}")]
        [Authorize(Roles = "admin,teacher")]
        public async Task<IActionResult> GetByQuestion(Guid questionId)
        {
            try
            {
                var typeset = await _typesetService.GetByQuestionIdAsync(questionId);
                
                if (typeset == null)
                {
                    return NotFound(new { message = $"No typeset found for question {questionId}." });
                }

                return Ok(typeset);
            }
            catch (Exception ex)
            {
                Console.Error.WriteLine($"Error fetching typeset: {ex.Message}");
                return StatusCode(500, new { message = "An error occurred while fetching the typeset." });
            }
        }

        /// <summary>
        /// Delete a typeset by ID (Admin only)
        /// </summary>
        [HttpDelete("{id:guid}")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> DeleteTypeset(Guid id)
        {
            try
            {
                var result = await _typesetService.DeleteAsync(id);
                
                if (!result)
                {
                    return NotFound(new { message = $"Typeset {id} not found." });
                }

                return NoContent();
            }
            catch (Exception ex)
            {
                Console.Error.WriteLine($"Error deleting typeset: {ex.Message}");
                return StatusCode(500, new { message = "An error occurred while deleting the typeset." });
            }
        }

        // ============= Helper Methods for Notification Formatting =============

        private string FormatExamType(string examType)
        {
            return examType?.ToLower() switch
            {
                "o_level" => "O-Level",
                "a_level" => "A-Level",
                "grade5" => "Grade 5",
                "gcse" => "GCSE",
                "igcse" => "IGCSE",
                _ => examType ?? "Unknown"
            };
        }

        private string? FormatStream(string? stream)
        {
            if (string.IsNullOrEmpty(stream)) return stream;
            
            return stream.ToLower() switch
            {
                "physical" => "Physical Science",
                "biological" => "Biological Science",
                "commerce" => "Commerce",
                "technology" => "Technology",
                "arts" => "Arts",
                _ => stream
            };
        }

        private string? FormatPaperType(string? paperType)
        {
            if (string.IsNullOrEmpty(paperType)) return paperType;
            
            return paperType.ToLower() switch
            {
                "mcq" => "MCQ",
                "essay" => "Essay",
                "practical" => "Practical",
                _ => paperType
            };
        }

        private string? FormatPaperCategory(string? paperCategory)
        {
            if (string.IsNullOrEmpty(paperCategory)) return paperCategory;
            
            return paperCategory.ToLower() switch
            {
                "past_papers" => "Past Paper",
                "model_papers" => "Model Paper",
                "provincial_papers" => "Provincial Paper",
                "school_papers" => "School Paper",
                _ => paperCategory
            };
        }

        private string BuildQuestionDetailsFromModel(QuestionResponseDto question)
        {
            // Prioritize: School + Term > Year > Subject + ExamType
            var parts = new List<string>();

            // Add subject and exam type (core info)
            if (question.Subject != null && !string.IsNullOrEmpty(question.Subject.Name))
            {
                parts.Add(question.Subject.Name);
            }
            
            var examType = FormatExamType(question.ExamType);
            parts.Add(examType);

            // Add year if available
            if (question.Year.HasValue && question.Year > 0)
            {
                parts.Add(question.Year.ToString()!);
            }

            // Build the main message
            var mainInfo = string.Join(" ", parts);
            
            // Add context from school and term (most meaningful)
            var schoolName = question.School?.Name;
            if (!string.IsNullOrEmpty(schoolName) && !string.IsNullOrEmpty(question.Term))
            {
                return $"{mainInfo} from {schoolName} {question.Term}";
            }
            else if (!string.IsNullOrEmpty(schoolName))
            {
                return $"{mainInfo} from {schoolName}";
            }
            else if (!string.IsNullOrEmpty(question.Term))
            {
                var category = FormatPaperCategory(question.PaperCategory);
                return $"{mainInfo} {question.Term} {category}";
            }
            else
            {
                var category = FormatPaperCategory(question.PaperCategory);
                return $"{mainInfo} {category}";
            }
        }
    }
}
