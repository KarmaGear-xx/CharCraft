import { useState } from 'react';
import { useCardStore } from '../store/store';
import { useT } from '../i18n';
import Modal from './Modal';

export default function FindReplaceModal({ onClose }: { onClose: () => void }) {
  const t = useT();
  const findReplace = useCardStore((s) => s.findReplace);
  const setSuccess = useCardStore((s) => s.setSuccess);
  const [find, setFind] = useState('');
  const [replace, setReplace] = useState('');

  const apply = () => {
    if (!find) return;
    findReplace(find, replace);
    setSuccess(t('findreplace.applied'));
    onClose();
  };

  return (
    <Modal title={t('findreplace.title')} onClose={onClose}>
      <div className="settings-form">
        <label>{t('findreplace.find')}</label>
        <input type="text" value={find} onChange={(e) => setFind(e.target.value)} />
        <label>{t('findreplace.replace')}</label>
        <input type="text" value={replace} onChange={(e) => setReplace(e.target.value)} />
        <div className="modal-actions" style={{ marginTop: 14 }}>
          <button className="btn secondary" onClick={onClose}>
            {t('common.cancel')}
          </button>
          <button className="btn primary" disabled={!find} onClick={apply}>
            {t('findreplace.apply')}
          </button>
        </div>
      </div>
    </Modal>
  );
}
