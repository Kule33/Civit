using backend.DTOs;
using backend.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Cors;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [EnableCors("AllowFrontend")]
    public class QuestionsController : ControllerBase
    {
        private readonly IQuestionService _questionService;

        public QuestionsController(IQuestionService questionService)
        {
            _questionService = questionService;
        }

        [HttpPost]
        [Consumes("application/json")] // Changed from multipart/form-data
        public async Task<ActionResult<QuestionResponseDto>> UploadQuestion([FromBody] QuestionUploadDto uploadDto)
        {
            // Debug logging
            Console.WriteLine("=== UPLOAD REQUEST RECEIVED ===");
            Console.WriteLine($"Country: {uploadDto?.Country}");
            Console.WriteLine($"ExamType: {uploadDto?.ExamType}");
            Console.WriteLine($"Subject: {uploadDto?.Subject}");
            Console.WriteLine($"PaperCategory: {uploadDto?.PaperCategory}");
            Console.WriteLine($"FileUrl: {uploadDto?.FileUrl}");
            Console.WriteLine("==============================");

            if (!ModelState.IsValid)
            {
                Console.WriteLine("Model validation failed:");
                foreach (var key in ModelState.Keys)
                {
                    var state = ModelState[key];
                    if (state.Errors.Count > 0)
                    {
                        Console.WriteLine($"- {key}: {string.Join(", ", state.Errors.Select(e => e.ErrorMessage))}");
                    }
                }
                return BadRequest(ModelState);
            }

            try
            {
                var result = await _questionService.UploadQuestionAsync(uploadDto);
                return CreatedAtAction(nameof(GetQuestionById), new { id = result.Id }, result);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Exception in UploadQuestion: {ex.Message}");
                return StatusCode(500, $"An error occurred while uploading the question: {ex.Message}");
            }
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<QuestionResponseDto>> GetQuestionById(Guid id)
        {
            try
            {
                var question = await _questionService.GetQuestionByIdAsync(id);
                return question == null ? NotFound($"Question with ID {id} not found.") : Ok(question);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"An error occurred while retrieving the question: {ex.Message}");
            }
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<QuestionResponseDto>>> GetAllQuestions()
        {
            try
            {
                var questions = await _questionService.GetAllQuestionsAsync();
                return Ok(questions);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"An error occurred while retrieving questions: {ex.Message}");
            }
        }

        [HttpDelete("{id}")]
        public async Task<ActionResult> DeleteQuestion(Guid id)
        {
            try
            {
                var isDeleted = await _questionService.DeleteQuestionAsync(id);
                return !isDeleted ? NotFound($"Question with ID {id} not found.") : NoContent();
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"An error occurred while deleting the question: {ex.Message}");
            }
        }

        // Test endpoint
        [HttpPost("test")]
        public IActionResult TestEndpoint([FromForm] string message)
        {
            Console.WriteLine($"Test endpoint called with: {message}");
            return Ok(new { response = $"Backend received: {message}", timestamp = DateTime.UtcNow });
        }
    }
}