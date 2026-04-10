using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using HR_SAR.DTOs;
using HR_SAR.Services;

namespace HR_SAR.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class OrgUnitsController(IOrgUnitService service) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] string? search,
        [FromQuery] string? type,
        [FromQuery] string? status)
        => Ok(await service.GetAllAsync(search, type, status));

    [HttpGet("tree")]
    public async Task<IActionResult> GetTree()
        => Ok(await service.GetTreeAsync());

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var result = await service.GetByIdAsync(id);
        return result is null ? NotFound() : Ok(result);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateOrgUnitDto dto)
    {
        try
        {
            var result = await service.CreateAsync(dto);
            return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
        }
        catch (InvalidOperationException ex) { return BadRequest(new { message = ex.Message }); }
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateOrgUnitDto dto)
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
}
