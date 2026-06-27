// @ts-check
import { defineConfig, envField } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import node from '@astrojs/node';

// https://astro.build/config
export default defineConfig({
  site: 'https://dakrenovatiemiddennederland.nl',
  // Node adapter: keeps the build portable (no host-specific functions). All
  // marketing pages stay statically prerendered; only the form API routes under
  // src/pages/api opt into on-demand rendering (export const prerender = false).
  adapter: node({ mode: 'standalone' }),
  vite: {
    plugins: [tailwindcss()],
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
