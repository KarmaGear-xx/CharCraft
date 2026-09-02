// Gender swap / pronoun replacement. Case-aware and single-pass.

import type { CharacterCard } from '../../shared/types';
import { mapCardText } from './cardText';

const PAIRS: Record<string, string> = {
  he: 'she',
  she: 'he',
  him: 'her',
  her: 'him',
  his: 'her',
  hers: 'his',
  himself: 'herself',
  herself: 'himself',
  man: 'woman',
  woman: 'man',
  men: 'women',
  women: 'men',
  boy: 'girl',
  girl: 'boy',
  boys: 'girls',
  girls: 'boys',
  male: 'female',
  female: 'male',
  husband: 'wife',
  wife: 'husband',
  king: 'queen',
  queen: 'king',
  gentleman: 'lady',
  lady: 'gentleman',
  brother: 'sister',
  sister: 'brother',
  father: 'mother',
  mother: 'father',
  uncle: 'aunt',
  aunt: 'uncle',
  nephew: 'niece',
  niece: 'nephew',
  son: 'daughter',
  daughter: 'son',
};

const WORD_RE = new RegExp('\\b(' + Object.keys(PAIRS).join('|') + ')\\b', 'gi');

function matchCase(word: string, target: string): string {
  if (word.length > 1 && word === word.toUpperCase()) return target.toUpperCase();
  if (word[0] === word[0].toUpperCase()) return target[0].toUpperCase() + target.slice(1);
  return target.toLowerCase();
}

export function swapGenders(text: string): string {
  return text.replace(WORD_RE, (match) => {
    const counterpart = PAIRS[match.toLowerCase()];
    return counterpart ? matchCase(match, counterpart) : match;
  });
}

export function genderSwapCard(card: CharacterCard): CharacterCard {
  return mapCardText(card, swapGenders);
}
