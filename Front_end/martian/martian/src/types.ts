export interface Coordinate {
  lat: number;
  lon: number;
}

export interface RegionBounds {
  south: number;
  west: number;
  north: number;
  east: number;
}

export interface TargetImage {
  url: string;
  type?: string;
  credit?: string;
}

export interface ScienceTarget {
  id: string;
  name: string;
  coordinate?: Coordinate;
  description?: string;
  importance?: string;
  images: TargetImage[];
  raw: Record<string, unknown>;
}

export interface MartianRegion {
  name: string;
  planet?: string;
  dataSource?: string;
  bounds?: RegionBounds;
  landingPoint?: Coordinate;
  landingPointName?: string;
  targets: ScienceTarget[];
  raw: Record<string, unknown>;
}

export interface RouteMetrics {
  profile: string;
  distanceKm?: number;
  durationMin?: number;
  maxSlopeDeg?: number;
  averageRadiation?: number;
  risk?: string;
  path: Coordinate[];
  elevationProfile: number[];
  visualTerrain?: string;
  imageUrl?: string;
  imageCredit?: string;
  visualGuidance?: string;
  surfaceTempC?: number;
  pressurePa?: number;
  minerals: string[];
  raw: Record<string, unknown>;
}

export interface RoutesResponse {
  regionName?: string;
  targetName?: string;
  routes: RouteMetrics[];
  raw: Record<string, unknown>;
}

export interface HealthResponse {
  status: string;
  system?: string;
  raw: Record<string, unknown>;
}
