using Microsoft.EntityFrameworkCore;
using HR_SAR.Data;
using HR_SAR.DTOs;
using HR_SAR.Models;

namespace HR_SAR.Services;

public class TransferService : ITransferService
{
    private readonly AppDbContext _db;

    public TransferService(AppDbContext db) => _db = db;

    public async Task<IEnumerable<TransferResponseDto>> GetAllAsync(string? status = null, string? type = null, Guid? employeeId = null)
    {
        var query = _db.Transfers.AsQueryable();

        if (!string.IsNullOrWhiteSpace(status))
            query = query.Where(t => t.Status == status);

        if (!string.IsNullOrWhiteSpace(type))
            query = query.Where(t => t.Type == type);

        if (employeeId.HasValue)
            query = query.Where(t => t.EmployeeId == employeeId);

        return await query
            .OrderByDescending(t => t.CreatedAt)
            .Select(t => ToDto(t))
            .ToListAsync();
    }

    public async Task<TransferResponseDto?> GetByIdAsync(Guid id)
    {
        var t = await _db.Transfers.FirstOrDefaultAsync(x => x.Id == id);
        return t is null ? null : ToDto(t);
    }

    public async Task<TransferResponseDto> CreateAsync(CreateTransferDto dto)
    {
        var employee = await _db.Employees.FindAsync(dto.EmployeeId)
            ?? throw new KeyNotFoundException($"Employee {dto.EmployeeId} not found");

        var transfer = new Transfer
        {
            Type = dto.Type,
            Direction = dto.Direction,
            TransferSubType = dto.TransferSubType,
            EmployeeId = dto.EmployeeId,
            EmployeeName = employee.Name,
            EmployeeCode = employee.Code,
            EffectiveDate = dto.EffectiveDate,
            Changes = dto.Changes,
            TargetCompany = dto.TargetCompany,
            Reason = dto.Reason,
            ExpectedDate = dto.ExpectedDate,
            Settlement = dto.Settlement,
            Notes = dto.Notes,
            CreatedBy = dto.CreatedBy,
            AuditLog =
            [
                new() { Action = "created", Details = "Transfer request created", By = dto.CreatedBy ?? "system", At = DateTime.UtcNow.ToString("O") }
            ],
        };

        _db.Transfers.Add(transfer);
        await _db.SaveChangesAsync();
        return ToDto(transfer);
    }

    public async Task<TransferResponseDto?> UpdateStatusAsync(Guid id, UpdateTransferStatusDto dto)
    {
        var transfer = await _db.Transfers.FirstOrDefaultAsync(t => t.Id == id);
        if (transfer is null) return null;

        transfer.Status = dto.Status;
        transfer.UpdatedAt = DateTime.UtcNow;

        if (dto.RejectionReason is not null) transfer.RejectionReason = dto.RejectionReason;
        if (dto.GovernmentRefNumber is not null) transfer.GovernmentRefNumber = dto.GovernmentRefNumber;
        if (dto.Notes is not null) transfer.Notes = dto.Notes;
        if (dto.Status == "completed") transfer.CompletedDate = DateTime.UtcNow;

        transfer.AuditLog.Add(new TransferAuditEntry
        {
            Action = dto.Status,
            Details = dto.Notes ?? $"Status changed to {dto.Status}",
            By = dto.UpdatedBy ?? "system",
            At = DateTime.UtcNow.ToString("O"),
        });

        await _db.SaveChangesAsync();
        return ToDto(transfer);
    }

    public async Task<bool> DeleteAsync(Guid id)
    {
        var transfer = await _db.Transfers.FindAsync(id);
        if (transfer is null) return false;
        _db.Transfers.Remove(transfer);
        await _db.SaveChangesAsync();
        return true;
    }

    private static TransferResponseDto ToDto(Transfer t) => new()
    {
        Id = t.Id,
        Type = t.Type,
        Direction = t.Direction,
        TransferSubType = t.TransferSubType,
        EmployeeId = t.EmployeeId,
        EmployeeName = t.EmployeeName,
        EmployeeCode = t.EmployeeCode,
        Status = t.Status,
        EffectiveDate = t.EffectiveDate,
        Changes = t.Changes,
        TargetCompany = t.TargetCompany,
        Reason = t.Reason,
        ExpectedDate = t.ExpectedDate,
        Settlement = t.Settlement,
        GovernmentRefNumber = t.GovernmentRefNumber,
        CompletedDate = t.CompletedDate,
        AuditLog = t.AuditLog,
        Notes = t.Notes,
        CreatedBy = t.CreatedBy,
        CreatedAt = t.CreatedAt,
        UpdatedAt = t.UpdatedAt,
        RejectionReason = t.RejectionReason,
    };
}
