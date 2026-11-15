import { useState } from 'react';
import { Check, Link2, X } from 'lucide-react';
import { text, type Language } from './i18n';

interface Props {
  value: string;
  onClose: () => void;
  onSave: (value: string) => void;
  language: Language;
}

export function ApiSettingsDialog({ value, onClose, onSave, language }: Props) {
  const [draft, setDraft] = useState(value);
  const [error, setError] = useState('');

  const save = () => {
    const normalized = draft.trim().replace(/\/+$/, '');
    try {
      const url = new URL(normalized);
      if (!['http:', 'https:'].includes(url.protocol)) throw new Error('protocol');
      onSave(normalized);
    } catch {
      setError('أدخل رابطًا كاملًا يبدأ بـ http:// أو https://.');
    }
  };

  return (
    <div className="dialog-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="settings-dialog" role="dialog" aria-modal="true" aria-labelledby="api-settings-title">
        <div className="dialog-head"><span className="dialog-icon"><Link2 size={17} /></span><button type="button" className="icon-button" aria-label="إغلاق" onClick={onClose}><X size={18} /></button></div>
        <div className="section-eyebrow">{text(language, 'إعدادات الاتصال', 'CONNECTION SETTINGS')}</div>
        <h2 id="api-settings-title">{text(language, 'عنوان خادم الـAPI', 'API server URL')}</h2>
        <p>{text(language, 'يُستخدم هذا العنوان للواجهات الموثقة فقط:', 'This URL is used only for the documented endpoints:')} <code>/health</code>، <code>/region</code>، <code>/routes</code>.</p>
        <label htmlFor="api-url">Base URL</label>
        <input id="api-url" dir="ltr" value={draft} onChange={(event) => { setDraft(event.target.value); setError(''); }} onKeyDown={(event) => { if (event.key === 'Enter') save(); }} autoFocus />
        {error && <span className="dialog-error">{error}</span>}
        <div className="dialog-note">{text(language, 'إذا كان الموقع مستضافًا في المتصفح، فـ localhost يشير إلى جهاز المستخدم. يلزم أن يكون الخادم متاحًا للمتصفح وأن يسمح بإعداد CORS.', 'When hosted in a browser, localhost refers to the user’s device. The server must be browser-accessible and allow CORS.')}</div>
        <button type="button" className="dialog-save" onClick={save}><Check size={15} /> {text(language, 'حفظ وإعادة الاتصال', 'Save and reconnect')}</button>
      </section>
    </div>
  );
}
