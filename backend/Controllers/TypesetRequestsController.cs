using backend.DTOs;
using backend.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using System.Security.Claims;
using System.Threading.Tasks;

namespace backend.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/typeset-requests")]
    public class TypesetRequestsController : ControllerBase
    {
        private readonly ITypesetRequestService _typesetRequestService;
        private readonly ILogger<TypesetRequestsController> _logger;

        public TypesetRequestsController(
            ITypesetRequestService typesetRequestService,
            ILogger<TypesetRequestsController> logger)
        {
            _typesetRequestService = typesetRequestService;
            _logger = logger;
        }

        // POST: api/typeset-requests
        [HttpPost]
        public async Task<ActionResult<TypesetRequestResponseDto>> CreateRequest([FromBody] TypesetRequestCreateDto dto)
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userId))
                {
                    return Unauthorized("User ID not found in token");
                }

                // Check if user can create request (rate limiting)
                if (!await _typesetRequestService.CanUserCreateRequestAsync(userId))
                {
                    return StatusCode(429, new { error = "Daily limit of typeset requests exceeded. Please try again tomorrow." });
                }

                var result = await _typesetRequestService.CreateRequestAsync(userId, dto);
                _logger.LogInformation($"User {userId} created typeset request #{result.Id}");

                return CreatedAtAction(nameof(GetRequestById), new { id = result.Id }, result);
            }
            catch (InvalidOperationException ex)
            {
                _logger.LogWarning($"Invalid operation: {ex.Message}");
                return BadRequest(new { error = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating typeset request");
                return StatusCode(500, new { error = "An error occurred while creating the typeset request" });
            }
        }

        // GET: api/typeset-requests/my-requests
        [HttpGet("my-requests")]
        public async Task<ActionResult<IEnumerable<TypesetRequestListDto>>> GetMyRequests()
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userId))
                {
                    return Unauthorized("User ID not found in token");
                }

                var requests = await _typesetRequestService.GetUserRequestsAsync(userId);
                return Ok(requests);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving user's typeset requests");
                return StatusCode(500, new { error = "An error occurred while retrieving your requests" });
            }
        }

        // GET: api/typeset-requests/{id}
        [HttpGet("{id}")]
        public async Task<ActionResult<TypesetRequestResponseDto>> GetRequestById(int id)
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userId))
                {
                    return Unauthorized("User ID not found in token");
                }

                var isAdmin = User.IsInRole("admin");
                var request = await _typesetRequestService.GetRequestByIdAsync(id, userId, isAdmin);

                if (request == null)
                {
                    return NotFound(new { error = "Typeset request not found" });
                }

                return Ok(request);
            }
            catch (UnauthorizedAccessException ex)
            {
                _logger.LogWarning($"Unauthorized access attempt: {ex.Message}");
                return Forbid();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error retrieving typeset request #{id}");
                return StatusCode(500, new { error = "An error occurred while retrieving the request" });
            }
        }

        // GET: api/typeset-requests (Admin only)
        [HttpGet]
        [Authorize(Roles = "admin")]
        public async Task<ActionResult<IEnumerable<TypesetRequestResponseDto>>> GetAllRequests([FromQuery] string? status = null)
        {
            try
            {
                var requests = await _typesetRequestService.GetAllRequestsAsync(status);
                return Ok(requests);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving all typeset requests");
                return StatusCode(500, new { error = "An error occurred while retrieving requests" });
            }
        }

        // PUT: api/typeset-requests/{id}/status (Admin only)
        [HttpPut("{id}/status")]
        [Authorize(Roles = "admin")]
        public async Task<ActionResult> UpdateRequestStatus(int id, [FromBody] TypesetRequestUpdateDto dto)
        {
            try
            {
                var adminEmail = User.FindFirst(ClaimTypes.Email)?.Value ?? "admin";
                var updated = await _typesetRequestService.UpdateRequestStatusAsync(id, dto, adminEmail);

                if (!updated)
                {
                    return NotFound(new { error = "Typeset request not found" });
                }

                _logger.LogInformation($"Admin {adminEmail} updated typeset request #{id} status to {dto.Status}");
                return NoContent();
            }
            catch (InvalidOperationException ex)
            {
                _logger.LogWarning($"Invalid operation: {ex.Message}");
                return BadRequest(new { error = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error updating typeset request #{id}");
                return StatusCode(500, new { error = "An error occurred while updating the request" });
            }
        }

        // DELETE: api/typeset-requests/{id}
        [HttpDelete("{id}")]
        public async Task<ActionResult> DeleteRequest(int id)
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userId))
                {
                    return Unauthorized("User ID not found in token");
                }

                var isAdmin = User.IsInRole("admin");
                var deleted = await _typesetRequestService.DeleteRequestAsync(id, userId, isAdmin);

                if (!deleted)
                {
                    return NotFound(new { error = "Typeset request not found" });
                }

                _logger.LogInformation($"Deleted typeset request #{id}");
                return NoContent();
            }
            catch (UnauthorizedAccessException ex)
            {
                _logger.LogWarning($"Unauthorized access attempt: {ex.Message}");
                return Forbid();
            }
            catch (InvalidOperationException ex)
            {
                _logger.LogWarning($"Invalid operation: {ex.Message}");
                return BadRequest(new { error = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error deleting typeset request #{id}");
                return StatusCode(500, new { error = "An error occurred while deleting the request" });
            }
        }

        // GET: api/typeset-requests/can-create
        [HttpGet("can-create")]
        public async Task<ActionResult<bool>> CanCreateRequest()
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userId))
                {
                    return Unauthorized("User ID not found in token");
                }

                var canCreate = await _typesetRequestService.CanUserCreateRequestAsync(userId);
                return Ok(new { canCreate });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking if user can create request");
                return StatusCode(500, new { error = "An error occurred while checking request eligibility" });
            }
        }
    }
}
