using backend.DTOs;
using backend.Models;
using backend.Repositories.Interfaces;
using backend.Services.Interfaces;
using System;
using System.Threading.Tasks;

namespace backend.Services
{
    public class TypesetService : ITypesetService
    {
        private readonly ITypesetRepository _typesetRepository;
        private readonly IQuestionRepository _questionRepository;

        public TypesetService(ITypesetRepository typesetRepository, IQuestionRepository questionRepository)
        {
            _typesetRepository = typesetRepository;
            _questionRepository = questionRepository;
        }

        public async Task<TypesetResponseDto?> GetByQuestionIdAsync(Guid questionId)
        {
            var typeset = await _typesetRepository.GetByQuestionIdAsync(questionId);
            return typeset == null ? null : MapToDto(typeset);
        }

        public async Task<TypesetResponseDto> UpsertAsync(TypesetUploadDto dto)
        {
            // Validate inputs
            if (dto.QuestionId == Guid.Empty)
            {
                throw new ArgumentException("QuestionId is required.");
            }

            if (string.IsNullOrWhiteSpace(dto.FileUrl))
            {
                throw new ArgumentException("FileUrl is required.");
            }

            // Validate that question exists
            var question = await _questionRepository.GetQuestionByIdAsync(dto.QuestionId);
            if (question == null)
            {
                throw new ArgumentException($"Question with ID '{dto.QuestionId}' not found.");
            }

            // Map DTO to entity
            var typeset = new Typeset
            {
                QuestionId = dto.QuestionId,
                FileUrl = dto.FileUrl,
                FilePublicId = dto.FilePublicId,
                FileName = dto.FileName,
                IsActive = true
            };

            // Upsert
            var saved = await _typesetRepository.UpsertAsync(typeset);
            return MapToDto(saved);
        }

        public async Task<bool> DeleteAsync(Guid id)
        {
            var typeset = await _typesetRepository.GetByIdAsync(id);
            if (typeset == null)
            {
                return false;
            }

            return await _typesetRepository.DeleteAsync(id);
        }

        private static TypesetResponseDto MapToDto(Typeset typeset)
        {
            return new TypesetResponseDto
            {
                Id = typeset.Id,
                QuestionId = typeset.QuestionId,
                FileUrl = typeset.FileUrl,
                FilePublicId = typeset.FilePublicId,
                FileName = typeset.FileName,
                Version = typeset.Version,
                IsActive = typeset.IsActive,
                UploadedAt = typeset.UploadedAt
            };
        }
    }
}
