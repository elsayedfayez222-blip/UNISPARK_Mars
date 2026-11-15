import { AlertTriangle, Check, Clock3, Route, ShieldCheck, X } from 'lucide-react';
import type { Coordinate, RouteMetrics, ScienceTarget } from './types';
import { text, type Language } from './i18n';

interface Props {
  target?: ScienceTarget;
  route?: RouteMetrics;
  start?: Coordinate;
  demoMode: boolean;
  onClose: () => void;
  language: Language;
}

function riskName(value?: string): string {
  const risk = value?.toLowerCase() ?? '';
  if (risk.includes('low')) return 'منخفض';
  if (risk.includes('medium') || risk.includes('moderate')) return 'متوسط';
  if (risk.includes('high')) return 'مرتفع';
  return 'غير متاح';
}

function profileName(value: string): string {
  const profile = value.toLowerCase();
  if (profile.includes('safe')) return 'الأكثر أمانًا';
  if (profile.includes('short')) return 'الأقصر';
  if (profile.includes('balanc')) return 'المتوازن';
  return value;
}

export function MissionSummaryDialog({ target, route, start, demoMode, onClose, language }: Props) {
  if (!target || !route) return null;
  return (
    <div className="dialog-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="settings-dialog mission-summary-dialog" role="dialog" aria-modal="true" aria-labelledby="mission-summary-title">
        <div className="dialog-head"><span className="dialog-icon"><ShieldCheck size={17} /></span><button type="button" className="icon-button" aria-label="إغلاق" onClick={onClose}><X size={18} /></button></div>
        <div className="section-eyebrow">MISSION BRIEFING · {demoMode ? 'SAMPLE' : 'API RESPONSE'}</div>
        <h2 id="mission-summary-title">{text(language, 'ملخص الخروجة', 'Mission summary')}</h2>
        <p>{text(language, 'مراجعة معلومات المسار المحدد قبل المتابعة. لا يرسل هذا الإجراء أوامر إلى المركبة أو الـBack End.', 'Review the selected route before continuing. This action does not send commands to the vehicle or back end.')}</p>
        <div className="summary-target"><small>{text(language, 'الهدف العلمي', 'Science target')}</small><b>{target.name}</b></div>
        <div className="summary-route"><span className="summary-route-icon"><Route size={15} /></span><div><small>{text(language, 'المسار المختار', 'Selected route')}</small><b>{profileName(route.profile)} <i>·</i> {riskName(route.risk)} {text(language, 'الخطورة', 'risk')}</b></div></div>
        <div className="summary-metrics">
          <div><small>{text(language, 'المسافة', 'Distance')}</small><b>{route.distanceKm !== undefined ? `${route.distanceKm.toFixed(1)} ${text(language, 'كم', 'km')}` : text(language, 'غير متاح', 'Unavailable')}</b></div>
          <div><small>{text(language, 'المدة التقديرية', 'Estimated duration')}</small><b><Clock3 size={13} /> {route.durationMin !== undefined ? `${route.durationMin} ${text(language, 'دقيقة', 'min')}` : text(language, 'غير متاح', 'Unavailable')}</b></div>
          <div><small>{text(language, 'أقصى ميل', 'Maximum slope')}</small><b>{route.maxSlopeDeg !== undefined ? `${route.maxSlopeDeg.toFixed(1)}°` : text(language, 'غير متاح', 'Unavailable')}</b></div>
          <div><small>{text(language, 'متوسط الإشعاع', 'Average radiation')}</small><b>{route.averageRadiation !== undefined ? route.averageRadiation.toFixed(2) : text(language, 'غير متاح', 'Unavailable')}</b></div>
        </div>
        <div className="summary-coordinates"><span>START</span><b dir="ltr">{start ? `${start.lat.toFixed(4)}°, ${start.lon.toFixed(4)}°` : '—'}</b></div>
        <div className="dialog-note summary-warning"><AlertTriangle size={14} /><span>الوقت والقياسات والحدود المعروضة تعتمد على رد الخادم. لا تمثل قيمة تشغيلية معتمدة لبدلات الرواد أو قرار سلامة حقيقي.</span></div>
        <button type="button" className="dialog-save summary-close" onClick={onClose}><Check size={15} /> {text(language, 'تمّت المراجعة', 'Reviewed')}</button>
      </section>
    </div>
  );
}
