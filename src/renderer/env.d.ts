/// <reference types="vite/client" />

import type { WindowApi } from '../shared/types';

declare global {
  interface Window {
    api: WindowApi;
  }
}

export {};
