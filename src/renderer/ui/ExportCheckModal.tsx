import { useCardStore } from '../store/store';
import { useT } from '../i18n';
import Modal from './Modal';

const LEVEL_ICON = { error: '❗', warning: '⚠️', info: 'ℹ️' } as const;
const LEVEL_KEY = {
  error: 'validate.levelError',
  warning: 'validate.levelWarning',
  info: 'validate.levelInfo',
} as const;

function renderMessage(key: string, args: Record<string, string | number> | undefined, t: (k: string) => string): string {
  let msg = t(key);
  if (args) for (const [k, v] of Object.entries(args)) msg = msg.replace(`{${k}}`, String(v));
  return msg;
}

export default function ExportCheckModal() {
  const t = useT();
  const pendingExport = useCardStore((s) => s.pendingExport);
  const confirmExport = useCardStore((s) => s.confirmExport);
  const cancelExport = useCardStore((s) => s.cancelExport);
  const setError = useCardStore((s) => s.setError);

  if (!pendingExport) return null;

  const proceed = async () => {
    try {
      await confirmExport();
    } catch (e) {
      setError((e as Error).message);
    }
  };

  return (
    <Modal title={t('validate.title')} onClose={cancelExport}>
      <ul className="validate-list">
        {pendingExport.issues.map((issue, i) => (
          <li key={i} className={'validate-' + issue.level}>
            <span className="validate-icon">{LEVEL_ICON[issue.level]}</span>
            <span className={'validate-tag ' + issue.level}>{t(LEVEL_KEY[issue.level])}</span>
            <span>{renderMessage(issue.key, issue.args, t)}</span>
          </li>
        ))}
      </ul>
      <div className="modal-actions">
        <button className="btn secondary" onClick={cancelExport}>
          {t('validate.cancel')}
        </button>
        <button className="btn primary" onClick={() => void proceed()}>
          {t('validate.continue')}
        </button>
      </div>
    </Modal>
  );
}
