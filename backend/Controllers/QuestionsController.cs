using backend.DTOs;
using backend.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using System.Linq;
using Microsoft.AspNetCore.Authorization; // NEW: For the [Authorize] attribute
using System.Security.Claims; // NEW: For accessing user claims
using Microsoft.Extensions.Logging;

namespace backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize] // NEW: Requires authentication for all endpoints in this controller by default
    public class QuestionsController : ControllerBase
    {
        private readonly IQuestionService _questionService;
        private readonly INotificationService _notificationService;
        private readonly ILogger<QuestionsController> _logger;

        public QuestionsController(
            IQuestionService questionService,
            INotificationService notificationService,
            ILogger<QuestionsController> logger)
        {
            _questionService = questionService;
            _notificationService = notificationService;
            _logger = logger;
        }

        [HttpPost("upload")]
        [Authorize(Roles = "admin")] // NEW: Only 'admin' role can upload
        public async Task<IActionResult> UploadQuestion(
            [FromBody] QuestionUploadDto? uploadDto,
            [FromQuery] int? batchIndex = null,
            [FromQuery] int? batchTotal = null)
        {
            // LOG BATCH PARAMETERS FIRST
            _logger.LogInformation("========================================");
            _logger.LogInformation($"📥 UPLOAD REQUEST - Batch Index: {batchIndex}, Batch Total: {batchTotal}");
            _logger.LogInformation($"📋 DTO Data - Subject: '{uploadDto?.Subject}', ExamType: '{uploadDto?.ExamType}', Year: {uploadDto?.Year}");
            _logger.LogInformation("========================================");
            
            if (uploadDto == null)
            {
                return BadRequest("Upload data is required");
            }

            // We can optionally check the role again here, or rely solely on the [Authorize] attribute.
            // For now, the attribute is sufficient.
            // Example of getting user ID if needed:
            // var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            // Console.WriteLine($"User {userId} (Role: {User.FindFirst(ClaimTypes.Role)?.Value}) attempting to upload.");

            Console.WriteLine($"Backend received: FileUrl='{uploadDto.FileUrl}', FilePublicId='{uploadDto.FilePublicId}' (Batch: {batchIndex}/{batchTotal})");

            // Automatically set the uploader email from the authenticated user's JWT token
            var uploaderEmail = User.FindFirst(ClaimTypes.Email)?.Value 
                             ?? User.FindFirst("email")?.Value;
            
            if (string.IsNullOrEmpty(uploaderEmail))
            {
                _logger.LogWarning("Could not extract email from JWT token");
            }
            else
            {
                uploadDto.Uploader = uploaderEmail; // Override with authenticated user's email
                _logger.LogInformation($"Setting uploader to: {uploaderEmail}");
            }

            try
            {
                var result = await _questionService.UploadQuestionAsync(uploadDto);
                
                // Get user ID from JWT token
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value 
                          ?? User.FindFirst("sub")?.Value 
                          ?? User.FindFirst("userId")?.Value;

                // Only send notifications if this is NOT part of a batch, OR if it's the last item in the batch
                bool shouldNotify = !batchIndex.HasValue || !batchTotal.HasValue || (batchIndex == batchTotal - 1);

                if (!string.IsNullOrEmpty(userId) && result != null && shouldNotify)
                {
                    // Build comprehensive notification message with all metadata
                    var questionDetails = BuildQuestionDetailsString(uploadDto);
                    
                    _logger.LogInformation($"Notification details: {questionDetails}");
                    
                    // If it's a batch upload, customize the message
                    string notificationMessage;
                    string broadcastMessage;
                    
                    if (batchTotal.HasValue && batchTotal > 1)
                    {
                        notificationMessage = $"{batchTotal} {questionDetails} questions added to question bank";
                        broadcastMessage = $"{batchTotal} new {questionDetails} questions added to question bank";
                        _logger.LogInformation($"Batch upload complete: {batchTotal} questions uploaded - Message: {notificationMessage}");
                    }
                    else
                    {
                        notificationMessage = $"{questionDetails} question added to question bank";
                        broadcastMessage = $"New {questionDetails} question added to question bank";
                    }

                    // 1. Notify uploader (admin who uploaded)
                    try
                    {
                        await _notificationService.CreateNotificationAsync(new CreateNotificationDto
                        {
                            UserId = userId,
                            Type = "success",
                            Title = batchTotal.HasValue && batchTotal > 1 ? "Questions Added Successfully" : "Question Added Successfully",
                            Message = notificationMessage,
                            Link = "/admin/manage-questions"
                        });
                        
                        _logger.LogInformation($"Created question notification for user {userId}");
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
                            batchTotal.HasValue && batchTotal > 1 ? "New Questions Uploaded" : "New Question Uploaded",
                            broadcastMessage,
                            "/admin/manage-questions"
                        );
                        
                        _logger.LogInformation("Broadcasted question creation notification to all admins");
                    }
                    catch (Exception notifEx)
                    {
                        _logger.LogError(notifEx, "Failed to broadcast notification to admins but continuing operation");
                    }

                    // 3. Broadcast to all teachers
                    try
                    {
                        var teachersNotified = await _notificationService.CreateTeacherBroadcastNotificationAsync(
                            batchTotal.HasValue && batchTotal > 1 ? "New Questions Available" : "New Question Available",
                            broadcastMessage,
                            "/teacher/paper-generation"
                        );
                        
                        _logger.LogInformation($"Broadcasted question creation notification to {teachersNotified} teachers");
                    }
                    catch (Exception notifEx)
                    {
                        _logger.LogError(notifEx, "Failed to broadcast notification to teachers but continuing operation");
                    }
                }
                else if (!shouldNotify)
                {
                    _logger.LogInformation($"Skipping notification for batch item {batchIndex + 1}/{batchTotal}");
                }

                return Ok(result);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(ex.Message);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        [HttpGet("{id}")]
        [Authorize] // Any authenticated user can get a specific question
        public async Task<IActionResult> GetQuestion(Guid id)
        {
            // The [Authorize] attribute handles access. No explicit role check needed here.
            var question = await _questionService.GetQuestionByIdAsync(id);
            if (question == null)
            {
                return NotFound();
            }
            return Ok(question);
        }

        [HttpGet]
        [Authorize] // Any authenticated user can filter/search questions
        public async Task<IActionResult> GetFilteredQuestions([FromQuery] QuestionSearchDto searchDto)
        {
            try
            {
                var questions = await _questionService.GetFilteredQuestionsAsync(searchDto);
                return Ok(questions);
            }
            catch (Exception ex)
            {
                Console.Error.WriteLine($"Error fetching filtered questions: {ex.Message}");
                return StatusCode(500, "An error occurred while fetching questions. Please try again later.");
            }
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "admin")] // NEW: Only 'admin' role can delete
        public async Task<IActionResult> DeleteQuestion(Guid id)
        {
            // Get question details before deletion for notification
            var question = await _questionService.GetQuestionByIdAsync(id);
            if (question == null)
            {
                return NotFound();
            }

            var result = await _questionService.DeleteQuestionAsync(id);
            if (!result)
            {
                return NotFound();
            }

            // Broadcast deletion notification to all admins
            try
            {
                var questionDetails = BuildQuestionDetailsFromModel(question);
                
                await _notificationService.CreateAdminNotificationAsync(
                    "warning",
                    "Question Deleted",
                    $"{questionDetails} question removed from question bank",
                    "/admin/manage-questions"
                );
                
                _logger.LogInformation($"Broadcasted deletion notification to all admins for question {id} - {questionDetails}");
            }
            catch (Exception notifEx)
            {
                _logger.LogError(notifEx, "Failed to broadcast deletion notification to admins but continuing operation");
            }

            return NoContent();
        }

        // Assuming these are generally accessible, but still need authentication
        // If these should be admin/teacher specific, add [Authorize(Roles = "admin,teacher")]
        [HttpGet("subjects")]
        [Authorize] // Any authenticated user can access subjects
        public async Task<IActionResult> GetAllSubjects()
        {
            var subjects = await _questionService.GetAllSubjectsAsync();
            return Ok(subjects);
        }

        [HttpGet("subjects/{id}")]
        [Authorize] // Any authenticated user can access specific subject
        public async Task<IActionResult> GetSubjectById(int id)
        {
            var subject = await _questionService.GetSubjectByIdAsync(id);
            if (subject == null)
            {
                return NotFound();
            }
            return Ok(subject);
        }

        [HttpGet("schools")]
        [Authorize] // Any authenticated user can access schools
        public async Task<IActionResult> GetAllSchools()
        {
            var schools = await _questionService.GetAllSchoolsAsync();
            return Ok(schools);
        }

        [HttpGet("schools/{id}")]
        [Authorize] // Any authenticated user can access specific school
        public async Task<IActionResult> GetSchoolById(int id)
        {
            var school = await _questionService.GetSchoolByIdAsync(id);
            if (school == null)
            {
                return NotFound();
            }
            return Ok(school);
        }

        // Helper method to format exam type for notifications
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

        // Helper method to format stream for notifications
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

        // Helper method to format paper type for notifications
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

        // Helper method to format paper category for notifications
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

        // Build meaningful notification message for question uploads
        private string BuildQuestionDetailsString(QuestionUploadDto uploadDto)
        {
            // Prioritize: School + Term > Year > Subject + ExamType
            var parts = new List<string>();

            // Add subject and exam type (core info)
            if (!string.IsNullOrEmpty(uploadDto.Subject))
            {
                parts.Add(uploadDto.Subject);
            }
            
            var examType = FormatExamType(uploadDto.ExamType);
            parts.Add(examType);

            // Add year if available
            if (uploadDto.Year.HasValue && uploadDto.Year > 0)
            {
                parts.Add(uploadDto.Year.ToString()!);
            }

            // Build the main message
            var mainInfo = string.Join(" ", parts);
            
            // Add context from school and term (most meaningful)
            if (!string.IsNullOrEmpty(uploadDto.SchoolName) && !string.IsNullOrEmpty(uploadDto.Term))
            {
                return $"{mainInfo} from {uploadDto.SchoolName} {uploadDto.Term}";
            }
            else if (!string.IsNullOrEmpty(uploadDto.SchoolName))
            {
                return $"{mainInfo} from {uploadDto.SchoolName}";
            }
            else if (!string.IsNullOrEmpty(uploadDto.Term))
            {
                var category = FormatPaperCategory(uploadDto.PaperCategory);
                return $"{mainInfo} {uploadDto.Term} {category}";
            }
            else
            {
                var category = FormatPaperCategory(uploadDto.PaperCategory);
                return $"{mainInfo} {category}";
            }
        }

        // Build meaningful notification message from QuestionResponseDto (for delete and typeset notifications)
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