// Built-in recipes: reusable "building blocks" that generate card content via AI.

import type { Recipe } from '../../shared/types';

export const BUILTIN_RECIPES: Recipe[] = [
  { id: 'r_tsundere', name: 'Tsundere Personality', field: 'personality', prompt: 'A tsundere personality: outwardly harsh and aloof, but secretly caring and affectionate.', builtin: true },
  { id: 'r_kuudere', name: 'Kuudere Personality', field: 'personality', prompt: 'A kuudere personality: calm, cold and emotionless on the surface, gradually warming over time.', builtin: true },
  { id: 'r_cheerful', name: 'Cheerful Personality', field: 'personality', prompt: 'An upbeat, optimistic and energetic personality.', builtin: true },
  { id: 'r_mysterious', name: 'Mysterious Personality', field: 'personality', prompt: 'An enigmatic, secretive personality with hidden depths.', builtin: true },
  { id: 'r_mentor', name: 'Mentor Persona', field: 'personality', prompt: 'A wise, patient mentor personality who guides the user.', builtin: true },
  { id: 'r_fantasy', name: 'Fantasy Scenario', field: 'scenario', prompt: 'A classic high-fantasy world with magic, kingdoms and ancient lore.', builtin: true },
  { id: 'r_scifi', name: 'Sci-Fi Scenario', field: 'scenario', prompt: 'A futuristic sci-fi setting with advanced technology and space travel.', builtin: true },
  { id: 'r_modern', name: 'Modern Scenario', field: 'scenario', prompt: 'A contemporary modern-day setting.', builtin: true },
  { id: 'r_appearance', name: 'Appearance Description', field: 'description', prompt: 'A detailed physical appearance description (hair, eyes, build, clothing style).', builtin: true },
  { id: 'r_backstory', name: 'Backstory', field: 'description', prompt: 'A compelling backstory with clear motivations and a formative past event.', builtin: true },
  { id: 'r_flirty_greeting', name: 'Flirty Greeting', field: 'first_mes', prompt: 'A flirty, playful opening message that draws the user in.', builtin: true },
  { id: 'r_dramatic_greeting', name: 'Dramatic Greeting', field: 'first_mes', prompt: 'A dramatic, atmospheric opening message that sets the scene.', builtin: true },
];
