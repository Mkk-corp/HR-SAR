using System.ComponentModel.DataAnnotations;

namespace HR_SAR.DTOs;

public class JobTitleDto
{
    public Guid Id { get; set; }
    public string NameAr { get; set; } = string.Empty;
    public string NameEn { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? ClassificationCode { get; set; }
    public string? Level { get; set; }
    public int PositionCount { get; set; }
    public DateTime CreatedAt { get; set; }
}

public record CreateJobTitleDto(
    [Required, MaxLength(200)] string NameAr,
    [MaxLength(200)] string NameEn,
    [Required, MaxLength(50)] string Code,
    string? Description,
    [MaxLength(50)] string? ClassificationCode,
    [MaxLength(30)] string? Level
);

public record UpdateJobTitleDto(
    [MaxLength(200)] string? NameAr,
    [MaxLength(200)] string? NameEn,
    [MaxLength(50)] string? Code,
    string? Description,
    [MaxLength(50)] string? ClassificationCode,
    [MaxLength(30)] string? Level
);
