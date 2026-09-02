// Field metadata for the "信息键入" form. Field names are always English and
// never change with the UI language; labels are i18n keys.

export type FieldKind = 'text' | 'textarea' | 'tags' | 'array';

export interface FieldMeta {
  key: string;
  kind: FieldKind;
  labelKey: string;
  advanced: boolean;
}

export const CORE_FIELDS: FieldMeta[] = [
  { key: 'name', kind: 'text', labelKey: 'field.name', advanced: false },
  { key: 'description', kind: 'textarea', labelKey: 'field.description', advanced: false },
  { key: 'personality', kind: 'textarea', labelKey: 'field.personality', advanced: false },
  { key: 'scenario', kind: 'textarea', labelKey: 'field.scenario', advanced: false },
  { key: 'first_mes', kind: 'textarea', labelKey: 'field.first_mes', advanced: false },
  { key: 'mes_example', kind: 'textarea', labelKey: 'field.mes_example', advanced: false },
  { key: 'alternate_greetings', kind: 'array', labelKey: 'field.alternate_greetings', advanced: false },
  { key: 'system_prompt', kind: 'textarea', labelKey: 'field.system_prompt', advanced: false },
  { key: 'creator_notes', kind: 'textarea', labelKey: 'field.creator_notes', advanced: false },
  { key: 'tags', kind: 'tags', labelKey: 'field.tags', advanced: false },
  { key: 'creator', kind: 'text', labelKey: 'field.creator', advanced: false },
];

export const ADVANCED_FIELDS: FieldMeta[] = [
  { key: 'post_history_instructions', kind: 'textarea', labelKey: 'field.post_history_instructions', advanced: true },
  { key: 'character_version', kind: 'text', labelKey: 'field.character_version', advanced: true },
  { key: 'group_only_greetings', kind: 'array', labelKey: 'field.group_only_greetings', advanced: true },
];

export const ALL_FIELDS: FieldMeta[] = [...CORE_FIELDS, ...ADVANCED_FIELDS];

export const CONTENT_FIELD_KEYS: string[] = ALL_FIELDS.map((f) => f.key);

export const ARRAY_FIELDS = new Set<string>(['tags', 'alternate_greetings', 'group_only_greetings']);

// Auxiliary description sub-fields. Their values are merged into the front of
// `description` at export time (one line per item). `label` is the English
// label written into the card; `labelKey` is the i18n key for the UI.
export interface SubFieldMeta {
  key: string;
  label: string;
  labelKey: string;
}

export const DESCRIPTION_SUB_FIELDS: SubFieldMeta[] = [
  { key: 'full_name', label: 'Full Name', labelKey: 'subfield.full_name' },
  { key: 'gender', label: 'Gender', labelKey: 'subfield.gender' },
  { key: 'age', label: 'Age', labelKey: 'subfield.age' },
  { key: 'traits', label: 'Traits', labelKey: 'subfield.traits' },
  { key: 'personality', label: 'Personality', labelKey: 'subfield.personality' },
  { key: 'likes', label: 'Likes', labelKey: 'subfield.likes' },
  { key: 'dislikes', label: 'Dislikes', labelKey: 'subfield.dislikes' },
  { key: 'body', label: 'Body', labelKey: 'subfield.body' },
];
