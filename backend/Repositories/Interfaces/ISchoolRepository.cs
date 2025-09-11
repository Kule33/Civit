// backend/Repositories/Interfaces/ISchoolRepository.cs
using backend.Models;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace backend.Repositories.Interfaces
{
    public interface ISchoolRepository
    {
        Task<School> AddSchoolAsync(School school);
        Task<School?> GetSchoolByIdAsync(int id);
        Task<School?> GetSchoolByNameAsync(string name);
        Task<IEnumerable<School>> GetAllSchoolsAsync();
        Task<bool> UpdateSchoolAsync(School school);
        Task<bool> DeleteSchoolAsync(int id);
    }
}