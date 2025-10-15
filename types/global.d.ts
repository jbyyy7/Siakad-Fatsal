declare module 'react-hot-toast' {
  import type { ComponentType, ReactNode } from 'react';
  export const toast: { success: (msg: string) => void; error: (msg: string) => void };
  export const Toaster: ComponentType<{ position?: string }>;
  export default toast;
}

declare module 'vitest' {
  export * from 'vitest';
}

declare module 'vitest/config' {
  import { defineConfig } from 'vitest/config';
  const dc: any;
  export default dc;
}

// Vitest globals for tests (basic declarations to avoid TS errors before dev deps are installed)
declare const describe: any;
declare const it: any;
declare const expect: any;
declare const vi: any;
declare const beforeEach: any;
