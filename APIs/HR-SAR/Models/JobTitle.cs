using System.ComponentModel.DataAnnotations;

namespace HR_SAR.Models;

public class JobTitle
{
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required, MaxLength(200)]
    public string NameAr { get; set; } = string.Empty;

    [MaxLength(200)]
    public string NameEn { get; set; } = string.Empty;

    [Required, MaxLength(50)]
    public string Code { get; set; } = string.Empty;

    public string? Description { get; set; }

    /// <summary>Optional Qiwa classification code</summary>
    [MaxLength(50)]
    public string? ClassificationCode { get; set; }

    /// <summary>Junior | Senior | Manager</summary>
    [MaxLength(30)]
    public string? Level { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public ICollection<Position> Positions { get; set; } = [];
}
