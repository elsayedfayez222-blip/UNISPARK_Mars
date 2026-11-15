import { useMemo, type MouseEvent } from 'react';
import { Crosshair, LocateFixed, MapPin, MousePointer2, RotateCcw, Satellite } from 'lucide-react';
import type { Coordinate, MartianRegion, RouteMetrics } from './types';
import { ElevationChart } from './MissionPanels';
import { text, type Language } from './i18n';

interface Props {
  region?: MartianRegion;
  routes: RouteMetrics[];
  selectedRoute?: RouteMetrics;
  elevationVisible: boolean;
  slopeVisible: boolean;
  selectedProfile?: string;
  selectedTargetId?: string;
  start?: Coordinate;
  onSetStart: (point: Coordinate) => void;
  onSelectTarget: (id: string) => void;
  overlayOpacity: number;
  demoMode: boolean;
  onToggleDemo: () => void;
  loading: boolean;
  error?: string;
  language: Language;
}

const width = 900;
const height = 560;
const pad = { left: 78, right: 58, top: 48, bottom: 56 };

function profileColor(profile: string): string {
  const key = profile.toLowerCase();
  if (key.includes('safe')) return '#7be2b2';
  if (key.includes('short')) return '#f4ae62';
  if (key.includes('balanc')) return '#72bde2';
  return '#ef7656';
}

function routeLabel(profile: string): string {
  const key = profile.toLowerCase();
  if (key.includes('safe')) return 'SAFEST';
  if (key.includes('short')) return 'SHORTEST';
  if (key.includes('balanc')) return 'BALANCED';
  return profile.toUpperCase();
}

export function MapPanel({
  region,
  routes,
  selectedRoute,
  elevationVisible,
  slopeVisible,
  selectedProfile,
  selectedTargetId,
  start,
  onSetStart,
  onSelectTarget,
  overlayOpacity,
  demoMode,
  onToggleDemo,
  loading,
  error,
  language,
}: Props) {
  const allPoints = useMemo(() => {
    const points: Coordinate[] = [];
    if (region?.landingPoint) points.push(region.landingPoint);
    for (const target of region?.targets ?? []) if (target.coordinate) points.push(target.coordinate);
    if (start) points.push(start);
    for (const route of routes) points.push(...route.path);
    return points;
  }, [region, routes, start]);

  const bounds = useMemo(() => {
    if (region?.bounds) return region.bounds;
    if (!allPoints.length) return undefined;
    const lats = allPoints.map((point) => point.lat);
    const lons = allPoints.map((point) => point.lon);
    const latSpan = Math.max(Math.max(...lats) - Math.min(...lats), 0.03);
    const lonSpan = Math.max(Math.max(...lons) - Math.min(...lons), 0.03);
    return {
      south: Math.min(...lats) - latSpan * 0.2,
      north: Math.max(...lats) + latSpan * 0.2,
      west: Math.min(...lons) - lonSpan * 0.2,
      east: Math.max(...lons) + lonSpan * 0.2,
    };
  }, [region, allPoints]);

  const project = (point: Coordinate) => {
    if (!bounds) return { x: width / 2, y: height / 2 };
    const lonSpan = Math.max(bounds.east - bounds.west, 0.0001);
    const latSpan = Math.max(bounds.north - bounds.south, 0.0001);
    const x = pad.left + ((point.lon - bounds.west) / lonSpan) * (width - pad.left - pad.right);
    const y = pad.top + ((bounds.north - point.lat) / latSpan) * (height - pad.top - pad.bottom);
    return { x, y };
  };

  const onMapClick = (event: MouseEvent<SVGSVGElement>) => {
    if (!bounds) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const px = (event.clientX - rect.left) / rect.width;
    const py = (event.clientY - rect.top) / rect.height;
    const x = Math.max(0, Math.min(1, px)) * width;
    const y = Math.max(0, Math.min(1, py)) * height;
    if (x < pad.left || x > width - pad.right || y < pad.top || y > height - pad.bottom) return;
    onSetStart({
      lat: bounds.north - ((y - pad.top) / (height - pad.top - pad.bottom)) * (bounds.north - bounds.south),
      lon: bounds.west + ((x - pad.left) / (width - pad.left - pad.right)) * (bounds.east - bounds.west),
    });
  };

  const grid = useMemo(() => {
    if (!bounds) return { vertical: [], horizontal: [] };
    const vertical = Array.from({ length: 5 }, (_, index) => {
      const ratio = index / 4;
      return {
        x: pad.left + ratio * (width - pad.left - pad.right),
        label: (bounds.west + ratio * (bounds.east - bounds.west)).toFixed(2),
      };
    });
    const horizontal = Array.from({ length: 5 }, (_, index) => {
      const ratio = index / 4;
      return {
        y: pad.top + ratio * (height - pad.top - pad.bottom),
        label: (bounds.north - ratio * (bounds.north - bounds.south)).toFixed(2),
      };
    });
    return { vertical, horizontal };
  }, [bounds]);

  const regionTitle = region?.name ?? 'GALE CRATER · REGIONAL FIELD';
  const selectedRoutes = routes.filter((route) => route.path.length > 1);

  return (
    <section className="map-panel panel-surface" aria-label={text(language, 'خريطة المنطقة', 'Regional map')}>
      <div className="map-head">
        <div className="map-title-group">
          <div className="map-kicker"><span className="live-dot" /> MISSION MAP <span className="kicker-divider">/</span> GEO-PLOT</div>
          <h2>{regionTitle}</h2>
          <p>{region?.planet ?? 'MARS'} <span className="bullet">·</span> {text(language, 'إحداثيات المنطقة الواردة من الـAPI', 'Regional coordinates from the API')}</p>
        </div>
        <div className="map-actions">
          <button className="map-action-button" type="button" onClick={onToggleDemo}>
            {demoMode ? <RotateCcw size={14} /> : <Satellite size={14} />}
            {demoMode ? text(language, 'عودة للربط الحي', 'Return to live connection') : text(language, 'عرض بيانات المثال', 'View sample data')}
          </button>
          <span className="map-scale-tag"><Crosshair size={13} /> LAT / LON</span>
        </div>
      </div>

      <div className="map-viewport">
        <div className="map-corner-label top-left"><span>COORDINATE FRAME</span><b>{bounds ? `${Math.abs(bounds.north - bounds.south).toFixed(2)}° × ${Math.abs(bounds.east - bounds.west).toFixed(2)}°` : 'AWAITING REGION'}</b></div>
        <div className="map-corner-label top-right"><span>BASEMAP STATUS</span><b className="muted-value">NO GEO-REFERENCED TILES</b></div>
        <svg
          className="coordinate-map"
          viewBox={`0 0 ${width} ${height}`}
          preserveAspectRatio="none"
          role="img"
          aria-label="مخطط إحداثيات للمريخ؛ انقر لتعيين نقطة البداية"
          onClick={onMapClick}
        >
          <defs>
            <linearGradient id="mapWash" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#371e18" />
              <stop offset="0.48" stopColor="#211a18" />
              <stop offset="1" stopColor="#171819" />
            </linearGradient>
            <radialGradient id="mapGlow" cx="50%" cy="46%" r="66%">
              <stop offset="0" stopColor="#9b482a" stopOpacity="0.18" />
              <stop offset="1" stopColor="#111416" stopOpacity="0" />
            </radialGradient>
            <pattern id="microGrid" width="26" height="26" patternUnits="userSpaceOnUse">
              <path d="M 26 0 L 0 0 0 26" fill="none" stroke="#d58b64" strokeOpacity="0.035" strokeWidth="1" />
            </pattern>
            <filter id="pinGlow" x="-120%" y="-120%" width="340%" height="340%">
              <feGaussianBlur stdDeviation="6" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>
          <rect width={width} height={height} fill="url(#mapWash)" />
          <rect width={width} height={height} fill="url(#mapGlow)" />
          <rect width={width} height={height} fill="url(#microGrid)" />
          {bounds && (
            <g className="map-grid-lines" aria-hidden="true">
              {grid.vertical.map((line, index) => (
                <g key={`v-${index}`}>
                  <line x1={line.x} y1={pad.top} x2={line.x} y2={height - pad.bottom} />
                  <text x={line.x} y={height - 20} textAnchor="middle">{line.label}°</text>
                </g>
              ))}
              {grid.horizontal.map((line, index) => (
                <g key={`h-${index}`}>
                  <line x1={pad.left} y1={line.y} x2={width - pad.right} y2={line.y} />
                  <text x={width - 8} y={line.y + 4} textAnchor="end">{line.label}°</text>
                </g>
              ))}
            </g>
          )}
          {!bounds && (
            <g className="map-empty-grid">
              {[0, 1, 2, 3, 4].map((index) => <line key={`v-${index}`} x1={pad.left + index * 190} y1={pad.top} x2={pad.left + index * 190} y2={height - pad.bottom} />)}
              {[0, 1, 2, 3, 4].map((index) => <line key={`h-${index}`} x1={pad.left} y1={pad.top + index * 112} x2={width - pad.right} y2={pad.top + index * 112} />)}
            </g>
          )}
          <g className="plot-boundary">
            <rect x={pad.left} y={pad.top} width={width - pad.left - pad.right} height={height - pad.top - pad.bottom} rx="3" />
            <path d={`M${pad.left} ${pad.top + 18}h18 M${pad.left} ${pad.top}v18 M${width - pad.right - 18} ${pad.top}h18 M${width - pad.right} ${pad.top}v18`} />
          </g>
          <g className="routes-layer" style={{ opacity: overlayOpacity / 100 }}>
            {selectedRoutes.map((route) => {
              const pts = route.path.map(project);
              const d = pts.map((point, index) => `${index === 0 ? 'M' : 'L'}${point.x},${point.y}`).join(' ');
              const active = route.profile === selectedProfile;
              return (
                <g key={route.profile} className={active ? 'route-path route-path-active' : 'route-path'}>
                  {active && <path d={d} className="route-halo" />}
                  <path d={d} stroke={profileColor(route.profile)} strokeWidth={active ? 3 : 1.8} strokeDasharray={active ? undefined : '7 8'} />
                  {pts.length > 1 && <circle cx={pts[pts.length - 1].x} cy={pts[pts.length - 1].y} r={active ? 4 : 3} fill={profileColor(route.profile)} />}
                </g>
              );
            })}
          </g>
          {region?.targets.map((target) => {
            if (!target.coordinate) return null;
            const pos = project(target.coordinate);
            const active = target.id === selectedTargetId;
            return (
              <g
                key={target.id}
                className={`map-target ${active ? 'map-target-active' : ''}`}
                transform={`translate(${pos.x} ${pos.y})`}
                role="button"
                tabIndex={0}
                aria-label={text(language, `اختيار الهدف ${target.name}`, `Select target ${target.name}`)}
                onClick={(event) => { event.stopPropagation(); onSelectTarget(target.id); }}
                onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') onSelectTarget(target.id); }}
              >
                <circle r="16" className="target-halo" />
                <circle r="8" className="target-ring" />
                <circle r="3" className="target-core" />
                <text x="20" y="-14">{target.name}</text>
              </g>
            );
          })}
          {start && (() => {
            const pos = project(start);
            return (
              <g className="map-start" transform={`translate(${pos.x} ${pos.y})`} style={{ opacity: overlayOpacity / 100 }}>
                <circle r="18" className="start-pulse" />
                <circle r="9" className="start-core" />
                <path d="M0 -4v8M-4 0h8" />
                <text x="18" y="23">START</text>
              </g>
            );
          })()}
          {!bounds && <text x={width / 2} y={height / 2} className="svg-empty-copy" textAnchor="middle">{text(language, 'لا توجد إحداثيات منطقة بعد', 'No regional coordinates yet')}</text>}
        </svg>

        <div className="map-north"><span>N</span><i>↑</i></div>
        <div className="map-legend">
          <span><i className="legend-start" /> {text(language, 'البداية', 'Start')}</span>
          <span><i className="legend-target" /> {text(language, 'الهدف العلمي', 'Science target')}</span>
          {routes.filter((route) => route.path.length > 1).map((route) => (
            <span key={route.profile}><i className="legend-route" style={{ backgroundColor: profileColor(route.profile) }} /> {routeLabel(route.profile)}</span>
          ))}
        </div>
        <div className="map-instruction"><MousePointer2 size={13} /> {text(language, 'انقر داخل الإطار لتحديد نقطة البداية', 'Click inside the frame to set a start point')}</div>
        <div className="map-interaction-hint"><LocateFixed size={14} /> {text(language, 'مخطط إحداثيات فقط — لا تتوفر بلاطات تضاريس جغرافية من الـAPI الموثق', 'Coordinate plot only — no terrain tiles are available from the documented API')}</div>
        {loading && <div className="map-loading"><span className="loading-ring" /> {text(language, 'جارٍ جلب بيانات المنطقة…', 'Loading regional data…')}</div>}
        {error && <div className="map-warning"><MapPin size={14} /> {text(language, 'تعذر تحميل المنطقة؛ أعد المحاولة أو افتح بيانات المثال', 'Could not load region; retry or open sample data')}</div>}
      </div>

      <div className="map-footer">
        <div className="map-source-line"><span className="source-marker" /> {region?.dataSource ? `المصدر: ${region.dataSource}` : region ? 'بيانات المنطقة: استجابة GET /api/region' : 'لا توجد بيانات منطقة مستلمة'} <span className="footer-separator">/</span> <span className="source-warning">الخلفية الجغرافية غير متاحة</span></div>
        <button className="fit-button" type="button" onClick={() => { if (region?.landingPoint) onSetStart(region.landingPoint); }} disabled={!region?.landingPoint}>
          <RotateCcw size={13} /> {text(language, 'إعادة إلى نقطة الهبوط', 'Return to landing point')}
        </button>
      </div>
      <ElevationChart route={selectedRoute} visible={elevationVisible} slopeVisible={slopeVisible} />
    </section>
  );
}
