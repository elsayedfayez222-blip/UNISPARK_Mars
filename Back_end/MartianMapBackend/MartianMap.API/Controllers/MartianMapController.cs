using Microsoft.AspNetCore.Mvc;
using MartianMap.API.Data;
using MartianMap.API.Services;

namespace MartianMap.API.Controllers
{
    [ApiController]
    [Route("api")]
    public class MartianMapController : ControllerBase
    {
        private readonly MarsDataRepository _repository = new();
        private readonly PathfinderService _pathfinder = new();

        [HttpGet("health")]
        public IActionResult GetHealth() => Ok(new { status = "healthy", system = "Martian Map Backend (.NET)" });

        [HttpGet("region")]
        public IActionResult GetRegion()
        {
            var grid = _repository.GetTerrainGrid();
            return Ok(new
            {
                region = "Gale Crater - Mount Sharp",
                planet = "Mars",
                data_source = grid.DataSource,
                targets = _repository.GetAllTargets()
            });
        }

        [HttpPost("routes")]
        public IActionResult CalculateRoutes([FromBody] RouteRequestDto request) // تم تعديلها لـ FromBody
        {
            var targets = _repository.GetAllTargets();
            var target = targets.FirstOrDefault(t => t.Id == request.TargetId) ?? targets.First();

            var grid = _repository.GetTerrainGrid();
            var slopeGrid = _pathfinder.CalculateSlopeGrid(grid.ElevationValues, grid.CellSizeMeters);

            var startPos = (Row: 10, Col: 10);
            var goalPos = (Row: 45, Col: 45);

            var profiles = new[] { "shortest", "safest", "balanced" };
            var routesList = new List<object>();

            foreach (var profile in profiles)
            {
                var gridPath = _pathfinder.FindPath(grid.ElevationValues, slopeGrid, startPos, goalPos, profile);

                double distanceKm = Math.Round(gridPath.Count * grid.CellSizeMeters / 1000.0, 2);
                double durationMin = Math.Round((distanceKm * 1000.0 / 1.2) / 60.0, 1);

                routesList.Add(new
                {
                    profile = profile,
                    distance_km = distanceKm,
                    duration_min = durationMin,
                    max_slope_deg = 12.5,
                    avg_slope_deg = 5.2,
                    risk_score = profile == "safest" ? 0.15 : (profile == "balanced" ? 0.35 : 0.65),
                    risk = profile == "safest" ? "low" : (profile == "balanced" ? "medium" : "high"),
                    path_points_count = gridPath.Count,

                    // التقرير البيئي الشامل مع الصور البصرية للاستدلال الميداني
                    environmental_data = new
                    {
                        visual_terrain = profile == "safest"
                            ? "Smooth rolling plains with minimal boulder fields and low dust accumulation."
                            : "Exposed layered sedimentary rocks with high ridge density and steep slopes.",

                        // هنا تمت إضافة الصور البصرية للمكان لتساعد الرائد على التمييز البصري
                        visual_references = new
                        {
                            landmark_name = target.Name,
                            expected_visual_features = "Distinct parallel rock strata with light-toned sulfate ridges and dark wind-blown ripples.",
                            reference_image_url = $"https://mars.nasa.gov/msl-raw-images/proj/msl/redops/ods/surface/sol/04000/opgs/edr/ncam/NRB_..._{target.Id}.jpg",
                            visual_guidance = "Look for the prominent outcrop ridge on the horizon bearing 142 degrees azimuth to confirm arrival."
                        },

                        thermal_data = new
                        {
                            surface_temp_day_c = -12.5,
                            surface_temp_night_c = -78.4,
                            thermal_inertia = "Medium-High (indicates solid consolidated rocky subsurface)."
                        },
                        spectral_analysis = new
                        {
                            dominant_minerals = new[] { "Hydrated sulfates", "Polyhydrated iron oxides", "Hematite" },
                            aqueous_alteration_sign = "High concentration of clay minerals near trough zones."
                        },
                        atmospheric_data = new
                        {
                            atmospheric_pressure_pa = 715.2,
                            wind_speed_ms = 4.2,
                            dust_opacity_tau = 0.62,
                            radiation_level_msv_day = 0.64
                        }
                    }
                });
            }

            return Ok(new
            {
                region = "Gale Crater - Mount Sharp",
                target_name = target.Name,
                routes = routesList
            });
        }
    }

    public class RouteRequestDto
    {
        public CoordinateDto Start { get; set; } = new();
        public string TargetId { get; set; } = string.Empty;
    }

    public class CoordinateDto
    {
        public double Lat { get; set; }
        public double Lon { get; set; }
    }
}