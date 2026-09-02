import { useState } from 'react';
import { useCardStore } from '../store/store';
import { BUILTIN_RECIPES } from '../core/recipes';
import { ALL_FIELDS } from '../core/fields';
import { useT } from '../i18n';
import { useRunGuarded } from './genContext';
import Modal from './Modal';
import type { Recipe } from '../../shared/types';

const TEXTAREA_FIELDS = ALL_FIELDS.filter((f) => f.kind === 'textarea');

export default function RecipeModal({ onClose }: { onClose: () => void }) {
  const t = useT();
  const runGuarded = useRunGuarded();
  const customRecipes = useCardStore((s) => s.customRecipes);
  const addCustomRecipe = useCardStore((s) => s.addCustomRecipe);
  const removeCustomRecipe = useCardStore((s) => s.removeCustomRecipe);
  const applyRecipe = useCardStore((s) => s.applyRecipe);
  const setError = useCardStore((s) => s.setError);
  const setSuccess = useCardStore((s) => s.setSuccess);

  const [applying, setApplying] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState('');
  const [field, setField] = useState('personality');
  const [prompt, setPrompt] = useState('');

  const all = [...BUILTIN_RECIPES, ...customRecipes];

  const apply = (recipe: Recipe) => {
    void runGuarded(async () => {
      setApplying(recipe.id);
      try {
        await applyRecipe(recipe);
        setSuccess(t('recipe.applied'));
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setApplying(null);
      }
    });
  };

  const create = () => {
    if (!name.trim() || !prompt.trim()) return;
    addCustomRecipe({ id: '', name: name.trim(), field, prompt: prompt.trim(), builtin: false });
    setName('');
    setPrompt('');
    setShowCreate(false);
    setSuccess(t('recipe.saved'));
  };

  return (
    <Modal title={t('recipe.title')} onClose={onClose}>
      <div className="modal-actions" style={{ marginBottom: 10 }}>
        <button className="btn" onClick={() => setShowCreate((v) => !v)}>
          {t('recipe.new')}
        </button>
      </div>

      {showCreate && (
        <div className="settings-form" style={{ borderTop: '1px solid var(--border)', paddingTop: 10, marginBottom: 10 }}>
          <label>{t('recipe.name')}</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} />
          <label>{t('recipe.field')}</label>
          <select value={field} onChange={(e) => setField(e.target.value)}>
            {TEXTAREA_FIELDS.map((f) => (
              <option key={f.key} value={f.key}>
                {t(f.labelKey)}
              </option>
            ))}
          </select>
          <label>{t('recipe.prompt')}</label>
          <textarea rows={2} value={prompt} onChange={(e) => setPrompt(e.target.value)} />
          <button className="btn primary" style={{ marginTop: 8 }} onClick={create}>
            {t('recipe.add')}
          </button>
        </div>
      )}

      <div className="recipe-list">
        {all.map((r) => (
          <div className="recipe-item" key={r.id}>
            <div className="recipe-info">
              <span className="recipe-name">{r.name}</span>
              <span className="hint">
                {r.builtin ? t('recipe.builtin') : t('recipe.custom')} · {t('field.' + r.field)}
              </span>
            </div>
            <div className="recipe-actions">
              <button className="btn primary" disabled={applying === r.id} onClick={() => apply(r)}>
                {applying === r.id ? t('editor.generating') : t('recipe.apply')}
              </button>
              {!r.builtin && (
                <button className="btn danger" onClick={() => removeCustomRecipe(r.id)}>
                  {t('recipe.delete')}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </Modal>
  );
}
