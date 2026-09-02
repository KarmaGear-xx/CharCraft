import { useCardStore } from '../store/store';
import { useT } from '../i18n';
import Modal from './Modal';

export default function SnapshotsModal({ onClose }: { onClose: () => void }) {
  const t = useT();
  const snapshots = useCardStore((s) => s.snapshots);
  const saveSnapshot = useCardStore((s) => s.saveSnapshot);
  const restoreSnapshot = useCardStore((s) => s.restoreSnapshot);
  const deleteSnapshot = useCardStore((s) => s.deleteSnapshot);
  const setSuccess = useCardStore((s) => s.setSuccess);

  const save = () => {
    saveSnapshot();
    setSuccess(t('snapshots.saved'));
  };

  const restore = (i: number) => {
    restoreSnapshot(i);
    setSuccess(t('snapshots.restored'));
    onClose();
  };

  return (
    <Modal title={t('snapshots.title')} onClose={onClose}>
      <div className="modal-actions" style={{ marginBottom: 10 }}>
        <button className="btn primary" onClick={save}>
          {t('snapshots.save')}
        </button>
      </div>

      {snapshots.length === 0 && <p className="hint">{t('snapshots.empty')}</p>}

      <div className="recipe-list">
        {snapshots.map((s, idx) => (
          <div className="recipe-item" key={s.timestamp + '-' + idx}>
            <div className="recipe-info">
              <span className="recipe-name">{new Date(s.timestamp).toLocaleString()}</span>
              <span className="hint">{String(s.card.data?.name ?? '')}</span>
            </div>
            <div className="recipe-actions">
              <button className="btn primary" onClick={() => restore(idx)}>
                {t('snapshots.restore')}
              </button>
              <button className="btn danger" onClick={() => deleteSnapshot(idx)}>
                {t('snapshots.delete')}
              </button>
            </div>
          </div>
        ))}
      </div>
    </Modal>
  );
}
