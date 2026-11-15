namespace MartianMap.API.Data
{
    public class Coordinate
    {
        public double Lat { get; set; }
        public double Lon { get; set; }
    }

    public class TerrainGrid
    {
        public double[,] ElevationValues { get; set; } = new double[0, 0];
        public double CellSizeMeters { get; set; }
        public string DataSource { get; set; } = string.Empty;
    }

    public class ScientificTarget
    {
        public string Id { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public Coordinate Coordinates { get; set; } = new();
        public string ScientificDescription { get; set; } = string.Empty;
        public string ScientificImportance { get; set; } = string.Empty;
    }

    public class MarsDataRepository
    {
        private readonly TerrainGrid _terrainGrid;
        private readonly List<ScientificTarget> _targets;

        public MarsDataRepository()
        {
            _terrainGrid = GenerateDemoTerrainGrid();
            _targets = InitializeTargets();
        }

        public TerrainGrid GetTerrainGrid() => _terrainGrid;
        public List<ScientificTarget> GetAllTargets() => _targets;

        private TerrainGrid GenerateDemoTerrainGrid()
        {
            int rows = 100;
            int cols = 100;
            double[,] elevation = new double[rows, cols];

            for (int r = 0; r < rows; r++)
            {
                for (int c = 0; c < cols; c++)
                {
                    double baseElev = -4500.0 + (r * 1.5) + (c * 1.2);
                    double ridge = Math.Sin(r * 0.15) * Math.Cos(c * 0.15) * 45.0;
                    elevation[r, c] = Math.Round(baseElev + ridge, 2);
                }
            }

            return new TerrainGrid
            {
                ElevationValues = elevation,
                CellSizeMeters = 50.0,
                DataSource = "Synthetic Demo Data (Gale Crater Analog)"
            };
        }

        private List<ScientificTarget> InitializeTargets()
        {
            return new List<ScientificTarget>
            {
                new ScientificTarget
                {
                    Id = "boxwork-demo-1",
                    Name = "Mount Sharp Boxwork Formations",
                    Coordinates = new Coordinate { Lat = -4.920, Lon = 137.430 },
                    ScientificDescription = "Network of intersecting mineral ridges formed by ancient groundwater.",
                    ScientificImportance = "High - Key biomarker indicator."
                }
            };
        }
    }
}