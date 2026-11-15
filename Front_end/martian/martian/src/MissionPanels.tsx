import {
  Activity,
  AlertTriangle,
  Check,
  Clock3,
  FlaskConical,
  Gauge,
  Mountain,
  Radiation,
  Route,
  ShieldAlert,
  Satellite,
  SlidersHorizontal,
  Thermometer,
  Wind,
} from 'lucide-react';
import type { RouteMetrics, ScienceTarget } from './types';
import { text, type Language } from './i18n';

export type LayerKey = 'topography' | 'optical' | 'radiation' | 'thermal' | 'spectral' | 'atmosphere' | 'slope';

interface LayerInfo {
  key: LayerKey;
  label: string;
  english: string;
  available: boolean;
  scope: string;
  reading?: string;
  icon: typeof Mountain;
}

interface LayersProps {
  route?: RouteMetrics;
  target?: ScienceTarget;
  visible: Record<LayerKey, boolean>;
  onToggle: (key: LayerKey) => void;
  overlayOpacity: number;
  onOpacityChange: (value: number) => void;
  language: Language;
}

export function LayersPanel({ route, target, visible, onToggle, overlayOpacity, onOpacityChange, language }: LayersProps) {
  const opticalImage = Boolean(route?.imageUrl || target?.images.length);
  const layers: LayerInfo[] = [
    {
      key: 'topography', label: 'التضاريس والارتفاع', english: 'TOPOGRAPHY',
      available: Boolean(route?.elevationProfile.length), scope: route?.elevationProfile.length ? 'ملف ارتفاع للمسار' : 'لا توجد بيانات ارتفاع',
      reading: route?.elevationProfile.length ? 'ملف الارتفاع متاح' : undefined, icon: Mountain,
    },
    {
      key: 'optical', label: 'مرجع بصري', english: 'OPTICAL', available: opticalImage,
      scope: opticalImage ? 'صورة مرجعية' : 'لا توجد صورة من الـAPI', reading: opticalImage ? 'صورة متاحة في البطاقة' : undefined, icon: Satellite,
    },
    {
      key: 'radiation', label: 'الإشعاع', english: 'RADIATION', available: route?.averageRadiation !== undefined,
      scope: route?.averageRadiation !== undefined ? 'متوسط المسار' : 'غير متاح',
      reading: route?.averageRadiation !== undefined ? `${route.averageRadiation.toFixed(2)} · قيمة الاستجابة` : undefined, icon: Radiation,
    },
    {
      key: 'thermal', label: 'الحرارة', english: 'THERMAL', available: route?.surfaceTempC !== undefined,
      scope: route?.surfaceTempC !== undefined ? 'قراءة المسار' : 'غير متاح',
      reading: route?.surfaceTempC !== undefined ? `${route.surfaceTempC.toFixed(1)} °C` : undefined, icon: Thermometer,
    },
    {
      key: 'spectral', label: 'الطيف / المعادن', english: 'SPECTRAL', available: Boolean(route?.minerals.length),
      scope: route?.minerals.length ? 'قراءة وصفية' : 'غير متاح', reading: route?.minerals.join(' · '), icon: FlaskConical,
    },
    {
      key: 'atmosphere', label: 'الغلاف الجوي', english: 'ATMOSPHERE', available: route?.pressurePa !== undefined,
      scope: route?.pressurePa !== undefined ? 'قراءة المسار' : 'غير متاح',
      reading: route?.pressurePa !== undefined ? `${route.pressurePa.toFixed(1)} Pa` : undefined, icon: Wind,
    },
    {
      key: 'slope', label: 'مخاطر الميل', english: 'SLOPE HAZARD', available: route?.maxSlopeDeg !== undefined,
      scope: route?.maxSlopeDeg !== undefined ? 'أقصى ميل للمسار' : 'غير متاح',
      reading: route?.maxSlopeDeg !== undefined ? `${route.maxSlopeDeg.toFixed(1)}°` : undefined, icon: ShieldAlert,
    },
  ];

  const availableCount = layers.filter((layer) => layer.available).length;

  return (
    <aside className="layers-panel panel-surface" aria-label={text(language, 'طبقات البيانات', 'Data layers')}>
      <div className="panel-heading">
        <div>
          <div className="section-eyebrow">MISSION OVERLAYS</div>
          <h2>{text(language, 'طبقات البيانات', 'Data layers')}</h2>
        </div>
        <span className="count-chip">{String(availableCount).padStart(2, '0')} / 07</span>
      </div>
      <p className="panel-subtitle">{text(language, 'تُفعّل الخيارات عند وصول قراءة حقيقية من الخادم.', 'Options activate when a live reading arrives from the server.')}</p>

      <div className="layer-stack">
        {layers.map((layer) => {
          const Icon = layer.icon;
          const isVisible = visible[layer.key];
          return (
            <div key={layer.key} className={`layer-card ${layer.available ? 'layer-available' : 'layer-unavailable'} ${isVisible && layer.available ? 'layer-on' : ''}`}>
              <button
                type="button"
                className="layer-toggle-row"
                role="switch"
                aria-checked={Boolean(isVisible && layer.available)}
                aria-label={text(language, `إظهار ${layer.label}`, `Show ${layer.english.toLowerCase()}`)}
                disabled={!layer.available}
                onClick={() => onToggle(layer.key)}
              >
                <span className={`layer-icon layer-${layer.key}`}><Icon size={16} strokeWidth={1.8} /></span>
                <span className="layer-name">
                  <b>{layer.label}</b>
                  <small>{layer.english}</small>
                </span>
                <span className={`switch ${isVisible && layer.available ? 'switch-on' : ''}`}><i /></span>
              </button>
              <div className="layer-meta">
                <span>{layer.scope}</span>
                {layer.available && layer.reading && isVisible ? <b>{layer.reading}</b> : !layer.available ? <span className="layer-lock">{text(language, 'بانتظار بيانات', 'Awaiting data')}</span> : <span className="layer-hidden">{text(language, 'مخفاة', 'Hidden')}</span>}
              </div>
            </div>
          );
        })}
      </div>

      <div className="opacity-control">
        <div className="opacity-title"><span><SlidersHorizontal size={14} /> {text(language, 'شفافية دلالات الخريطة', 'Map overlay opacity')}</span><b>{overlayOpacity}%</b></div>
        <input aria-label={text(language, 'شفافية الدلالات فوق المخطط', 'Overlay opacity')} type="range" min="20" max="100" value={overlayOpacity} onChange={(event) => onOpacityChange(Number(event.target.value))} />
        <p>{text(language, 'تؤثر على علامات البداية وخطوط المسار فقط؛ لا توجد بلاطات Raster ضمن الواجهات الموثقة.', 'Applies only to start markers and route lines; documented APIs provide no raster tiles.')}</p>
      </div>

      <div className="layer-coverage-note">
        <div className="note-icon"><AlertTriangle size={15} /></div>
        <div><b>{text(language, 'تغطية مكانية غير مؤكدة', 'Unconfirmed spatial coverage')}</b><p>{text(language, 'قيم المسار أو الموقع لا تعني وجود طبقة جغرافية ملوّنة. أُخفيت الطبقات غير المرسلة.', 'Route or location values do not imply a colored geographic layer. Unsent layers are hidden.')}</p></div>
      </div>
      <div className="panel-bottom-tag"><Activity size={13} /> <span>مصدر البيانات: استجابة المهمة الحالية</span></div>
    </aside>
  );
}

interface MissionProps {
  targets: ScienceTarget[];
  selectedTarget?: ScienceTarget;
  selectedTargetId?: string;
  onTargetChange: (id: string) => void;
  routes: RouteMetrics[];
  selectedProfile?: string;
  onRouteSelect: (profile: string) => void;
  start?: { lat: number; lon: number };
  onPlan: () => void;
  loading: boolean;
  routeError?: string;
  demoMode: boolean;
  routeWarning?: string;
  layerVisible: Record<LayerKey, boolean>;
  onConfirm: () => void;
  language: Language;
}

const profileLabel: Record<string, string> = {
  shortest: 'الأقصر', safest: 'الأكثر أمانًا', balanced: 'متوازن',
};

const profileDescription: Record<string, string> = {
  shortest: 'أقل مسافة · قد ترتفع المخاطر',
  safest: 'يراعي عوامل السلامة المتاحة',
  balanced: 'موازنة بين المسافة والسلامة',
};

function formatRisk(risk?: string): { label: string; className: string } {
  const key = risk?.toLowerCase() ?? '';
  if (key.includes('low')) return { label: 'منخفض', className: 'risk-low' };
  if (key.includes('medium') || key.includes('moderate')) return { label: 'متوسط', className: 'risk-medium' };
  if (key.includes('high')) return { label: 'مرتفع', className: 'risk-high' };
  return { label: 'غير متاح', className: 'risk-unknown' };
}

function formatDuration(value?: number): string {
  if (value === undefined) return '—';
  return Number.isInteger(value) ? `${value}` : value.toFixed(1);
}

export function MissionPanel({
  targets, selectedTarget, selectedTargetId, onTargetChange, routes, selectedProfile,
  onRouteSelect, start, onPlan, loading, routeError, demoMode, routeWarning, layerVisible, onConfirm, language,
}: MissionProps) {
  return (
    <aside className="mission-panel panel-surface" aria-label={text(language, 'تخطيط المهمة والمسارات', 'Mission and route planning')}>
      <div className="panel-heading route-panel-heading">
        <div><div className="section-eyebrow">MARSWALK PLAN</div><h2>{text(language, 'تخطيط المسار', 'Route planning')}</h2></div>
        <span className="route-count"><Route size={13} /> {routes.length} {text(language, 'مسار', 'routes')}</span>
      </div>

      <div className="route-form">
        <label htmlFor="target-select">{text(language, 'الهدف العلمي', 'Science target')}</label>
        <div className="select-wrap">
          <select id="target-select" value={selectedTargetId ?? ''} onChange={(event) => onTargetChange(event.target.value)} disabled={!targets.length}>
            {!targets.length && <option value="">{text(language, 'لا توجد أهداف من الـAPI', 'No targets from API')}</option>}
            {targets.map((target) => <option key={target.id} value={target.id}>{target.name}</option>)}
          </select>
          <span className="select-chevron" />
        </div>
        <div className="start-coordinate"><span className="start-dot-small" /><span>{text(language, 'نقطة البداية', 'Start point')}</span><b dir="ltr">{start ? `${start.lat.toFixed(4)}°, ${start.lon.toFixed(4)}°` : text(language, 'حدد على الخريطة', 'Select on map')}</b></div>
        <button className="plan-button" type="button" onClick={onPlan} disabled={loading || !selectedTarget || !start}>
          {loading ? <span className="loading-ring light" /> : <Route size={16} />}
          {loading ? text(language, 'جارٍ حساب المسارات…', 'Calculating routes…') : text(language, 'احسب المسارات', 'Calculate routes')}
          {!loading && <span className="button-arrow">↗</span>}
        </button>
        {!start && <p className="form-hint">{text(language, 'اختر نقطة البداية بالنقر على المخطط أولًا.', 'Choose a start point by clicking the map first.')}</p>}
        {routeError && <div className="inline-error"><AlertTriangle size={14} /><span>{routeError}</span></div>}
        {routeWarning && <div className="inline-warning"><AlertTriangle size={14} /><span>{routeWarning}</span></div>}
      </div>

      <div className="route-list-heading"><span>{text(language, 'خيارات المسار', 'Route options')}</span><small>{routes.length ? `${routes.length} ${text(language, 'مستلم من الخادم', 'received from server')}` : text(language, 'بانتظار الحساب', 'Awaiting calculation')}</small></div>
      <div className="route-list">
        {routes.length ? routes.map((route, index) => {
          const profile = route.profile.toLowerCase();
          const active = route.profile === selectedProfile;
          const risk = formatRisk(route.risk);
          return (
            <button key={`${route.profile}-${index}`} type="button" className={`route-card ${active ? 'route-card-active' : ''} profile-${profile}`} onClick={() => onRouteSelect(route.profile)} aria-pressed={active}>
              <span className={`route-radio ${active ? 'route-radio-checked' : ''}`}>{active && <Check size={10} />}</span>
              <span className="route-card-content">
                <span className="route-card-top"><b>{profileLabel[profile] ?? route.profile}</b><small>{route.profile.toUpperCase()}</small></span>
                <span className="route-card-sub">{profileDescription[profile] ?? 'مسار مستلم من الـAPI'}</span>
                <span className="route-metrics">
                  <span><Route size={12} /> {route.distanceKm !== undefined ? `${route.distanceKm.toFixed(1)} كم` : '— كم'}</span>
                  <span><Clock3 size={12} /> {formatDuration(route.durationMin)} د</span>
                  <span className={`risk-pill ${risk.className}`}><i /> {risk.label}</span>
                </span>
                {(route.maxSlopeDeg !== undefined || route.averageRadiation !== undefined) && (
                  <span className="route-extra-metrics">
                    {route.maxSlopeDeg !== undefined && <span><Mountain size={11} /> ميل {route.maxSlopeDeg.toFixed(1)}°</span>}
                    {route.averageRadiation !== undefined && <span><Gauge size={11} /> إشعاع {route.averageRadiation.toFixed(2)}</span>}
                  </span>
                )}
              </span>
            </button>
          );
        }) : (
          <div className="no-routes-state">
            <div className="no-route-icon"><Route size={19} /></div>
            <b>{text(language, 'لا توجد مسارات بعد', 'No routes yet')}</b>
            <span>{text(language, 'اختر هدفًا ونقطة بداية، ثم اطلب الحساب من الـAPI.', 'Choose a target and start point, then request a calculation from the API.')}</span>
          </div>
        )}
      </div>

      {routes.some((route) => route.profile === selectedProfile) && <button type="button" className="confirm-mission-button" onClick={onConfirm}><Check size={14} /> تأكيد المهمة ومراجعة الملخص</button>}

      <TargetCard target={selectedTarget} route={routes.find((route) => route.profile === selectedProfile)} demoMode={demoMode} layerVisible={layerVisible} />
    </aside>
  );
}

interface TargetCardProps {
  target?: ScienceTarget;
  route?: RouteMetrics;
  demoMode: boolean;
  layerVisible: Record<LayerKey, boolean>;
}

const nasaContext = '/manus-storage/mount-sharp-nasa_914df2c1.jpg';
const nasaSource = 'https://science.nasa.gov/resource/mount-sharp-inside-gale-crater-mars/';

function TargetCard({ target, route, demoMode, layerVisible }: TargetCardProps) {
  const targetImage = target?.images[0];
  const imageUrl = layerVisible.optical ? (route?.imageUrl || targetImage?.url || (demoMode ? nasaContext : undefined)) : undefined;
  const contextOnly = demoMode && !route?.imageUrl && (!targetImage?.url || targetImage.type === 'context');
  const credit = route?.imageCredit || targetImage?.credit || (contextOnly ? 'NASA/JPL-Caltech/ESA/DLR/FU Berlin/MSSS' : undefined);

  return (
    <section className="target-card">
      <div className="target-card-head"><span className="target-card-icon"><Satellite size={15} /></span><div><span className="section-eyebrow">SCIENCE TARGET</span><b>بيانات الهدف</b></div><span className="target-scope">{target ? 'من بيانات المنطقة' : 'بانتظار API'}</span></div>
      {target ? (
        <>
          <h3>{target.name}</h3>
          {target.coordinate && <div className="target-coords" dir="ltr">{Math.abs(target.coordinate.lat).toFixed(4)}° {target.coordinate.lat < 0 ? 'S' : 'N'} / {Math.abs(target.coordinate.lon).toFixed(4)}° {target.coordinate.lon < 0 ? 'W' : 'E'} <span>·</span> MARS</div>}
          {imageUrl ? (
            <div className="target-image-wrap">
              <img src={imageUrl} alt={contextOnly ? 'منظر سياقي عام لجبل شارب داخل فوهة غيل' : `مرجع بصري لـ${target.name}`} loading="lazy" />
              <span className="image-badge">{contextOnly ? 'REGIONAL CONTEXT · NOT GEO-REFERENCED' : 'VISUAL REFERENCE'}</span>
              {contextOnly && <span className="image-overlay-label">MOUNT SHARP · GALE CRATER</span>}
            </div>
          ) : <div className="target-image-empty"><Satellite size={19} /><span>{layerVisible.optical ? 'لم ترسل الـAPI صورة لهذا الهدف.' : 'الطبقة البصرية مخفية من لوحة الطبقات.'}</span></div>}
          <div className="target-copy">
            {target.description && <p>{target.description}</p>}
            {target.importance && <div className="science-importance"><FlaskConical size={13} /><span>{target.importance}</span></div>}
            {route?.visualGuidance && <div className="visual-guidance"><b>إرشاد بصري</b><p>{route.visualGuidance}</p></div>}
            {route?.visualTerrain && layerVisible.topography && <div className="terrain-note"><Mountain size={13} /><span>{route.visualTerrain}</span></div>}
            {route?.minerals.length && layerVisible.spectral ? <div className="science-importance"><FlaskConical size={13} /><span>{route.minerals.join(' · ')}</span></div> : null}
          </div>
          {credit && imageUrl && <div className="image-credit">{contextOnly ? <a href={nasaSource} target="_blank" rel="noreferrer">المصدر: {credit}</a> : `الاعتماد: ${credit}`}</div>}
        </>
      ) : (
        <div className="target-empty-copy"><b>لم تُستلم أهداف علمية بعد</b><p>تظهر أسماء الأهداف وإحداثياتها وأهميتها هنا بعد نجاح <code>GET /api/region</code>.</p></div>
      )}
    </section>
  );
}

export function ElevationChart({ route, visible, slopeVisible }: { route?: RouteMetrics; visible: boolean; slopeVisible: boolean }) {
  const values = route?.elevationProfile ?? [];
  if (!visible) {
    return (
      <section className="elevation-card">
        <div className="elevation-head"><span><Activity size={15} /> ملف الارتفاع</span><small>HIDDEN</small></div>
        <div className="chart-empty"><div><b>طبقة التضاريس مخفية</b><small>فعّلها من لوحة طبقات البيانات.</small></div></div>
      </section>
    );
  }
  if (!values.length) {
    return (
      <section className="elevation-card">
        <div className="elevation-head"><span><Activity size={15} /> ملف الارتفاع</span><small>ELEVATION PROFILE</small></div>
        <div className="chart-empty"><span className="chart-axis"><i /><i /><i /></span><div><b>الملف غير متاح</b><small>يظهر الرسم عند إرسال <code>elevation_profile</code> من الخادم.</small></div></div>
      </section>
    );
  }
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = Math.max(max - min, 1);
  const points = values.map((value, index) => {
    const x = values.length === 1 ? 0 : (index / (values.length - 1)) * 280;
    const y = 68 - ((value - min) / span) * 48;
    return `${x},${y}`;
  }).join(' ');
  const area = `0,72 ${points} 280,72`;
  return (
    <section className="elevation-card">
      <div className="elevation-head"><span><Activity size={15} /> ملف الارتفاع</span><small>{values.length} نقاط</small></div>
      <div className="elevation-chart-wrap">
        <svg viewBox="0 0 280 78" preserveAspectRatio="none" aria-label="مخطط الارتفاع">
          <defs><linearGradient id="elevFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#e58a5a" stopOpacity="0.27" /><stop offset="1" stopColor="#e58a5a" stopOpacity="0" /></linearGradient></defs>
          <path d={`M${area.replaceAll(' ', ' L')}`} fill="url(#elevFill)" />
          <polyline points={points} fill="none" stroke="#e79662" strokeWidth="2" vectorEffect="non-scaling-stroke" />
          {values.map((value, index) => {
            const x = values.length === 1 ? 0 : (index / (values.length - 1)) * 280;
            const y = 68 - ((value - min) / span) * 48;
            return <circle key={`${value}-${index}`} cx={x} cy={y} r="2.5" fill="#ffd1ae" />;
          })}
        </svg>
        <div className="elev-values"><span>{min.toFixed(0)} m</span><span>{max.toFixed(0)} m</span></div>
      </div>
      {slopeVisible && route?.maxSlopeDeg !== undefined && <div className="max-slope-row"><ShieldAlert size={13} /><span>أقصى ميل ضمن بيانات المسار</span><b>{route.maxSlopeDeg.toFixed(1)}°</b></div>}
    </section>
  );
}
