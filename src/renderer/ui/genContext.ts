import { createContext, useContext } from 'react';

export type GuardedRunner = (fn: () => Promise<void>) => Promise<void>;

export const GenContext = createContext<GuardedRunner>(async (fn) => {
  await fn();
});

export function useRunGuarded(): GuardedRunner {
  return useContext(GenContext);
}
