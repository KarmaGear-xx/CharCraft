import { useState, type ReactNode } from 'react';
import type { FieldMeta } from '../core/fields';
import { tokenCount } from '../core/token';
import { useT } from '../i18n';
import FullscreenEditor from './FullscreenEditor';
import ArrayTextInput from './ArrayTextInput';

interface Props {
  field: FieldMeta;
  value: unknown;
  enabled: boolean;
  locked?: boolean;
  generating?: boolean;
  onChange: (value: unknown) => void;
  onToggle: (checked: boolean) => void;
  onAi: () => void;
}

export default function FieldEditor({ field, value, enabled, locked, generating, onChange, onToggle, onAi }: Props) {
  const t = useT();
  const arr = Array.isArray(value) ? (value as string[]) : [];
  const tokens = tokenCount(field.kind === 'tags' || field.kind === 'array' ? arr.join('\n') : String(value ?? ''));
  const [fullscreen, setFullscreen] = useState(false);

  let input: ReactNode;
  if (field.kind === 'text') {
    input = <input type="text" value={String(value ?? '')} disabled={!enabled} onChange={(e) => onChange(e.target.value)} />;
  } else if (field.kind === 'textarea') {
    input = <textarea rows={4} value={String(value ?? '')} disabled={!enabled} onChange={(e) => onChange(e.target.value)} />;
  } else if (field.kind === 'tags') {
    input = <ArrayTextInput values={arr} delimiter="," disabled={!enabled} onChange={onChange} />;
  } else {
    input = <ArrayTextInput values={arr} delimiter={'\n'} multiline disabled={!enabled} onChange={onChange} />;
  }

  return (
    <div className={'field' + (enabled ? '' : ' disabled')}>
      <div className="field-head">
        <label className="field-label">
          <input
            type="checkbox"
            checked={enabled}
            disabled={locked}
            title={locked ? t('field.lockedHint') : undefined}
            onChange={(e) => onToggle(e.target.checked)}
          />
          <span>{t(field.labelKey)}</span>
          <code className="field-key">{field.key}</code>
        </label>
        <span className="field-tokens" title="tokens">
          {tokens}
        </span>
        {field.kind === 'textarea' && (
          <button className="fs-btn" disabled={!enabled} title={t('editor.fullscreen')} onClick={() => setFullscreen(true)}>
            ⛶
          </button>
        )}
        <button className="ai-btn" disabled={!enabled || generating} onClick={onAi}>
          {generating ? t('editor.generating') : '✨ ' + t('field.aiRewrite')}
        </button>
      </div>
      {input}
      {fullscreen && (
        <FullscreenEditor
          title={t(field.labelKey)}
          value={String(value ?? '')}
          onConfirm={(v) => onChange(v)}
          onClose={() => setFullscreen(false)}
        />
      )}
    </div>
  );
}
