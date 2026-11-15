import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  CircleHelp,
  Compass,
  Crosshair,
  Database,
  Gauge,
  LoaderCircle,
  Radio,
  RefreshCw,
  Settings2,
  ShieldCheck,
  Sparkles,
  Thermometer,
  Wind,
  X,
} from 'lucide-react';
import { apiBaseUrl, fetchHealth, fetchRegion, requestRoutes } from './api';
import { ApiSettingsDialog } from './ApiSettingsDialog';
import { LayersPanel, type LayerKey, MissionPanel } from './MissionPanels';
import { MissionSummaryDialog } from './MissionSummaryDialog';
import { MapPanel } from './MapPanel';
import { demoRegion, demoRoutes } from './demo';
import type { Coordinate, HealthResponse, MartianRegion, RouteMetrics, RoutesResponse } from './types';
import { text, type Language } from './i18n';

const defaultLayers: Record<LayerKey, boolean> = {
  topography: true, optical: true, radiation: true, thermal: true, spectral: true, atmosphere: true, slope: true,
};

type ApiState = 'connecting' | 'connected' | 'degraded' | 'offline';

function riskLabel(risk?: string): string {
  if (!risk) return 'غير متاح';
  if (risk.toLowerCase().includes('low')) return 'منخفض';
  if (risk.toLowerCase().includes('high')) return 'مرتفع';
  if (risk.toLowerCase().includes('med')) return 'متوسط';
  return risk;
}

function TopBar({
  apiState, health, demoMode, hudMode, language, onLanguageToggle, onSettings, onRetry, onHudToggle,
}: {
  apiState: ApiState; health?: HealthResponse; demoMode: boolean; hudMode: boolean;
  language: Language; onLanguageToggle: () => void; onSettings: () => void; onRetry: () => void; onHudToggle: () => void;
}) {
  const statusCopy: Record<ApiState, string> = {
    connecting: text(language, 'جارٍ الاتصال', 'Connecting'), connected: text(language, 'الخادم متصل', 'Server connected'),
    degraded: text(language, 'اتصال جزئي', 'Partial connection'), offline: text(language, 'غير متصل', 'Offline'),
  };
  return (
    <header className="topbar">
      <div className="brand-block">
        <div className="brand-mark" aria-hidden="true"><span className="brand-orbit" /><span className="brand-dot" /><b>M</b></div>
        <div className="brand-wordmark"><strong>MARTIAN<span> / </span>MAP</strong><small>INTERPLANETARY SURVIVAL SYSTEM</small></div>
      </div>
      <div className="mission-id"><span className="mission-id-icon"><Compass size={15} /></span><span><small>{text(language, 'منطقة المهمة', 'MISSION AREA')}</small><b>GALE CRATER <i>/</i> MOUNT SHARP</b></span></div>
      <div className="topbar-right">
        {demoMode && <span className="demo-pill"><Sparkles size={12} /> SAMPLE DATA</span>}
        <span className={`api-status api-${apiState}`}><i />{statusCopy[apiState]}</span>
        <span className="api-health-code" title={health?.system ?? 'Health endpoint'}><Radio size={13} /> API</span>
        <button type="button" className="language-toggle" onClick={onLanguageToggle} aria-label={text(language, 'التبديل إلى الإنجليزية', 'Switch to Arabic')}>{language === 'ar' ? 'English' : 'العربية'}</button>
        <button type="button" className={`hud-toggle ${hudMode ? 'hud-toggle-active' : ''}`} onClick={onHudToggle} title={text(language, 'تبديل وضع HUD', 'Toggle HUD mode')}><Crosshair size={14} /><span>{hudMode ? 'HUD ON' : 'HUD MODE'}</span></button>
        <button type="button" className="settings-button" onClick={onSettings} aria-label={text(language, 'إعدادات الاتصال', 'Connection settings')}><Settings2 size={17} /></button>
        <button type="button" className="retry-button" onClick={onRetry} aria-label={text(language, 'إعادة الاتصال', 'Reconnect')} title={text(language, 'إعادة الاتصال', 'Reconnect')}><RefreshCw size={15} /></button>
      </div>
    </header>
  );
}

function StatusStrip({ route, apiState, demoMode, hasRegion, layerVisible, language }: { route?: RouteMetrics; apiState: ApiState; demoMode: boolean; hasRegion: boolean; layerVisible: Record<LayerKey, boolean>; language: Language }) {
  const sourceLabel = demoMode ? 'SAMPLE PAYLOAD' : apiState === 'connecting' ? 'CONNECTING' : hasRegion || route ? 'API RESPONSE' : 'NO API DATA';
  const readings = [
    { icon: Thermometer, label: text(language, 'حرارة السطح', 'Surface temperature'), value: route?.surfaceTempC !== undefined ? `${route.surfaceTempC.toFixed(1)}°C` : '—', unit: route?.surfaceTempC !== undefined ? text(language, 'قراءة متاحة', 'Reading available') : text(language, 'لا توجد قراءة', 'No reading'), color: 'thermal', visible: layerVisible.thermal },
    { icon: Gauge, label: text(language, 'الإشعاع', 'Radiation'), value: route?.averageRadiation !== undefined ? route.averageRadiation.toFixed(2) : '—', unit: route?.averageRadiation !== undefined ? text(language, 'متوسط المسار', 'Route average') : text(language, 'لا توجد قراءة', 'No reading'), color: 'radiation', visible: layerVisible.radiation },
    { icon: Wind, label: text(language, 'الضغط الجوي', 'Atmospheric pressure'), value: route?.pressurePa !== undefined ? route.pressurePa.toFixed(1) : '—', unit: route?.pressurePa !== undefined ? 'Pa' : text(language, 'لا توجد قراءة', 'No reading'), color: 'pressure', visible: layerVisible.atmosphere },
    { icon: ShieldCheck, label: text(language, 'مستوى المخاطر', 'Risk level'), value: route?.risk ? riskLabel(route.risk) : '—', unit: route?.risk ? text(language, 'وفق رد المسار', 'From route response') : text(language, 'بانتظار مسار', 'Awaiting route'), color: 'risk', visible: layerVisible.slope },
  ];
  return (
    <section className="status-strip" aria-label={text(language, 'قراءات المهمة', 'Mission telemetry')}>
      <div className="mission-status-label"><span className="status-signal"><Activity size={16} /></span><div><small>MISSION TELEMETRY</small><b>{apiState === 'connected' ? text(language, 'قناة البيانات جاهزة', 'Data channel ready') : apiState === 'connecting' ? text(language, 'جارٍ فتح قناة البيانات', 'Opening data channel') : demoMode ? text(language, 'وضع توضيحي · غير تشغيلي', 'Demo mode · non-operational') : text(language, 'بانتظار اتصال الـAPI', 'Awaiting API connection')}</b></div></div>
      <div className="telemetry-readings">
        {readings.map(({ icon: Icon, label, value, unit, color, visible }) => (
          <div key={label} className={`telemetry-item telemetry-${color}`}>
            <span className="telemetry-icon"><Icon size={15} /></span><div className="telemetry-copy"><small>{label}</small><b>{visible ? value : text(language, 'مخفي', 'Hidden')}</b><em>{visible ? unit : text(language, 'طبقة مخفية', 'Layer hidden')}</em></div>
          </div>
        ))}
      </div>
      <div className="telemetry-right"><span className="source-chip"><Database size={13} /> {sourceLabel}</span><span className="utc-time">MARSWALK <i>·</i> PLANNING</span></div>
    </section>
  );
}

function ConnectionBanner({ state, error, onRetry, onDemo, demoMode, language }: { state: ApiState; error?: string; onRetry: () => void; onDemo: () => void; demoMode: boolean; language: Language }) {
  if (state === 'connected' || demoMode) return null;
  return (
    <div className={`connection-banner ${state === 'connecting' ? 'connection-loading' : ''}`}>
      <span className="connection-banner-icon">{state === 'connecting' ? <LoaderCircle size={17} className="spin" /> : <AlertTriangle size={17} />}</span>
      <div className="connection-banner-copy"><b>{state === 'connecting' ? text(language, 'جارٍ الاتصال بواجهات المهمة', 'Connecting to mission interfaces') : text(language, 'تعذر التحقق من الـBack End', 'Could not verify the back end')}</b><span>{error ?? text(language, 'عنوان الخادم الافتراضي https://localhost:7215/api — يمكنك تغييره من إعدادات الاتصال.', 'Default server URL is https://localhost:7215/api — change it in connection settings.')}</span></div>
      {state !== 'connecting' && <div className="connection-actions"><button type="button" onClick={onRetry}>{text(language, 'إعادة المحاولة', 'Retry')}</button><button type="button" className="sample-link" onClick={onDemo}>{text(language, 'فتح بيانات المثال', 'Open sample data')}</button></div>}
    </div>
  );
}

function App() {
  const [language, setLanguage] = useState<Language>('ar');
  const [apiUrl, setApiUrl] = useState(() => {
    try { return localStorage.getItem('martian-api-base') || apiBaseUrl(); } catch { return apiBaseUrl(); }
  });
  const [apiState, setApiState] = useState<ApiState>('connecting');
  const [health, setHealth] = useState<HealthResponse>();
  const [region, setRegion] = useState<MartianRegion>();
  const [regionError, setRegionError] = useState<string>();
  const [routeError, setRouteError] = useState<string>();
  const [routesWarning, setRoutesWarning] = useState<string>();
  const [routeResponse, setRouteResponse] = useState<RoutesResponse>();
  const [selectedTargetId, setSelectedTargetId] = useState<string>();
  const [start, setStart] = useState<Coordinate>();
  const [selectedProfile, setSelectedProfile] = useState<string>();
  const [loadingRoutes, setLoadingRoutes] = useState(false);
  const [loadingRegion, setLoadingRegion] = useState(true);
  const [demoMode, setDemoMode] = useState(false);
  const [hudMode, setHudMode] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [missionSummaryOpen, setMissionSummaryOpen] = useState(false);
  const [overlayOpacity, setOverlayOpacity] = useState(92);
  const [layerVisible, setLayerVisible] = useState(defaultLayers);

  const routes = routeResponse?.routes ?? [];
  const selectedTarget = region?.targets.find((target) => target.id === selectedTargetId);
  const selectedRoute = routes.find((route) => route.profile === selectedProfile) ?? routes[0];
  const statusError = regionError;

  const refreshApi = useCallback(async (base = apiUrl) => {
    setDemoMode(false);
    setLoadingRegion(true);
    setRegion(undefined);
    setSelectedTargetId(undefined);
    setStart(undefined);
    setHealth(undefined);
    setRouteResponse(undefined);
    setSelectedProfile(undefined);
    setRouteError(undefined);
    setRoutesWarning(undefined);
    setRegionError(undefined);
    setApiState('connecting');
    const [healthResult, regionResult] = await Promise.allSettled([fetchHealth(base), fetchRegion(base)]);

    if (healthResult.status === 'fulfilled') setHealth(healthResult.value);
    else setHealth(undefined);
    if (regionResult.status === 'fulfilled') {
      const nextRegion = regionResult.value;
      setRegion(nextRegion);
      const firstTarget = nextRegion.targets[0];
      setSelectedTargetId(firstTarget?.id);
      setStart(nextRegion.landingPoint);
      setRegionError(undefined);
    } else {
      setRegion(undefined);
      setSelectedTargetId(undefined);
      setStart(undefined);
      const message = regionResult.reason instanceof Error ? regionResult.reason.message : 'تعذر جلب بيانات المنطقة.';
      setRegionError(message);
    }

    const healthOk = healthResult.status === 'fulfilled' && healthResult.value.status.toLowerCase() === 'healthy';
    if (healthOk && regionResult.status === 'fulfilled') setApiState('connected');
    else if (healthResult.status === 'fulfilled' || regionResult.status === 'fulfilled') setApiState('degraded');
    else setApiState('offline');
    setLoadingRegion(false);
  }, [apiUrl]);

  useEffect(() => { void refreshApi(); }, [refreshApi]);

  const currentTargetName = useMemo(() => selectedTarget?.name ?? routeResponse?.targetName, [selectedTarget, routeResponse]);

  const planRoute = async () => {
    if (!selectedTarget || !start) return;
    setLoadingRoutes(true);
    setRouteError(undefined);
    setRoutesWarning(undefined);
    if (demoMode) {
      const result = demoRoutes;
      setRouteResponse(result);
      setSelectedProfile(result.routes.some((route) => route.profile === 'safest') ? 'safest' : result.routes[0]?.profile);
      setLayerVisible(defaultLayers);
      setLoadingRoutes(false);
      return;
    }
    try {
      const response = await requestRoutes(apiUrl, start, selectedTarget.id);
      setRouteResponse(response);
      const firstAvailable = response.routes.find((route) => route.profile.toLowerCase().includes('safe')) ?? response.routes[0];
      setSelectedProfile(firstAvailable?.profile);
      if (!response.routes.length) setRoutesWarning('نجح الطلب لكن لم تُرجع الاستجابة أي مسارات.');
      else if (response.routes.length < 3) setRoutesWarning(`أعاد الخادم ${response.routes.length} مسارًا فقط؛ ستُعرض الخيارات المتوفرة دون إنشاء بدائل وهمية.`);
      setLayerVisible(defaultLayers);
    } catch (error) {
      setRouteError(error instanceof Error ? error.message : 'فشل طلب المسار.');
      setRouteResponse(undefined);
    } finally {
      setLoadingRoutes(false);
    }
  };

  const toggleDemo = () => {
    if (demoMode) {
      void refreshApi();
      return;
    }
    setDemoMode(true);
    setRegion(demoRegion);
    setRegionError(undefined);
    setSelectedTargetId(demoRegion.targets[0].id);
    setStart(demoRegion.landingPoint);
    setRouteResponse(undefined);
    setSelectedProfile(undefined);
    setRouteError(undefined);
    setRoutesWarning(undefined);
    setLayerVisible(defaultLayers);
  };

  const saveApiUrl = (value: string) => {
    setApiUrl(value);
    try { localStorage.setItem('martian-api-base', value); } catch { /* local storage is optional */ }
    setSettingsOpen(false);
    void refreshApi(value);
  };

  const toggleLayer = (key: LayerKey) => setLayerVisible((current) => ({ ...current, [key]: !current[key] }));
  return (
    <div className={`app-shell ${hudMode ? 'hud-mode' : ''}`} dir={language === 'ar' ? 'rtl' : 'ltr'} lang={language}>
      <TopBar
        apiState={apiState}
        health={health}
        demoMode={demoMode}
        hudMode={hudMode}
        language={language}
        onLanguageToggle={() => setLanguage((current) => current === 'ar' ? 'en' : 'ar')}
        onSettings={() => setSettingsOpen(true)}
        onRetry={() => void refreshApi()}
        onHudToggle={() => setHudMode((current) => !current)}
      />
      <StatusStrip route={selectedRoute} apiState={apiState} demoMode={demoMode} hasRegion={Boolean(region)} layerVisible={layerVisible} language={language} />
      <ConnectionBanner state={apiState} error={statusError} onRetry={() => void refreshApi()} onDemo={toggleDemo} demoMode={demoMode} language={language} />
      <main className="mission-layout">
        <LayersPanel
          route={selectedRoute}
          target={selectedTarget}
          visible={layerVisible}
          onToggle={toggleLayer}
          overlayOpacity={overlayOpacity}
          onOpacityChange={setOverlayOpacity}
          language={language}
        />
        <MapPanel
          region={region}
          routes={routes}
          selectedRoute={selectedRoute}
          elevationVisible={layerVisible.topography}
          slopeVisible={layerVisible.slope}
          selectedProfile={selectedProfile}
          selectedTargetId={selectedTargetId}
          start={start}
          onSetStart={(point) => { setStart(point); setRouteResponse(undefined); setSelectedProfile(undefined); setRouteError(undefined); setRoutesWarning(undefined); }}
          onSelectTarget={(id) => { setSelectedTargetId(id); setRouteResponse(undefined); setSelectedProfile(undefined); }}
          overlayOpacity={overlayOpacity}
          demoMode={demoMode}
          onToggleDemo={toggleDemo}
          loading={loadingRegion}
          error={regionError}
          language={language}
        />
        <MissionPanel
          targets={region?.targets ?? []}
          selectedTarget={selectedTarget}
          selectedTargetId={selectedTargetId}
          onTargetChange={(id) => { setSelectedTargetId(id); setRouteResponse(undefined); setSelectedProfile(undefined); }}
          routes={routes}
          selectedProfile={selectedProfile}
          onRouteSelect={setSelectedProfile}
          start={start}
          onPlan={planRoute}
          loading={loadingRoutes}
          routeError={routeError}
          demoMode={demoMode}
          routeWarning={routesWarning}
          layerVisible={layerVisible}
          onConfirm={() => setMissionSummaryOpen(true)}
          language={language}
        />
      </main>
      <footer className="page-footer">
        <span><span className="footer-brand-dot" /> MARTIAN MAP <i>·</i> MISSION PLANNING CONSOLE</span>
        <span className="footer-disclaimer"><CircleHelp size={12} /> {text(language, 'أداة تخطيط توضيحية؛ القراءات والقيود التشغيلية يجب اعتمادها من فريق المهمة.', 'Illustrative planning tool; the mission team must validate readings and operational constraints.')}</span>
        <span className="footer-build">{currentTargetName ? `TARGET: ${currentTargetName}` : 'NO TARGET SELECTED'} <i>·</i> API-FIRST UI</span>
      </footer>
      {missionSummaryOpen && <MissionSummaryDialog target={selectedTarget} route={selectedRoute} start={start} demoMode={demoMode} onClose={() => setMissionSummaryOpen(false)} language={language} />}
      {settingsOpen && <ApiSettingsDialog value={apiUrl} onClose={() => setSettingsOpen(false)} onSave={saveApiUrl} language={language} />}
      {demoMode && <div className="sample-watermark"><Sparkles size={13} /> SAMPLE PAYLOAD — NOT LIVE MISSION DATA <button type="button" onClick={toggleDemo} aria-label="إيقاف بيانات المثال"><X size={13} /></button></div>}
    </div>
  );
}

export default App;
