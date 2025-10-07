using backend.DTOs;
using System;
using System.Threading.Tasks;

namespace backend.Services.Interfaces
{
    public interface ITypesetService
    {
        Task<TypesetResponseDto?> GetByQuestionIdAsync(Guid questionId);
        Task<TypesetResponseDto> UpsertAsync(TypesetUploadDto dto);
        Task<bool> DeleteAsync(Guid id);
    }
}
