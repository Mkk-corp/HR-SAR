using Microsoft.AspNetCore.Mvc;
using HR_SAR.DTOs;
using HR_SAR.Services;

namespace HR_SAR.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TransfersController : ControllerBase
{
    private readonly ITransferService _service;

    public TransfersController(ITransferService service) => _service = service;

    /// <summary>Get all transfer requests with optional filters.</summary>
    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] string? status,
        [FromQuery] string? type,
        [FromQuery] Guid? employeeId)
        => Ok(await _service.GetAllAsync(status, type, employeeId));

    /// <summary>Get a single transfer request by ID.</summary>
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var result = await _service.GetByIdAsync(id);
        return result is null ? NotFound() : Ok(result);
    }

    /// <summary>Create a new transfer request.</summary>
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateTransferDto dto)
    {
        try
        {
            var result = await _service.CreateAsync(dto);
            return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    /// <summary>Update the status of a transfer request.</summary>
    [HttpPatch("{id:guid}/status")]
    public async Task<IActionResult> UpdateStatus(Guid id, [FromBody] UpdateTransferStatusDto dto)
    {
        var result = await _service.UpdateStatusAsync(id, dto);
        return result is null ? NotFound() : Ok(result);
    }

    /// <summary>Delete a transfer request.</summary>
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var deleted = await _service.DeleteAsync(id);
        return deleted ? NoContent() : NotFound();
    }
}
