// Pre-export health check. Returns a list of non-blocking issues; the user can
// still choose to export regardless.

import type { CharacterCard, DecodedImage, ValidationIssue } from '../../shared/types';
import { countCardTokens } from './token';

const KNOWN_EXTENSIONS = new Set(['chub', 'depth_prompt', 'fav', 'talkativeness', 'world']);

export function validateCard(
  card: CharacterCard,
  enabled: Record<string, boolean>,
  tokenBudget: number,
  image: DecodedImage | null,
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const d = card.data ?? {};
  const on = (key: string) => enabled[key] !== false;

  if (!String(d.name ?? '').trim()) {
    issues.push({ level: 'error', key: 'validate.nameEmpty' });
  }
  if (on('description') && !String(d.description ?? '').trim()) {
    issues.push({ level: 'warning', key: 'validate.descriptionEmpty' });
  }
  if (on('personality') && !String(d.personality ?? '').trim()) {
    issues.push({ level: 'warning', key: 'validate.personalityEmpty' });
  }
  if (on('first_mes') && !String(d.first_mes ?? '').trim()) {
    issues.push({ level: 'warning', key: 'validate.firstMesEmpty' });
  }
  if (on('tags')) {
    const tags = Array.isArray(d.tags) ? d.tags.filter((t) => String(t).trim().length > 0) : [];
    if (tags.length < 2) issues.push({ level: 'warning', key: 'validate.tagsEmpty' });
  }

  const entries = d.character_book?.entries ?? [];
  let badEntries = 0;
  for (const e of entries) {
    const keys = (e.keys ?? []).filter((k) => String(k).trim().length > 0);
    if (keys.length === 0 || !String(e.content ?? '').trim()) badEntries++;
  }
  if (badEntries > 0) {
    issues.push({ level: 'warning', key: 'validate.lorebookEntryMissing', args: { n: badEntries } });
  }

  const total = countCardTokens(card);
  if (tokenBudget > 0 && total > tokenBudget) {
    issues.push({ level: 'warning', key: 'validate.tokenOverBudget', args: { total, budget: tokenBudget } });
  }

  if (image && image.width * image.height > 2048 * 2048) {
    issues.push({ level: 'info', key: 'validate.avatarLarge', args: { w: image.width, h: image.height } });
  }

  const extKeys = Object.keys(d.extensions ?? {}).filter((k) => !KNOWN_EXTENSIONS.has(k));
  if (extKeys.length > 0) {
    issues.push({ level: 'info', key: 'validate.unknownExtensions', args: { list: extKeys.join(', ') } });
  }

  return issues;
}
