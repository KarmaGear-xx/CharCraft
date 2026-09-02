import { useState } from 'react';
import { useCardStore, AI_PRESETS } from '../store/store';
import { useT } from '../i18n';
import Modal from './Modal';

export default function ModelSettingsModal({ onClose }: { onClose: () => void }) {
  const t = useT();
  const aiSettings = useCardStore((s) => s.aiSettings);
  const setAISettings = useCardStore((s) => s.setAISettings);
  const setSuccess = useCardStore((s) => s.setSuccess);
  const setError = useCardStore((s) => s.setError);
  const tokenBudget = useCardStore((s) => s.tokenBudget);
  const setTokenBudget = useCardStore((s) => s.setTokenBudget);

  const [baseUrl, setBaseUrl] = useState(aiSettings.baseUrl);
  const [apiKey, setApiKey] = useState(aiSettings.apiKey);
  const [model, setModel] = useState(aiSettings.model);
  const [budget, setBudget] = useState(tokenBudget);
  const [fetchModels, setFetchModels] = useState(false);
  const [models, setModels] = useState<string[]>([]);
  const [fetching, setFetching] = useState(false);
  const [preset, setPreset] = useState(() => {
    const p = AI_PRESETS.find((p) => p.baseUrl === aiSettings.baseUrl);
    return p ? p.id : 'custom';
  });

  const applyPreset = (id: string) => {
    const p = AI_PRESETS.find((p) => p.id === id);
    if (!p) return;
    setPreset(p.id);
    setBaseUrl(p.baseUrl);
    setModel(p.model);
  };

  const fetchModelList = async () => {
    setFetching(true);
    setModels([]);
    try {
      const list = await window.api.listModels({
        baseUrl: baseUrl.trim(),
        apiKey: apiKey.trim(),
        model: model.trim(),
      });
      setModels(list);
      setSuccess(t('settings.modelsFetched'));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setFetching(false);
    }
  };

  const save = async () => {
    try {
      await setAISettings({ baseUrl: baseUrl.trim(), apiKey: apiKey.trim(), model: model.trim() });
      setTokenBudget(Number(budget) || 4096);
      setSuccess(t('settings.saved'));
      onClose();
    } catch (e) {
      setError(t('settings.saveFailed') + ': ' + (e as Error).message);
    }
  };

  return (
    <Modal title={t('settings.title')} onClose={onClose}>
      <div className="settings-form">
        <label>{t('settings.preset')}</label>
        <select value={preset} onChange={(e) => applyPreset(e.target.value)}>
          {AI_PRESETS.map((p) => (
            <option key={p.id} value={p.id}>
              {p.label}
            </option>
          ))}
        </select>

        <label>{t('settings.baseUrl')}</label>
        <input
          type="text"
          value={baseUrl}
          onChange={(e) => {
            setBaseUrl(e.target.value);
            setPreset('custom');
          }}
        />

        <label>{t('settings.apiKey')}</label>
        <input type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)} />

        <label>{t('settings.model')}</label>
        <input
          type="text"
          value={model}
          onChange={(e) => {
            setModel(e.target.value);
            setPreset('custom');
          }}
        />

        <div className="checkbox-line" style={{ marginTop: 6 }}>
          <label>
            <input type="checkbox" checked={fetchModels} onChange={(e) => setFetchModels(e.target.checked)} />
            {t('settings.fetchModels')}
          </label>
        </div>

        {fetchModels && (
          <button className="btn" disabled={fetching} onClick={() => void fetchModelList()}>
            {fetching ? t('settings.fetching') : t('settings.fetchModelsBtn')}
          </button>
        )}

        {models.length > 0 && (
          <>
            <label>{t('settings.selectModel')}</label>
            <select value={model} onChange={(e) => setModel(e.target.value)}>
              {!models.includes(model) && <option value={model}>{model}</option>}
              {models.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </>
        )}

        <label>{t('settings.tokenBudget')}</label>
        <input type="number" value={budget} onChange={(e) => setBudget(Number(e.target.value))} />

        <p className="hint">{t('settings.keyHint')}</p>

        <div className="modal-actions" style={{ marginTop: 14 }}>
          <button className="btn secondary" onClick={onClose}>
            {t('settings.cancel')}
          </button>
          <button className="btn primary" onClick={() => void save()}>
            {t('settings.save')}
          </button>
        </div>
      </div>
    </Modal>
  );
}
