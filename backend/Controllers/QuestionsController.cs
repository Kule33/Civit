using backend.DTOs;
using backend.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Threading.Tasks;
using System.Linq;
using Microsoft.AspNetCore.Authorization; // NEW: For the [Authorize] attribute
using System.Security.Claims; // NEW: For accessing user claims

namespace backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize] // NEW: Requires authentication for all endpoints in this controller by default
    public class QuestionsController : ControllerBase
    {
        private readonly IQuestionService _questionService;

        public QuestionsController(IQuestionService questionService)
        {
            _questionService = questionService;
        }

        [HttpPost("upload")]
        [Authorize(Roles = "admin")] // NEW: Only 'admin' role can upload
        public async Task<IActionResult> UploadQuestion([FromBody] QuestionUploadDto? uploadDto)
        {
            if (uploadDto == null)
            {
                return BadRequest("Upload data is required");
            }

            // We can optionally check the role again here, or rely solely on the [Authorize] attribute.
            // For now, the attribute is sufficient.
            // Example of getting user ID if needed:
            // var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            // Console.WriteLine($"User {userId} (Role: {User.FindFirst(ClaimTypes.Role)?.Value}) attempting to upload.");

            Console.WriteLine($"Backend received: FileUrl='{uploadDto.FileUrl}', FilePublicId='{uploadDto.FilePublicId}'");

            try
            {
                var result = await _questionService.UploadQuestionAsync(uploadDto);
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
            var result = await _questionService.DeleteQuestionAsync(id);
            if (!result)
            {
                return NotFound();
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
    }
}