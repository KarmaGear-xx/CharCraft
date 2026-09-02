import { useState } from 'react';
import { useCardStore } from '../store/store';
import { ALL_FIELDS } from '../core/fields';
import { useT } from '../i18n';
import Modal from './Modal';

const TEXTAREA_FIELDS = ALL_FIELDS.filter((f) => f.kind === 'textarea');

export default function SnippetModal({ onClose }: { onClose: () => void }) {
  const t = useT();
  const snippets = useCardStore((s) => s.snippets);
  const addSnippet = useCardStore((s) => s.addSnippet);
  const removeSnippet = useCardStore((s) => s.removeSnippet);
  const insertSnippet = useCardStore((s) => s.insertSnippet);
  const setSuccess = useCardStore((s) => s.setSuccess);

  const [name, setName] = useState('');
  const [text, setText] = useState('');
  const [fieldKey, setFieldKey] = useState('description');

  const create = () => {
    if (!text.trim()) return;
    addSnippet(name, text);
    setName('');
    setText('');
    setSuccess(t('snippet.saved'));
  };

  const insert = (snippetText: string) => {
    insertSnippet(snippetText, fieldKey);
    setSuccess(t('snippet.inserted'));
    onClose();
  };

  return (
    <Modal title={t('snippet.title')} onClose={onClose}>
      <div className="settings-form" style={{ marginBottom: 10 }}>
        <label>{t('snippet.name')}</label>
        <input type="text" value={name} onChange={(e) => setName(e.target.value)} />
        <label>{t('snippet.text')}</label>
        <textarea rows={3} value={text} onChange={(e) => setText(e.target.value)} />
        <button className="btn primary" style={{ marginTop: 8 }} onClick={create}>
          {t('snippet.add')}
        </button>
      </div>

      <label>{t('snippet.insertField')}</label>
      <select value={fieldKey} onChange={(e) => setFieldKey(e.target.value)}>
        {TEXTAREA_FIELDS.map((f) => (
          <option key={f.key} value={f.key}>
            {t(f.labelKey)}
          </option>
        ))}
      </select>

      {snippets.length === 0 && <p className="hint">{t('snippet.empty')}</p>}
      <div className="recipe-list">
        {snippets.map((s) => (
          <div className="recipe-item" key={s.id}>
            <div className="recipe-info">
              <span className="recipe-name">{s.name}</span>
              <span className="hint">{s.text.slice(0, 40)}</span>
            </div>
            <div className="recipe-actions">
              <button className="btn primary" onClick={() => insert(s.text)}>
                {t('snippet.insert')}
              </button>
              <button className="btn danger" onClick={() => removeSnippet(s.id)}>
                {t('snippet.delete')}
              </button>
            </div>
          </div>
        ))}
      </div>
    </Modal>
  );
}
