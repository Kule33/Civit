using backend.DTOs;
using backend.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Threading.Tasks;

namespace backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class TypesetsController : ControllerBase
    {
        private readonly ITypesetService _typesetService;

        public TypesetsController(ITypesetService typesetService)
        {
            _typesetService = typesetService;
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
    }
}
