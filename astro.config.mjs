// @ts-check
import { defineConfig, envField } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import node from '@astrojs/node';

// Static build switch. `STATIC_BUILD=true npm run build` produces a fully static
// site with NO server: no adapter, no mail API, links prefixed for the GitHub
// Pages project subpath. Used by the GitHub Pages deploy workflow so a friend can
// review the look-and-feel. The normal build (flag unset) keeps the Node adapter
// and the SMTP form endpoints for real hosting.
const STATIC = process.env.STATIC_BUILD === 'true';
// GitHub project page repo name; the site is served under /<REPO>/.
const REPO = 'dakrenovatie-website-gradus';

// https://astro.build/config
export default defineConfig({
  site: STATIC ? 'https://sh4rkkk.github.io' : 'https://dakrenovatiemiddennederland.nl',
  // Project pages live at a subpath; base makes every asset/link resolve there.
  base: STATIC ? `/${REPO}` : undefined,
  // Node adapter: keeps the build portable (no host-specific functions). All
  // marketing pages stay statically prerendered; only the form API routes under
  // src/pages/api opt into on-demand rendering (export const prerender = false).
  // The static build drops the adapter entirely (no server to run).
  ...(STATIC ? {} : { adapter: node({ mode: 'standalone' }) }),
  vite: {
    plugins: [tailwindcss()],
    // Expose the flag to app code as a compile-time literal (so dead branches,
    // e.g. the form POST in static mode, are tree-shaken out).
    define: { 'import.meta.env.STATIC_BUILD': JSON.stringify(STATIC) },
  },
  // Typed, validated environment variables. SMTP secrets are server-only and
  // never reach the client. Filled in via .env (see .env.example).
  env: {
    schema: {
      SMTP_HOST: envField.string({ context: 'server', access: 'secret', optional: true }),
      SMTP_PORT: envField.number({ context: 'server', access: 'secret', default: 587 }),
      SMTP_SECURE: envField.boolean({ context: 'server', access: 'secret', default: false }),
      SMTP_USER: envField.string({ context: 'server', access: 'secret', optional: true }),
      SMTP_PASS: envField.string({ context: 'server', access: 'secret', optional: true }),
      // Where form submissions are delivered. Defaults to site.email if unset.
      MAIL_TO: envField.string({ context: 'server', access: 'secret', optional: true }),
      // Envelope From. Many SMTP servers require this to equal the mailbox.
      MAIL_FROM: envField.string({ context: 'server', access: 'secret', optional: true }),
    },
  },
});
