import { useMemo, useState } from 'react';
import { useCardStore } from '../store/store';
import { useT } from '../i18n';
import { useRunGuarded } from './genContext';
import FullscreenEditor from './FullscreenEditor';
import ArrayTextInput from './ArrayTextInput';

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
  const setEntriesEnabled = useCardStore((s) => s.setEntriesEnabled);
  const removeEntries = useCardStore((s) => s.removeEntries);
  const moveEntry = useCardStore((s) => s.moveEntry);
  const setError = useCardStore((s) => s.setError);

  const [topic, setTopic] = useState('');
  const [generating, setGenerating] = useState(false);
  const [bookAdvanced, setBookAdvanced] = useState(false);
  const [entryAdvanced, setEntryAdvanced] = useState<Record<number, boolean>>({});
  const [fullscreenIndex, setFullscreenIndex] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Set<number>>(new Set());

  if (!card) return null;
  const book = card.data?.character_book ?? {};
  const entries = book.entries ?? [];

  const filter = search.trim().toLowerCase();
  const filtered = useMemo(
    () =>
      entries
        .map((e, i) => ({ e, i }))
        .filter(({ e }) => {
          if (!filter) return true;
          return (
            (e.keys ?? []).some((k) => String(k).toLowerCase().includes(filter)) ||
            (e.secondary_keys ?? []).some((k) => String(k).toLowerCase().includes(filter)) ||
            String(e.content ?? '').toLowerCase().includes(filter) ||
            String(e.comment ?? '').toLowerCase().includes(filter)
          );
        }),
    [entries, filter],
  );

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

  const toggleSelect = (i: number) => {
    setSelected((prev) => {
      const n = new Set(prev);
      if (n.has(i)) n.delete(i);
      else n.add(i);
      return n;
    });
  };

  const selectAll = () => {
    if (filtered.length > 0 && selected.size === filtered.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map(({ i }) => i)));
    }
  };

  const selArr = [...selected];

  const bulk = (kind: 'enable' | 'disable' | 'delete') => {
    if (selArr.length === 0) return;
    if (kind === 'enable') setEntriesEnabled(selArr, true);
    else if (kind === 'disable') setEntriesEnabled(selArr, false);
    else removeEntries(selArr);
    setSelected(new Set());
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

      <div className="entry-row" style={{ marginTop: 6 }}>
        <label>{t('lorebook.search')}</label>
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {filtered.length > 0 && (
        <div className="checkbox-line" style={{ marginTop: 6 }}>
          <label>
            <input type="checkbox" checked={selected.size === filtered.length} onChange={selectAll} />
            {t('lorebook.selectAll')}
          </label>
          {selArr.length > 0 && (
            <>
              <span className="hint">{t('lorebook.selected').replace('{n}', String(selArr.length))}</span>
              <button className="btn" onClick={() => bulk('enable')}>
                {t('lorebook.batchEnable')}
              </button>
              <button className="btn" onClick={() => bulk('disable')}>
                {t('lorebook.batchDisable')}
              </button>
              <button className="btn danger" onClick={() => bulk('delete')}>
                {t('lorebook.batchDelete')}
              </button>
            </>
          )}
        </div>
      )}

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

      {filtered.length === 0 && <p className="hint">{t('lorebook.empty')}</p>}

      {filtered.map(({ e: entry, i }) => {
        return (
          <div className="entry" key={i}>
            <div className="entry-head">
              <input type="checkbox" checked={selected.has(i)} onChange={() => toggleSelect(i)} />
              <span className="idx">#{i + 1}</span>
              <button className="btn" title={t('lorebook.moveUp')} onClick={() => moveEntry(i, -1)}>
                ↑
              </button>
              <button className="btn" title={t('lorebook.moveDown')} onClick={() => moveEntry(i, 1)}>
                ↓
              </button>
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
              <ArrayTextInput values={entry.keys ?? []} delimiter="," onChange={(vals) => updateLorebookEntry(i, { keys: vals })} />
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
                  <ArrayTextInput values={entry.secondary_keys ?? []} delimiter="," onChange={(vals) => updateLorebookEntry(i, { secondary_keys: vals })} />
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
