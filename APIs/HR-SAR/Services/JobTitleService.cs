using Microsoft.EntityFrameworkCore;
using HR_SAR.Data;
using HR_SAR.DTOs;
using HR_SAR.Models;

namespace HR_SAR.Services;

public class JobTitleService(AppDbContext db) : IJobTitleService
{
    public async Task<IEnumerable<JobTitleDto>> GetAllAsync(string? search)
    {
        var query = db.JobTitles.Include(j => j.Positions).AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.ToLower();
            query = query.Where(j =>
                j.NameAr.ToLower().Contains(s) ||
                j.NameEn.ToLower().Contains(s) ||
                j.Code.ToLower().Contains(s));
        }

        var list = await query.OrderBy(j => j.NameAr).ToListAsync();
        return list.Select(ToDto);
    }

    public async Task<JobTitleDto?> GetByIdAsync(Guid id)
    {
        var j = await db.JobTitles.Include(x => x.Positions).FirstOrDefaultAsync(x => x.Id == id);
        return j is null ? null : ToDto(j);
    }

    public async Task<JobTitleDto> CreateAsync(CreateJobTitleDto dto)
    {
        if (await db.JobTitles.AnyAsync(j => j.Code == dto.Code))
            throw new InvalidOperationException("كود المسمى الوظيفي مستخدم بالفعل");

        var jt = new JobTitle
        {
            NameAr             = dto.NameAr,
            NameEn             = dto.NameEn,
            Code               = dto.Code,
            Description        = dto.Description,
            ClassificationCode = dto.ClassificationCode,
            Level              = dto.Level,
        };

        db.JobTitles.Add(jt);
        await db.SaveChangesAsync();
        return ToDto(jt);
    }

    public async Task<JobTitleDto?> UpdateAsync(Guid id, UpdateJobTitleDto dto)
    {
        var jt = await db.JobTitles.Include(j => j.Positions).FirstOrDefaultAsync(j => j.Id == id);
        if (jt is null) return null;

        if (dto.Code is not null && dto.Code != jt.Code)
        {
            if (await db.JobTitles.AnyAsync(j => j.Code == dto.Code && j.Id != id))
                throw new InvalidOperationException("كود المسمى الوظيفي مستخدم بالفعل");
            jt.Code = dto.Code;
        }

        if (dto.NameAr is not null)             jt.NameAr             = dto.NameAr;
        if (dto.NameEn is not null)             jt.NameEn             = dto.NameEn;
        if (dto.Description is not null)        jt.Description        = dto.Description;
        if (dto.ClassificationCode is not null) jt.ClassificationCode = dto.ClassificationCode;
        if (dto.Level is not null)              jt.Level              = dto.Level;

        await db.SaveChangesAsync();
        return ToDto(jt);
    }

    public async Task<bool> DeleteAsync(Guid id)
    {
        var jt = await db.JobTitles.Include(j => j.Positions).FirstOrDefaultAsync(j => j.Id == id);
        if (jt is null) return false;

        if (jt.Positions.Any())
            throw new InvalidOperationException("لا يمكن حذف مسمى وظيفي مرتبط بمناصب");

        db.JobTitles.Remove(jt);
        await db.SaveChangesAsync();
        return true;
    }

    private static JobTitleDto ToDto(JobTitle j) => new()
    {
        Id                 = j.Id,
        NameAr             = j.NameAr,
        NameEn             = j.NameEn,
        Code               = j.Code,
        Description        = j.Description,
        ClassificationCode = j.ClassificationCode,
        Level              = j.Level,
        PositionCount      = j.Positions?.Count ?? 0,
        CreatedAt          = j.CreatedAt,
    };
}
