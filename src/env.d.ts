/// <reference types="astro/client" />

interface ImportMetaEnv {
  // True only in the static GitHub Pages build (see astro.config.mjs). Injected
  // as a compile-time literal via Vite `define`.
  readonly STATIC_BUILD: boolean;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
