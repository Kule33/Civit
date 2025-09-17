using backend.DTOs;
using backend.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Threading.Tasks;
using System.Linq; // Needed for Where if you re-add GetAllQuestions later

namespace backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class QuestionsController : ControllerBase
    {
        private readonly IQuestionService _questionService;

        public QuestionsController(IQuestionService questionService)
        {
            _questionService = questionService;
        }

        [HttpPost("upload")]
        public async Task<IActionResult> UploadQuestion([FromBody] QuestionUploadDto? uploadDto)
        {
            if (uploadDto == null)
            {
                return BadRequest("Upload data is required");
            }

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
        public async Task<IActionResult> GetQuestion(Guid id)
        {
            var question = await _questionService.GetQuestionByIdAsync(id);
            if (question == null)
            {
                return NotFound();
            }
            return Ok(question);
        }

        // MODIFIED: This GET endpoint now accepts query parameters
        [HttpGet]
        public async Task<IActionResult> GetFilteredQuestions([FromQuery] QuestionSearchDto searchDto)
        {
            try
            {
                var questions = await _questionService.GetFilteredQuestionsAsync(searchDto);
                return Ok(questions);
            }
            catch (Exception ex)
            {
                // Log the exception details
                Console.Error.WriteLine($"Error fetching filtered questions: {ex.Message}");
                return StatusCode(500, "An error occurred while fetching questions. Please try again later.");
            }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteQuestion(Guid id)
        {
            var result = await _questionService.DeleteQuestionAsync(id);
            if (!result)
            {
                return NotFound();
            }
            return NoContent();
        }

        [HttpGet("subjects")]
        public async Task<IActionResult> GetAllSubjects()
        {
            var subjects = await _questionService.GetAllSubjectsAsync();
            return Ok(subjects);
        }

        [HttpGet("subjects/{id}")]
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
        public async Task<IActionResult> GetAllSchools()
        {
            var schools = await _questionService.GetAllSchoolsAsync();
            return Ok(schools);
        }

        [HttpGet("schools/{id}")]
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