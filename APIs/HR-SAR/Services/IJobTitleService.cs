using HR_SAR.DTOs;

namespace HR_SAR.Services;

public interface IJobTitleService
{
    Task<IEnumerable<JobTitleDto>> GetAllAsync(string? search);
    Task<JobTitleDto?> GetByIdAsync(Guid id);
    Task<JobTitleDto> CreateAsync(CreateJobTitleDto dto);
    Task<JobTitleDto?> UpdateAsync(Guid id, UpdateJobTitleDto dto);
    Task<bool> DeleteAsync(Guid id);
}
