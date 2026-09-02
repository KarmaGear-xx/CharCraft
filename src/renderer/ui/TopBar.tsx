import { useState } from 'react';
import { useCardStore } from '../store/store';
import { countCardTokens } from '../core/token';
import { useT } from '../i18n';
import FindReplaceModal from './FindReplaceModal';
import RecipeModal from './RecipeModal';
import SnippetModal from './SnippetModal';
import SnapshotsModal from './SnapshotsModal';

interface Props {
  onOpenSettings: () => void;
}

export default function TopBar({ onOpenSettings }: Props) {
  const t = useT();
  const lang = useCardStore((s) => s.lang);
  const setLang = useCardStore((s) => s.setLang);
  const card = useCardStore((s) => s.card);
  const tokenBudget = useCardStore((s) => s.tokenBudget);
  const theme = useCardStore((s) => s.theme);
  const setTheme = useCardStore((s) => s.setTheme);
  const newCard = useCardStore((s) => s.newCard);
  const importCard = useCardStore((s) => s.importCard);
  const exportJson = useCardStore((s) => s.exportJson);
  const exportPng = useCardStore((s) => s.exportPng);
  const genderSwap = useCardStore((s) => s.genderSwap);
  const sourceName = useCardStore((s) => s.sourceName);
  const setError = useCardStore((s) => s.setError);
  const setSuccess = useCardStore((s) => s.setSuccess);

  const [findOpen, setFindOpen] = useState(false);
  const [recipeOpen, setRecipeOpen] = useState(false);
  const [snippetOpen, setSnippetOpen] = useState(false);
  const [snapOpen, setSnapOpen] = useState(false);

  const total = card ? countCardTokens(card) : 0;
  const over = total > tokenBudget;

  const run = async (fn: () => Promise<void>) => {
    try {
      await fn();
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const doGenderSwap = () => {
    if (!card) return;
    genderSwap();
    setSuccess(t('nav.genderSwapped'));
  };

  return (
    <header className="topbar">
      <div className="topbar-row">
        <span className="topbar-title">{t('app.title')}</span>
        {sourceName && <span className="fname">{sourceName}</span>}
        <span className={'token-indicator' + (over ? ' over' : '')} title={t('token.total')}>
          {total} / {tokenBudget}
        </span>
        <div className="lang-toggle">
          <button className={lang === 'zh' ? 'active' : ''} onClick={() => setLang('zh')}>
            中
          </button>
          <button className={lang === 'en' ? 'active' : ''} onClick={() => setLang('en')}>
            EN
          </button>
        </div>
        <button className="btn" title={t('theme.toggle')} onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
      </div>

      <div className="toolbar">
        <button className="btn" title={t('findreplace.title')} onClick={() => setFindOpen(true)}>
          🔍 {t('tool.find')}
        </button>
        <button className="btn" title={t('recipe.title')} onClick={() => setRecipeOpen(true)}>
          🧪 {t('tool.recipe')}
        </button>
        <button className="btn" title={t('snippet.title')} onClick={() => setSnippetOpen(true)}>
          📝 {t('tool.snippet')}
        </button>
        <button className="btn" title={t('nav.gender')} disabled={!card} onClick={doGenderSwap}>
          ⇄ {t('tool.gender')}
        </button>
        <button className="btn" title={t('snapshots.title')} disabled={!card} onClick={() => setSnapOpen(true)}>
          📋 {t('tool.snapshots')}
        </button>
        <button className="btn" title={t('nav.new')} onClick={newCard}>
          ➕ {t('tool.new')}
        </button>
        <button className="btn" title={t('nav.import')} onClick={() => void run(importCard)}>
          📂 {t('tool.import')}
        </button>
        <button className="btn" title={t('nav.settings')} onClick={onOpenSettings}>
          ⚙️ {t('tool.settings')}
        </button>
        <button className="btn" title={t('nav.exportJson')} disabled={!card} onClick={() => void run(exportJson)}>
          ⬇️ {t('tool.json')}
        </button>
        <button className="btn primary" title={t('nav.exportPng')} disabled={!card} onClick={() => void run(exportPng)}>
          🖼️ {t('tool.png')}
        </button>
      </div>

      {findOpen && <FindReplaceModal onClose={() => setFindOpen(false)} />}
      {recipeOpen && <RecipeModal onClose={() => setRecipeOpen(false)} />}
      {snippetOpen && <SnippetModal onClose={() => setSnippetOpen(false)} />}
      {snapOpen && <SnapshotsModal onClose={() => setSnapOpen(false)} />}
    </header>
  );
}
