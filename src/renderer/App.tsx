import { useEffect, useRef, useState } from 'react';
import { useCardStore } from './store/store';
import { GenContext, type GuardedRunner } from './ui/genContext';
import TopBar from './ui/TopBar';
import CardEditor from './ui/CardEditor';
import LorebookEditor from './ui/LorebookEditor';
import AvatarSection from './ui/AvatarSection';
import ExtensionsPanel from './ui/ExtensionsPanel';
import ModelSettingsModal from './ui/ModelSettingsModal';
import Modal from './ui/Modal';
import Toast from './ui/Toast';
import { useT } from './i18n';

export default function App() {
  const t = useT();
  const hydrate = useCardStore((s) => s.hydrate);
  const card = useCardStore((s) => s.card);
  const costShown = useCardStore((s) => s.costReminderShown);
  const markCostReminderShown = useCardStore((s) => s.markCostReminderShown);
  const setError = useCardStore((s) => s.setError);
  const theme = useCardStore((s) => s.theme);

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [costOpen, setCostOpen] = useState(false);
  const [tab, setTab] = useState<'card' | 'lorebook'>('card');
  const pendingRef = useRef<(() => Promise<void>) | undefined>(undefined);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const runGuarded: GuardedRunner = async (fn) => {
    if (costShown) {
      try {
        await fn();
      } catch (e) {
        setError((e as Error).message);
      }
      return;
    }
    pendingRef.current = fn;
    setCostOpen(true);
  };

  const confirmCost = async () => {
    markCostReminderShown();
    setCostOpen(false);
    const fn = pendingRef.current;
    pendingRef.current = undefined;
    if (fn) {
      try {
        await fn();
      } catch (e) {
        setError((e as Error).message);
      }
    }
  };

  const cancelCost = () => {
    setCostOpen(false);
    pendingRef.current = undefined;
  };

  return (
    <GenContext.Provider value={runGuarded}>
      <div className="app">
        <TopBar onOpenSettings={() => setSettingsOpen(true)} />
        <main className="main">
          {card ? (
            <>
              <div className="tabs">
                <button className={'tab' + (tab === 'card' ? ' active' : '')} onClick={() => setTab('card')}>
                  {t('tab.card')}
                </button>
                <button className={'tab' + (tab === 'lorebook' ? ' active' : '')} onClick={() => setTab('lorebook')}>
                  {t('tab.lorebook')}
                </button>
              </div>
              {tab === 'card' ? (
                <div className="col">
                  <CardEditor />
                  <AvatarSection />
                  <ExtensionsPanel />
                </div>
              ) : (
                <LorebookEditor />
              )}
            </>
          ) : (
            <div className="empty-hint">
              <strong>{t('nav.noCard')}</strong>
              <p>{t('nav.importHint')}</p>
            </div>
          )}
        </main>

        {settingsOpen && <ModelSettingsModal onClose={() => setSettingsOpen(false)} />}
        {costOpen && (
          <Modal title={t('cost.title')} onClose={cancelCost}>
            <p className="modal-text">{t('cost.message')}</p>
            <div className="modal-actions">
              <button className="btn secondary" onClick={cancelCost}>
                {t('cost.cancel')}
              </button>
              <button className="btn primary" onClick={confirmCost}>
                {t('cost.confirm')}
              </button>
            </div>
          </Modal>
        )}
        <Toast />
      </div>
    </GenContext.Provider>
  );
}
