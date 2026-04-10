using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using HR_SAR.DTOs;
using HR_SAR.Services;

namespace HR_SAR.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class PositionsController(IPositionService service) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] Guid? orgUnitId,
        [FromQuery] Guid? jobTitleId,
        [FromQuery] string? status)
        => Ok(await service.GetAllAsync(orgUnitId, jobTitleId, status));

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var result = await service.GetByIdAsync(id);
        return result is null ? NotFound() : Ok(result);
    }

    [HttpGet("{id:guid}/employees")]
    public async Task<IActionResult> GetEmployees(Guid id)
        => Ok(await service.GetPositionEmployeesAsync(id));

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreatePositionDto dto)
    {
        try
        {
            var result = await service.CreateAsync(dto);
            return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
        }
        catch (InvalidOperationException ex) { return BadRequest(new { message = ex.Message }); }
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdatePositionDto dto)
    {
        try
        {
            var result = await service.UpdateAsync(id, dto);
            return result is null ? NotFound() : Ok(result);
        }
        catch (InvalidOperationException ex) { return BadRequest(new { message = ex.Message }); }
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        try
        {
            var deleted = await service.DeleteAsync(id);
            return deleted ? NoContent() : NotFound();
        }
        catch (InvalidOperationException ex) { return BadRequest(new { message = ex.Message }); }
    }

    [HttpPost("assign")]
    public async Task<IActionResult> AssignEmployee([FromBody] AssignEmployeeDto dto)
    {
        try { return Ok(await service.AssignEmployeeAsync(dto)); }
        catch (InvalidOperationException ex) { return BadRequest(new { message = ex.Message }); }
    }

    [HttpPost("transfer")]
    public async Task<IActionResult> TransferEmployee([FromBody] TransferEmployeeDto dto)
    {
        try { return Ok(await service.TransferEmployeeAsync(dto)); }
        catch (InvalidOperationException ex) { return BadRequest(new { message = ex.Message }); }
    }
}
