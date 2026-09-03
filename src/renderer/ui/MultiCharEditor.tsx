import { useState } from 'react';
import { useCardStore } from '../store/store';
import { useT } from '../i18n';
import { useRunGuarded } from './genContext';

export default function MultiCharEditor() {
  const t = useT();
  const runGuarded = useRunGuarded();
  const characters = useCardStore((s) => s.characters);
  const group = useCardStore((s) => s.group);
  const setGroup = useCardStore((s) => s.setGroup);
  const addCharacter = useCardStore((s) => s.addCharacter);
  const updateCharacter = useCardStore((s) => s.updateCharacter);
  const removeCharacter = useCardStore((s) => s.removeCharacter);
  const moveCharacter = useCardStore((s) => s.moveCharacter);
  const generateCharacterFromBrief = useCardStore((s) => s.generateCharacterFromBrief);
  const rewriteCharacter = useCardStore((s) => s.rewriteCharacter);
  const generateGroupFromBrief = useCardStore((s) => s.generateGroupFromBrief);
  const setError = useCardStore((s) => s.setError);

  const [charBrief, setCharBrief] = useState('');
  const [groupBrief, setGroupBrief] = useState('');
  const [busy, setBusy] = useState<string | null>(null);

  const guarded = (fn: () => Promise<void>) =>
    runGuarded(async () => {
      try {
        await fn();
      } catch (e) {
        setError((e as Error).message);
      }
    });

  return (
    <section className="panel">
      <div className="section-head">
        <h2>{t('multi.title')}</h2>
        <button className="btn" onClick={addCharacter}>
          {t('multi.add')}
        </button>
      </div>

      <p className="hint">{t('multi.composeHint')}</p>

      <div className="entry-row">
        <label>{t('multi.groupName')}</label>
        <input type="text" value={group.name} onChange={(e) => setGroup({ name: e.target.value })} />
      </div>
      <div className="entry-row">
        <label>{t('multi.groupScenario')}</label>
        <textarea rows={3} value={group.scenario} onChange={(e) => setGroup({ scenario: e.target.value })} />
      </div>
      <div className="entry-row">
        <label>{t('multi.groupFirstMes')}</label>
        <textarea rows={3} value={group.firstMes} onChange={(e) => setGroup({ firstMes: e.target.value })} />
      </div>

      <div className="brief-row" style={{ marginTop: 8 }}>
        <input
          type="text"
          placeholder={t('multi.generateGroupPlaceholder')}
          value={groupBrief}
          onChange={(e) => setGroupBrief(e.target.value)}
        />
        <button
          className="btn primary"
          disabled={busy !== null}
          onClick={() =>
            guarded(async () => {
              setBusy('group');
              await generateGroupFromBrief(groupBrief);
              setGroupBrief('');
              setBusy(null);
            })
          }
        >
          {busy === 'group' ? t('editor.generating') : t('multi.generateGroup')}
        </button>
      </div>

      {characters.length === 0 && <p className="hint">{t('multi.empty')}</p>}

      {characters.map((c, i) => (
        <div className="entry" key={c.id}>
          <div className="entry-head">
            <span className="idx">#{i + 1}</span>
            <button className="btn" title={t('multi.moveUp')} onClick={() => moveCharacter(c.id, -1)}>
              ↑
            </button>
            <button className="btn" title={t('multi.moveDown')} onClick={() => moveCharacter(c.id, 1)}>
              ↓
            </button>
            <button
              className="btn"
              disabled={busy === c.id}
              onClick={() =>
                guarded(async () => {
                  setBusy(c.id);
                  await rewriteCharacter(c.id);
                  setBusy(null);
                })
              }
            >
              {busy === c.id ? t('editor.generating') : '✨ ' + t('multi.rewrite')}
            </button>
            <button className="btn danger" onClick={() => removeCharacter(c.id)}>
              {t('multi.remove')}
            </button>
          </div>
          <div className="entry-row">
            <label>{t('multi.name')}</label>
            <input type="text" value={c.name} onChange={(e) => updateCharacter(c.id, { name: e.target.value })} />
          </div>
          <div className="entry-row">
            <label>{t('multi.description')}</label>
            <textarea rows={3} value={c.description} onChange={(e) => updateCharacter(c.id, { description: e.target.value })} />
          </div>
          <div className="entry-row">
            <label>{t('multi.personality')}</label>
            <textarea rows={2} value={c.personality} onChange={(e) => updateCharacter(c.id, { personality: e.target.value })} />
          </div>
          <div className="entry-row">
            <label>{t('multi.intro')}</label>
            <input type="text" value={c.intro} onChange={(e) => updateCharacter(c.id, { intro: e.target.value })} />
          </div>
        </div>
      ))}

      <div className="brief-row" style={{ marginTop: 8 }}>
        <input
          type="text"
          placeholder={t('multi.generateCharacterPlaceholder')}
          value={charBrief}
          onChange={(e) => setCharBrief(e.target.value)}
        />
        <button
          className="btn"
          disabled={busy !== null}
          onClick={() =>
            guarded(async () => {
              setBusy('char');
              await generateCharacterFromBrief(charBrief);
              setCharBrief('');
              setBusy(null);
            })
          }
        >
          {busy === 'char' ? t('editor.generating') : t('multi.generateCharacter')}
        </button>
      </div>
    </section>
  );
}
