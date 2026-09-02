import { useState } from 'react';
import { useCardStore } from '../store/store';
import { useT } from '../i18n';
import { useRunGuarded } from './genContext';
import FullscreenEditor from './FullscreenEditor';

export default function LorebookEditor() {
  const t = useT();
  const runGuarded = useRunGuarded();
  const card = useCardStore((s) => s.card);
  const addLorebookEntry = useCardStore((s) => s.addLorebookEntry);
  const updateLorebookEntry = useCardStore((s) => s.updateLorebookEntry);
  const removeLorebookEntry = useCardStore((s) => s.removeLorebookEntry);
  const updateBookMeta = useCardStore((s) => s.updateBookMeta);
  const generateLorebookEntry = useCardStore((s) => s.generateLorebookEntry);
  const importLorebook = useCardStore((s) => s.importLorebook);
  const exportLorebook = useCardStore((s) => s.exportLorebook);
  const setError = useCardStore((s) => s.setError);

  const [topic, setTopic] = useState('');
  const [generating, setGenerating] = useState(false);
  const [bookAdvanced, setBookAdvanced] = useState(false);
  const [entryAdvanced, setEntryAdvanced] = useState<Record<number, boolean>>({});
  const [fullscreenIndex, setFullscreenIndex] = useState<number | null>(null);

  if (!card) return null;
  const book = card.data?.character_book ?? {};
  const entries = book.entries ?? [];

  const handleGenerate = () => {
    void runGuarded(async () => {
      setGenerating(true);
      try {
        await generateLorebookEntry(topic);
        setTopic('');
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setGenerating(false);
      }
    });
  };

  const toggleEntryAdvanced = (i: number) => setEntryAdvanced((p) => ({ ...p, [i]: !p[i] }));

  const runIo = async (fn: () => Promise<void>) => {
    try {
      await fn();
    } catch (e) {
      setError((e as Error).message);
    }
  };

  return (
    <section className="panel">
      <div className="section-head">
        <h2>{t('lorebook.title')}</h2>
        <button className="btn" onClick={() => void runIo(importLorebook)}>
          {t('lorebook.import')}
        </button>
        <button className="btn" onClick={() => void runIo(exportLorebook)}>
          {t('lorebook.export')}
        </button>
        <button className="btn" onClick={addLorebookEntry}>
          {t('lorebook.add')}
        </button>
      </div>

      <div className="brief-row">
        <input
          type="text"
          placeholder={t('lorebook.topicPlaceholder')}
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
        />
        <button className="btn primary" disabled={generating} onClick={handleGenerate}>
          {generating ? t('lorebook.generating') : t('lorebook.generate')}
        </button>
      </div>

      <button className="advanced-toggle" onClick={() => setBookAdvanced((o) => !o)}>
        {bookAdvanced ? '▾ ' : '▸ '}
        {t('lorebook.advanced')}
      </button>

      {bookAdvanced && (
        <div style={{ margin: '8px 0' }}>
          <div className="entry-row">
            <label>{t('lorebook.name')}</label>
            <input type="text" value={String(book.name ?? '')} onChange={(e) => updateBookMeta({ name: e.target.value })} />
          </div>
          <div className="entry-row">
            <label>{t('lorebook.description')}</label>
            <input type="text" value={String(book.description ?? '')} onChange={(e) => updateBookMeta({ description: e.target.value })} />
          </div>
          <div className="entry-row">
            <label>{t('lorebook.scanDepth')}</label>
            <input type="number" value={Number(book.scan_depth ?? 4)} onChange={(e) => updateBookMeta({ scan_depth: Number(e.target.value) })} />
          </div>
          <div className="entry-row">
            <label>{t('lorebook.tokenBudget')}</label>
            <input type="number" value={Number(book.token_budget ?? 0)} onChange={(e) => updateBookMeta({ token_budget: Number(e.target.value) })} />
          </div>
          <div className="checkbox-line">
            <label>
              <input
                type="checkbox"
                checked={!!book.recursive_scanning}
                onChange={(e) => updateBookMeta({ recursive_scanning: e.target.checked })}
              />
              {t('lorebook.recursive')}
            </label>
          </div>
        </div>
      )}

      {entries.length === 0 && <p className="hint">{t('lorebook.empty')}</p>}

      {entries.map((entry, i) => {
        const keys = (entry.keys ?? []).join(', ');
        const secondary = (entry.secondary_keys ?? []).join(', ');
        return (
          <div className="entry" key={i}>
            <div className="entry-head">
              <span className="idx">#{i + 1}</span>
              <button className="btn danger" onClick={() => removeLorebookEntry(i)}>
                {t('lorebook.delete')}
              </button>
              <button className="advanced-toggle" onClick={() => toggleEntryAdvanced(i)}>
                {entryAdvanced[i] ? '▾ ' : '▸ '}
                {t('lorebook.advanced')}
              </button>
            </div>

            <div className="entry-row">
              <label>{t('lorebook.keys')}</label>
              <input
                type="text"
                value={keys}
                onChange={(e) => updateLorebookEntry(i, { keys: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) })}
              />
            </div>
            <div className="entry-row">
              <label>{t('lorebook.content')}</label>
              <textarea rows={3} value={String(entry.content ?? '')} onChange={(e) => updateLorebookEntry(i, { content: e.target.value })} />
              <button className="fs-btn" title={t('editor.fullscreen')} onClick={() => setFullscreenIndex(i)}>
                ⛶
              </button>
            </div>
            <div className="entry-row">
              <label>{t('lorebook.comment')}</label>
              <input type="text" value={String(entry.comment ?? '')} onChange={(e) => updateLorebookEntry(i, { comment: e.target.value })} />
            </div>
            <div className="checkbox-line">
              <label>
                <input type="checkbox" checked={entry.enabled !== false} onChange={(e) => updateLorebookEntry(i, { enabled: e.target.checked })} />
                {t('lorebook.enabled')}
              </label>
              <label>
                {t('lorebook.order')}{' '}
                <input
                  type="number"
                  style={{ width: 70 }}
                  value={Number(entry.insertion_order ?? i)}
                  onChange={(e) => updateLorebookEntry(i, { insertion_order: Number(e.target.value) })}
                />
              </label>
            </div>

            {entryAdvanced[i] && (
              <div style={{ marginTop: 6 }}>
                <div className="entry-row">
                  <label>{t('lorebook.secondaryKeys')}</label>
                  <input
                    type="text"
                    value={secondary}
                    onChange={(e) => updateLorebookEntry(i, { secondary_keys: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) })}
                  />
                </div>
                <div className="entry-row">
                  <label>{t('lorebook.position')}</label>
                  <input type="text" value={String(entry.position ?? '')} onChange={(e) => updateLorebookEntry(i, { position: e.target.value })} />
                </div>
                <div className="entry-row">
                  <label>{t('lorebook.priority')}</label>
                  <input type="number" value={Number(entry.priority ?? 0)} onChange={(e) => updateLorebookEntry(i, { priority: Number(e.target.value) })} />
                </div>
                <div className="checkbox-line">
                  <label>
                    <input type="checkbox" checked={!!entry.case_sensitive} onChange={(e) => updateLorebookEntry(i, { case_sensitive: e.target.checked })} />
                    {t('lorebook.caseSensitive')}
                  </label>
                  <label>
                    <input type="checkbox" checked={!!entry.selective} onChange={(e) => updateLorebookEntry(i, { selective: e.target.checked })} />
                    {t('lorebook.selective')}
                  </label>
                  <label>
                    <input type="checkbox" checked={!!entry.constant} onChange={(e) => updateLorebookEntry(i, { constant: e.target.checked })} />
                    {t('lorebook.constant')}
                  </label>
                  <label>
                    <input type="checkbox" checked={!!entry.use_regex} onChange={(e) => updateLorebookEntry(i, { use_regex: e.target.checked })} />
                    {t('lorebook.useRegex')}
                  </label>
                </div>
              </div>
            )}
          </div>
        );
      })}

      {fullscreenIndex !== null && entries[fullscreenIndex] && (
        <FullscreenEditor
          title={t('lorebook.content')}
          value={String(entries[fullscreenIndex].content ?? '')}
          onConfirm={(v) => updateLorebookEntry(fullscreenIndex, { content: v })}
          onClose={() => setFullscreenIndex(null)}
        />
      )}
    </section>
  );
}
