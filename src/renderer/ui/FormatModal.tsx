import { useState } from 'react';
import { useCardStore } from '../store/store';
import { formatDialogue, type FormatStyle } from '../core/format';
import { useT } from '../i18n';
import Modal from './Modal';

const DIALOGUE_FIELDS = [
  { key: 'first_mes', labelKey: 'field.first_mes' },
  { key: 'mes_example', labelKey: 'field.mes_example' },
  { key: 'alternate_greetings', labelKey: 'field.alternate_greetings' },
];

const STYLES: { id: FormatStyle; labelKey: string }[] = [
  { id: 'standard', labelKey: 'format.standard' },
  { id: 'quoted', labelKey: 'format.quoted' },
  { id: 'prefixed', labelKey: 'format.prefixed' },
  { id: 'plain', labelKey: 'format.plain' },
];

export default function FormatModal({ onClose }: { onClose: () => void }) {
  const t = useT();
  const card = useCardStore((s) => s.card);
  const updateField = useCardStore((s) => s.updateField);
  const setError = useCardStore((s) => s.setError);
  const setSuccess = useCardStore((s) => s.setSuccess);

  const [fieldKey, setFieldKey] = useState('first_mes');
  const [style, setStyle] = useState<FormatStyle>('standard');

  const apply = () => {
    const current = card?.data?.[fieldKey];
    if (typeof current !== 'string' || !current.trim()) {
      setError(t('format.empty'));
      return;
    }
    updateField(fieldKey, formatDialogue(current, style));
    setSuccess(t('format.applied'));
    onClose();
  };

  return (
    <Modal title={t('format.title')} onClose={onClose}>
      <div className="settings-form">
        <label>{t('format.field')}</label>
        <select value={fieldKey} onChange={(e) => setFieldKey(e.target.value)}>
          {DIALOGUE_FIELDS.map((f) => (
            <option key={f.key} value={f.key}>
              {t(f.labelKey)}
            </option>
          ))}
        </select>

        <label>{t('format.style')}</label>
        <select value={style} onChange={(e) => setStyle(e.target.value as FormatStyle)}>
          {STYLES.map((s) => (
            <option key={s.id} value={s.id}>
              {t(s.labelKey)}
            </option>
          ))}
        </select>

        <div className="modal-actions" style={{ marginTop: 14 }}>
          <button className="btn secondary" onClick={onClose}>
            {t('common.cancel')}
          </button>
          <button className="btn primary" onClick={apply}>
            {t('format.apply')}
          </button>
        </div>
      </div>
    </Modal>
  );
}
