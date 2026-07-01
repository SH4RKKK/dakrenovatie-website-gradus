# Security notes

How the form API is protected, and what to add before / after going live.

## Implemented in code

The two form endpoints (`src/pages/api/contact.ts`, `src/pages/api/review.ts`) and
`src/lib/mailer.ts` enforce:

- **Server-only secrets.** SMTP credentials are declared `context: 'server', access: 'secret'`
  and read via `astro:env/server`, so they never reach the client bundle. `.env` is gitignored.
- **Not an open relay.** The recipient is fixed to `MAIL_TO` / `site.email`; it is never taken
  from the request, so the endpoints cannot be used to email arbitrary third parties.
- **Origin check.** Cross-site browser POSTs are rejected (`403`). Requests without an `Origin`
  header (curl, server-to-server) are allowed, since browsers always send `Origin` cross-site.
- **Rate limiting (token bucket, two layers).** `src/lib/rate-limit.ts` enforces a **global**
  send ceiling shared by both endpoints (default ~20 sends/hour sustained, burst 30, ~480/day,
  under a Gmail-free quota) **plus** a per-IP limit of **3 sends per 5 minutes per IP** per endpoint
  (`429` + `Retry-After`). Only requests that pass validation and reach the send step consume a
  token, so failed input never locks out a legitimate user. The global bucket is the spoof-proof
  backstop: it caps total outbound mail even if the per-IP key is forged (see the proxy note
  below). In-memory and per-instance; move to a shared store (Redis/KV) before scaling out.
- **SMTP timeouts.** `mailer.ts` sets `connectionTimeout`/`greetingTimeout`/`socketTimeout` so a
  slow or hung mail server cannot hold a request (and its socket) open indefinitely.
- **Input limits.** A 16 KB request-body cap (`413`) plus per-field max lengths (`400`), with
  matching client-side `maxlength` on every field.
- **Server-side validation.** Email format and required fields are re-checked on the server,
  independent of the client.
- **Plain-text email.** Submissions are sent as text (never HTML), and `replyTo` is the
  validated visitor email, so neither body nor header injection is possible.
- **Honeypot.** A hidden `website` field silently drops bot submissions.
- **Safe failures.** Misconfiguration and SMTP errors are caught; details are logged
  server-side only, and the client receives a generic message.
- **`requireTLS`** on STARTTLS (587) so credentials are never sent over an unencrypted link.
- **Response headers.** API JSON responses set `Cache-Control: no-store` and
  `X-Content-Type-Options: nosniff`.

## Site-wide response headers

`public/_headers` sets CSP, `X-Frame-Options`, `Referrer-Policy`, and `Permissions-Policy`.
That file is honored by **Netlify** and **Cloudflare Pages**. It is **not** applied by the
Node standalone server, so if you deploy that way, set the same headers at your reverse proxy.
Example for nginx:

```nginx
server_tokens off;            # hide nginx version
client_max_body_size 16k;     # mirror the app's request-body cap, blocks large-body DoS at the edge
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; font-src 'self'; img-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'" always;
add_header X-Frame-Options "DENY" always;
add_header X-Content-Type-Options "nosniff" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Permissions-Policy "geolocation=(), microphone=(), camera=()" always;
add_header Strict-Transport-Security "max-age=63072000; includeSubDomains" always;
```

**TLS / HTTPS.** The static preview (GitHub Pages) is already served over HTTPS by the host.
The **Node standalone server is plain HTTP on its own** — it must run behind a TLS-terminating
reverse proxy (or a host that provides TLS). Do not expose the bare Node port to the internet.
Redirect HTTP→HTTPS and send the `Strict-Transport-Security` header shown above.

**Client IP / `X-Forwarded-For`.** The per-IP rate limit uses the platform-reported client IP,
which Astro derives from `X-Forwarded-For` when present. A direct-to-internet Node server (or a
misconfigured proxy) therefore lets a client forge that header and rotate the per-IP key. The
reverse proxy **must strip any inbound `X-Forwarded-For` and set its own** (single trusted hop),
e.g. nginx `proxy_set_header X-Forwarded-For $remote_addr;`. The global send bucket caps total
mail regardless, but fixing the proxy restores the per-IP limit's value.

The CSP uses `'unsafe-inline'` for `script-src` because Astro inlines small component
scripts (the menu, carousel, and form handlers) directly into the HTML, so a strict
`'self'` would break them. The page renders no user-supplied HTML, so inline-script XSS
isn't reachable, but if you want to drop `'unsafe-inline'`, enable Astro's hash-based CSP
(`experimental.csp`) so each inline script gets a hash instead. If you later add third-party
scripts, analytics, or embeds, widen the CSP to match.

## Recommended next steps (not yet done)

- **CAPTCHA** (e.g. Cloudflare Turnstile or hCaptcha) on both forms. The honeypot + rate limit
  stop casual abuse; a CAPTCHA stops determined bots. Needs a provider key, so it was left out.
- **Email deliverability:** configure **SPF, DKIM, and DMARC** DNS records for the sending
  domain so submissions are not flagged as spam. (DNS, not code.)
- **Monitoring/alerting** on the SMTP error logs so failed sends are noticed.

## Considered and intentionally left out

- **CSRF tokens** — there is no login or session to abuse, so traditional CSRF does not apply;
  the Origin check already blocks cross-site browser submissions.
- **Storing submissions in a database** — out of scope; everything is delivered by email.
