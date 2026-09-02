import { useCardStore } from '../store/store';
import { DESCRIPTION_SUB_FIELDS } from '../core/fields';
import { useT } from '../i18n';

export default function DescriptionSubFields() {
  const t = useT();
  const subFields = useCardStore((s) => s.subFields);
  const setSubField = useCardStore((s) => s.setSubField);

  return (
    <div className="subfields-section">
      <div className="subfields-head">
        <span className="subfields-title">{t('subfield.title')}</span>
        <span className="hint">{t('subfield.hint')}</span>
      </div>
      <div className="subfields">
        {DESCRIPTION_SUB_FIELDS.map((f) => (
          <label className="subfield" key={f.key}>
            <span>{t(f.labelKey)}</span>
            <input
              type="text"
              value={subFields[f.key] ?? ''}
              onChange={(e) => setSubField(f.key, e.target.value)}
            />
          </label>
        ))}
      </div>
    </div>
  );
}
