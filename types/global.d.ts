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

// Minimal ambient for @sendgrid/mail so TS doesn't require installed types in CI/dev container
declare module '@sendgrid/mail' {
  export function setApiKey(key: string): void;
  export function send(msg: any): Promise<any>;
  const _default: { setApiKey(k: string): void; send(m: any): Promise<any> };
  export default _default;
}

// Minimal ambient for vercel serverless handler types (if not installed)
declare module '@vercel/node' {
  export type VercelRequest = any;
  export type VercelResponse = any;
}

declare module 'xlsx' {
  export function read(data: any, opts?: any): any;
  export const utils: any;
}
