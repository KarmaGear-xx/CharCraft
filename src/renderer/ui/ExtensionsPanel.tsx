import { useCardStore } from '../store/store';
import { useT } from '../i18n';

export default function ExtensionsPanel() {
  const t = useT();
  const card = useCardStore((s) => s.card);
  const setExtension = useCardStore((s) => s.setExtension);
  if (!card) return null;

  const ext = card.data?.extensions ?? {};
  const dp = (typeof ext.depth_prompt === 'object' && ext.depth_prompt ? ext.depth_prompt : {}) as {
    depth?: number;
    prompt?: string;
    role?: string;
  };
  const talk = typeof ext.talkativeness === 'number' ? ext.talkativeness : '';
  const fav = ext.fav === true;

  return (
    <section className="panel">
      <div className="section-head">
        <h2>{t('ext.title')}</h2>
      </div>

      <div className="entry-row">
        <label>{t('ext.depthPrompt')}</label>
        <input
          type="text"
          value={String(dp.prompt ?? '')}
          onChange={(e) => setExtension('depth_prompt', { ...dp, prompt: e.target.value })}
        />
      </div>
      <div className="entry-row">
        <label>{t('ext.depth')}</label>
        <input
          type="number"
          value={Number(dp.depth ?? 4)}
          onChange={(e) => setExtension('depth_prompt', { ...dp, depth: Number(e.target.value) })}
        />
      </div>
      <div className="entry-row">
        <label>{t('ext.role')}</label>
        <input
          type="text"
          value={String(dp.role ?? '')}
          onChange={(e) => setExtension('depth_prompt', { ...dp, role: e.target.value })}
        />
      </div>

      <div className="entry-row">
        <label>{t('ext.talkativeness')}</label>
        <input
          type="number"
          step="0.1"
          min="0"
          max="1"
          value={talk}
          onChange={(e) => setExtension('talkativeness', Number(e.target.value))}
        />
      </div>

      <div className="checkbox-line">
        <label>
          <input type="checkbox" checked={fav} onChange={(e) => setExtension('fav', e.target.checked)} />
          {t('ext.fav')}
        </label>
      </div>
    </section>
  );
}
