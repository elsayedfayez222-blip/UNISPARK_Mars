import type {
  Coordinate,
  HealthResponse,
  MartianRegion,
  RegionBounds,
  RouteMetrics,
  RoutesResponse,
  ScienceTarget,
  TargetImage,
} from './types';

type JsonRecord = Record<string, unknown>;

const record = (value: unknown): JsonRecord =>
  value !== null && typeof value === 'object' && !Array.isArray(value)
    ? (value as JsonRecord)
    : {};

const first = (source: JsonRecord, ...keys: string[]): unknown => {
  for (const key of keys) {
    if (source[key] !== undefined && source[key] !== null) return source[key];
  }
  return undefined;
};

const text = (value: unknown): string | undefined =>
  typeof value === 'string' && value.trim() ? value.trim() : undefined;

const number = (value: unknown): number | undefined => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() && Number.isFinite(Number(value))) return Number(value);
  return undefined;
};

export function normalizeCoordinate(value: unknown): Coordinate | undefined {
  if (Array.isArray(value) && value.length >= 2) {
    const lat = number(value[0]);
    const lon = number(value[1]);
    return lat !== undefined && lon !== undefined ? { lat, lon } : undefined;
  }
  const source = record(value);
  const nested = record(first(source, 'coordinates', 'coordinate'));
  const candidate = Object.keys(nested).length ? nested : source;
  const lat = number(first(candidate, 'lat', 'latitude'));
  const lon = number(first(candidate, 'lon', 'lng', 'longitude'));
  return lat !== undefined && lon !== undefined ? { lat, lon } : undefined;
}

function normalizeBounds(value: unknown): RegionBounds | undefined {
  if (!Array.isArray(value) || value.length < 2) return undefined;
  const firstPoint = normalizeCoordinate(value[0]);
  const secondPoint = normalizeCoordinate(value[1]);
  if (!firstPoint || !secondPoint) return undefined;
  return {
    south: Math.min(firstPoint.lat, secondPoint.lat),
    west: Math.min(firstPoint.lon, secondPoint.lon),
    north: Math.max(firstPoint.lat, secondPoint.lat),
    east: Math.max(firstPoint.lon, secondPoint.lon),
  };
}

function normalizeImages(value: unknown): TargetImage[] {
  const entries = Array.isArray(value) ? value : value ? [value] : [];
  return entries.flatMap((entry) => {
    const image = record(entry);
    const url = text(first(image, 'url', 'image_url', 'reference_image_url'));
    return url
      ? [{
          url,
          type: text(first(image, 'type', 'kind')),
          credit: text(first(image, 'credit', 'credits', 'source')),
        }]
      : [];
  });
}

function normalizeTarget(value: unknown, index: number): ScienceTarget {
  const source = record(value);
  const coordinate = normalizeCoordinate(first(source, 'coordinates', 'coordinate')) ?? normalizeCoordinate(source);
  return {
    id: text(first(source, 'id', 'targetId', 'target_id')) ?? `target-${index + 1}`,
    name: text(first(source, 'name', 'target_name', 'title')) ?? `Target ${index + 1}`,
    coordinate,
    description: text(first(source, 'scientificDescription', 'scientific_description', 'science_note', 'description')),
    importance: text(first(source, 'scientificImportance', 'scientific_importance', 'importance')),
    images: normalizeImages(first(source, 'images', 'visual_references')),
    raw: source,
  };
}

export function normalizeRegion(value: unknown): MartianRegion {
  const outer = record(value);
  const source = Object.keys(record(outer.data)).length ? record(outer.data) : outer;
  const landingRaw = first(source, 'landing_point', 'landingPoint', 'start', 'habitat');
  const landingRecord = record(landingRaw);
  const targetsRaw = first(source, 'targets', 'science_targets', 'scienceTargets');
  const targets = Array.isArray(targetsRaw) ? targetsRaw.map(normalizeTarget) : [];
  return {
    name: text(first(source, 'region', 'name', 'region_name', 'regionName')) ?? 'Unnamed region',
    planet: text(first(source, 'planet')),
    dataSource: text(first(source, 'data_source', 'dataSource')),
    bounds: normalizeBounds(first(source, 'bounds', 'bounding_box', 'boundingBox')),
    landingPoint: normalizeCoordinate(landingRaw),
    landingPointName: text(first(landingRecord, 'name', 'label')),
    targets,
    raw: source,
  };
}

function normalizeRoute(value: unknown): RouteMetrics {
  const source = record(value);
  const environment = record(first(source, 'environmental_data', 'environmentalData'));
  const thermal = record(first(environment, 'thermal_data', 'thermalData'));
  const spectral = record(first(environment, 'spectral_analysis', 'spectralAnalysis'));
  const atmosphere = record(first(environment, 'atmospheric_data', 'atmosphericData'));
  const visual = record(first(environment, 'visual_references', 'visualReferences'));
  const pathRaw = first(source, 'path', 'coordinates', 'route_points', 'routePoints');
  const path = Array.isArray(pathRaw)
    ? pathRaw.map(normalizeCoordinate).filter((point): point is Coordinate => point !== undefined)
    : [];
  const elevationRaw = first(source, 'elevation_profile', 'elevationProfile');
  const elevationProfile = Array.isArray(elevationRaw)
    ? elevationRaw.map(number).filter((value): value is number => value !== undefined)
    : [];
  const mineralsRaw = first(spectral, 'dominant_minerals', 'dominantMinerals', 'minerals');
  const minerals = Array.isArray(mineralsRaw)
    ? mineralsRaw.map(text).filter((item): item is string => item !== undefined)
    : [];
  const profile = text(first(source, 'profile', 'type', 'name')) ?? 'route';
  return {
    profile,
    distanceKm: number(first(source, 'distance_km', 'distanceKm')),
    durationMin: number(first(source, 'duration_min', 'durationMin')),
    maxSlopeDeg: number(first(source, 'max_slope_deg', 'maxSlopeDeg')),
    averageRadiation: number(first(source, 'avg_radiation', 'average_radiation', 'averageRadiation')),
    risk: text(first(source, 'risk', 'risk_level', 'riskLevel')),
    path,
    elevationProfile,
    visualTerrain: text(first(environment, 'visual_terrain', 'visualTerrain')),
    imageUrl: text(first(visual, 'reference_image_url', 'referenceImageUrl')),
    imageCredit: text(first(visual, 'credit', 'image_credit', 'imageCredit')),
    visualGuidance: text(first(visual, 'visual_guidance', 'visualGuidance')),
    surfaceTempC: number(first(thermal, 'surface_temp_day_c', 'surfaceTempDayC', 'surface_temp_c')),
    pressurePa: number(first(atmosphere, 'atmospheric_pressure_pa', 'atmosphericPressurePa', 'pressure_pa')),
    minerals,
    raw: source,
  };
}

export function normalizeRoutes(value: unknown): RoutesResponse {
  const outer = record(value);
  const source = Object.keys(record(outer.data)).length ? record(outer.data) : outer;
  const routeList = first(source, 'routes', 'route_options', 'routeOptions');
  return {
    regionName: text(first(source, 'region', 'region_name', 'regionName')),
    targetName: text(first(source, 'target_name', 'targetName')),
    routes: Array.isArray(routeList) ? routeList.map(normalizeRoute) : [],
    raw: source,
  };
}

export function apiBaseUrl(): string {
  const fromEnv = import.meta.env.VITE_API_BASE_URL as string | undefined;
  return fromEnv?.trim() || 'https://localhost:7215/api';
}

async function requestJson(baseUrl: string, path: string, init?: RequestInit): Promise<unknown> {
  const base = baseUrl.trim().replace(/\/+$/, '');
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 12000);
  try {
    const response = await fetch(`${base}${path}`, {
      ...init,
      signal: controller.signal,
      headers: { Accept: 'application/json', ...(init?.body ? { 'Content-Type': 'application/json' } : {}), ...init?.headers },
    });
    const bodyText = await response.text();
    let body: unknown = {};
    try {
      body = bodyText ? JSON.parse(bodyText) : {};
    } catch {
      body = { message: bodyText.slice(0, 240) };
    }
    if (!response.ok) {
      const message = text(first(record(body), 'message', 'title', 'detail'));
      throw new Error(message ?? `HTTP ${response.status} ${response.statusText}`);
    }
    return body;
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error('انتهت مهلة الاتصال بالخادم. تحقق من عنوان الـAPI وحالة الخادم.');
    }
    if (error instanceof TypeError) {
      throw new Error('تعذر الوصول إلى الـAPI. تحقق من تشغيل الخادم وإعداد CORS وشهادة HTTPS.');
    }
    throw error;
  } finally {
    window.clearTimeout(timeout);
  }
}

export async function fetchHealth(baseUrl: string): Promise<HealthResponse> {
  const raw = record(await requestJson(baseUrl, '/health'));
  return {
    status: text(raw.status) ?? 'unknown',
    system: text(raw.system),
    raw,
  };
}

export async function fetchRegion(baseUrl: string): Promise<MartianRegion> {
  return normalizeRegion(await requestJson(baseUrl, '/region'));
}

export async function requestRoutes(
  baseUrl: string,
  start: Coordinate,
  targetId: string,
): Promise<RoutesResponse> {
  const body = { start: { lat: start.lat, lon: start.lon }, targetId };
  return normalizeRoutes(await requestJson(baseUrl, '/routes', {
    method: 'POST',
    body: JSON.stringify(body),
  }));
}
