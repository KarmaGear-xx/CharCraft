import { useState } from 'react';
import { useT } from '../i18n';

interface Props {
  title: string;
  value: string;
  onConfirm: (value: string) => void;
  onClose: () => void;
}

export default function FullscreenEditor({ title, value, onConfirm, onClose }: Props) {
  const t = useT();
  const [text, setText] = useState(value);

  return (
    <div className="fullscreen-editor">
      <div className="fullscreen-head">
        <span className="fullscreen-title">{title}</span>
        <button className="modal-x" onClick={onClose} aria-label="close">
          ×
        </button>
      </div>
      <textarea
        className="fullscreen-textarea"
        value={text}
        onChange={(e) => setText(e.target.value)}
        autoFocus
      />
      <div className="fullscreen-actions">
        <button className="btn secondary" onClick={onClose}>
          {t('common.cancel')}
        </button>
        <button
          className="btn primary"
          onClick={() => {
            onConfirm(text);
            onClose();
          }}
        >
          {t('common.confirm')}
        </button>
      </div>
    </div>
  );
}
