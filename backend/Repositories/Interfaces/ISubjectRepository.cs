// backend/Repositories/Interfaces/ISubjectRepository.cs
using backend.Models;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace backend.Repositories.Interfaces
{
    public interface ISubjectRepository
    {
        Task<Subject> AddSubjectAsync(Subject subject);
        Task<Subject?> GetSubjectByIdAsync(int id);
        Task<Subject?> GetSubjectByNameAsync(string name);
        Task<IEnumerable<Subject>> GetAllSubjectsAsync();
        Task<bool> UpdateSubjectAsync(Subject subject);
        Task<bool> DeleteSubjectAsync(int id);
    }
}
