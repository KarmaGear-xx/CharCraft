import { useState } from 'react';
import type { OverwriteMode } from '../store/store';
import { WHOLE_CARD_FIELDS } from '../core/ai';
import { useT } from '../i18n';
import Modal from './Modal';

interface Props {
  onClose: () => void;
  onConfirm: (mode: OverwriteMode, targets: string[]) => void;
}

export default function OverwriteModal({ onClose, onConfirm }: Props) {
  const t = useT();
  const [mode, setMode] = useState<'choose' | 'manual'>('choose');
  const [targets, setTargets] = useState<Set<string>>(() => new Set<string>(WHOLE_CARD_FIELDS));

  const toggle = (key: string) => {
    const next = new Set(targets);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    setTargets(next);
  };

  return (
    <Modal title={t('overwrite.title')} onClose={onClose}>
      {mode === 'choose' ? (
        <>
          <p className="modal-text">{t('overwrite.message')}</p>
          <div className="modal-actions" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
            <button className="btn primary" onClick={() => onConfirm('clear', [])}>
              {t('overwrite.clear')}
            </button>
            <p className="hint">{t('overwrite.clearHint')}</p>
            <button className="btn" onClick={() => onConfirm('fill_empty', [])}>
              {t('overwrite.fillEmpty')}
            </button>
            <button className="btn" onClick={() => setMode('manual')}>
              {t('overwrite.manual')}
            </button>
            <button className="btn secondary" onClick={onClose}>
              {t('overwrite.cancel')}
            </button>
          </div>
        </>
      ) : (
        <>
          <p className="modal-text">{t('overwrite.manualHint')}</p>
          <div className="target-list">
            {WHOLE_CARD_FIELDS.map((key) => (
              <label key={key}>
                <input type="checkbox" checked={targets.has(key)} onChange={() => toggle(key)} />
                {t('field.' + key)}
              </label>
            ))}
          </div>
          <div className="modal-actions">
            <button className="btn secondary" onClick={() => setMode('choose')}>
              {t('common.cancel')}
            </button>
            <button className="btn primary" onClick={() => onConfirm('manual', Array.from(targets))}>
              {t('overwrite.proceed')}
            </button>
          </div>
        </>
      )}
    </Modal>
  );
}
