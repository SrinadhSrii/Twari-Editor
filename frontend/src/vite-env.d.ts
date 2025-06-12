/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_WEBFLOW_CLIENT_ID: string;
  readonly VITE_API_BASE_URL: string;
  readonly VITE_NEXTJS_API_URL: string;
  readonly VITE_DEV_MODE: string;
  readonly VITE_CUSTOM_DOMAIN: string;
  readonly VITE_DEBUG: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// Global type declarations
declare global {
  interface Window {
    webflow?: any;
  }
}

export {};