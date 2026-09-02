import { useMemo, useState } from 'react';
import { useCardStore, type OverwriteMode } from '../store/store';
import { CORE_FIELDS, ADVANCED_FIELDS } from '../core/fields';
import { WHOLE_CARD_FIELDS } from '../core/ai';
import { useT } from '../i18n';
import { useRunGuarded } from './genContext';
import FieldEditor from './FieldEditor';
import OverwriteModal from './OverwriteModal';
import FormatModal from './FormatModal';
import DescriptionSubFields from './DescriptionSubFields';
import FullscreenEditor from './FullscreenEditor';

export default function CardEditor() {
  const t = useT();
  const runGuarded = useRunGuarded();
  const card = useCardStore((s) => s.card);
  const enabled = useCardStore((s) => s.enabled);
  const brief = useCardStore((s) => s.brief);
  const setBrief = useCardStore((s) => s.setBrief);
  const updateField = useCardStore((s) => s.updateField);
  const setEnabled = useCardStore((s) => s.setEnabled);
  const generateWholeCard = useCardStore((s) => s.generateWholeCard);
  const generateField = useCardStore((s) => s.generateField);
  const setError = useCardStore((s) => s.setError);

  const [generating, setGenerating] = useState(false);
  const [generatingField, setGeneratingField] = useState<string | null>(null);
  const [overwriteOpen, setOverwriteOpen] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [formatOpen, setFormatOpen] = useState(false);
  const [briefFullscreen, setBriefFullscreen] = useState(false);

  const hasContent = useMemo(() => {
    if (!card) return false;
    const d = card.data ?? {};
    return WHOLE_CARD_FIELDS.some((f) => {
      const v = d[f];
      return typeof v === 'string' ? v.trim().length > 0 : Array.isArray(v) && v.length > 0;
    });
  }, [card]);

  if (!card) return null;

  const doGenerate = async (mode: OverwriteMode, targets: string[]) => {
    setGenerating(true);
    try {
      await generateWholeCard(brief, mode, targets);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setGenerating(false);
    }
  };

  const startGenerate = () => {
    void runGuarded(async () => {
      if (hasContent) {
        setOverwriteOpen(true);
        return;
      }
      await doGenerate('fill_empty', []);
    });
  };

  const handleFieldAi = (key: string) => {
    void runGuarded(async () => {
      setGeneratingField(key);
      try {
        await generateField(key);
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setGeneratingField(null);
      }
    });
  };

  const data = card.data ?? {};

  return (
    <section className="panel">
      <div className="section-head">
        <h2>{t('editor.title')}</h2>
        <button className="btn" onClick={() => setFormatOpen(true)}>
          {t('format.title')}
        </button>
      </div>

      <div className="brief-row">
        <input
          type="text"
          placeholder={t('editor.briefPlaceholder')}
          value={brief}
          onChange={(e) => setBrief(e.target.value)}
        />
        <button className="fs-btn" title={t('editor.fullscreen')} onClick={() => setBriefFullscreen(true)}>
          ⛶
        </button>
        <button className="btn primary" disabled={generating} onClick={startGenerate}>
          {generating ? t('editor.generating') : t('editor.generate')}
        </button>
      </div>

      <DescriptionSubFields />

      {CORE_FIELDS.map((f) => (
        <FieldEditor
          key={f.key}
          field={f}
          value={data[f.key]}
          enabled={enabled[f.key] !== false}
          locked={f.key === 'name'}
          generating={generatingField === f.key}
          onChange={(v) => updateField(f.key, v)}
          onToggle={(c) => setEnabled(f.key, c)}
          onAi={() => handleFieldAi(f.key)}
        />
      ))}

      <button className="advanced-toggle" onClick={() => setAdvancedOpen((o) => !o)}>
        {advancedOpen ? '▾ ' : '▸ '}
        {t('editor.advanced')}
      </button>

      {advancedOpen &&
        ADVANCED_FIELDS.map((f) => (
          <FieldEditor
            key={f.key}
            field={f}
            value={data[f.key]}
            enabled={enabled[f.key] !== false}
            generating={generatingField === f.key}
            onChange={(v) => updateField(f.key, v)}
            onToggle={(c) => setEnabled(f.key, c)}
            onAi={() => handleFieldAi(f.key)}
          />
        ))}

      {overwriteOpen && (
        <OverwriteModal
          onClose={() => setOverwriteOpen(false)}
          onConfirm={(mode, targets) => {
            setOverwriteOpen(false);
            void doGenerate(mode, targets);
          }}
        />
      )}

      {formatOpen && <FormatModal onClose={() => setFormatOpen(false)} />}

      {briefFullscreen && (
        <FullscreenEditor
          title={t('editor.brief')}
          value={brief}
          onConfirm={(v) => setBrief(v)}
          onClose={() => setBriefFullscreen(false)}
        />
      )}
    </section>
  );
}
