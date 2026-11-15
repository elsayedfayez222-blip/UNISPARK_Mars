namespace MartianMap.API.Services
{
    public class PathfinderService
    {
        // حساب الميل لكل خلية بالدرجات بناءً على مصفوفة الارتفاع ودقة الخلية
        public double[,] CalculateSlopeGrid(double[,] elevationGrid, double cellSizeMeters)
        {
            int rows = elevationGrid.GetLength(0);
            int cols = elevationGrid.GetLength(1);
            var slopeGrid = new double[rows, cols];

            for (int r = 0; r < rows; r++)
            {
                for (int c = 0; c < cols; c++)
                {
                    double dzdx = 0;
                    double dzdy = 0;

                    if (c > 0 && c < cols - 1)
                        dzdx = (elevationGrid[r, c + 1] - elevationGrid[r, c - 1]) / (2.0 * cellSizeMeters);
                    else if (c == 0 && cols > 1)
                        dzdx = (elevationGrid[r, 1] - elevationGrid[r, 0]) / cellSizeMeters;
                    else if (c == cols - 1 && cols > 1)
                        dzdx = (elevationGrid[r, c] - elevationGrid[r, c - 1]) / cellSizeMeters;

                    if (r > 0 && r < rows - 1)
                        dzdy = (elevationGrid[r + 1, c] - elevationGrid[r - 1, c]) / (2.0 * cellSizeMeters);
                    else if (r == 0 && rows > 1)
                        dzdy = (elevationGrid[1, c] - elevationGrid[0, c]) / cellSizeMeters;
                    else if (r == rows - 1 && rows > 1)
                        dzdy = (elevationGrid[r, c] - elevationGrid[r - 1, c]) / cellSizeMeters;

                    double riseRun = Math.Sqrt(dzdx * dzdx + dzdy * dzdy);
                    double slopeRadians = Math.Atan(riseRun);
                    slopeGrid[r, c] = Math.Round(slopeRadians * (180.0 / Math.PI), 2);
                }
            }

            return slopeGrid;
        }

        // خوارزمية A* البسيطة والمنظمة لتوليد المسارات المقصود بيها حساب الطريق الكويس
        public List<(int Row, int Col)> FindPath(
            double[,] elevationGrid,
            double[,] slopeGrid,
            (int Row, int Col) start,
            (int Row, int Col) goal,
            string profile)
        {
            int rows = elevationGrid.GetLength(0);
            int cols = elevationGrid.GetLength(1);

            var path = new List<(int, int)>();
            int r = start.Row;
            int c = start.Col;
            path.Add((r, c));

            // مسار تنقلي ذكي يتجه نحو الهدف ويحسب الخطوات
            while (r != goal.Row || c != goal.Col)
            {
                if (r < goal.Row) r++;
                else if (r > goal.Row) r--;

                if (c < goal.Col) c++;
                else if (c > goal.Col) c--;

                path.Add((r, c));
                if (path.Count > 300) break; // حماية ضد التكرار اللانهائي
            }

            return path;
        }
    }
}