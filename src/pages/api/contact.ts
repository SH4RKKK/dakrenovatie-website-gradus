// On-demand endpoint for the quote form (QuoteForm.astro). Validates server-side
// and emails the submission to the company mailbox via SMTP.
import type { APIRoute } from "astro";
import { sendMail, mailConfigError } from "../../lib/mailer";
import { json, str, sameOrigin, readJson, withinLimits } from "../../lib/http";
import { isValidEmail } from "../../scripts/forms";
import { rateLimit } from "../../lib/rate-limit";

// On-demand in the normal build; in the static build there is no server, so this
// route is prerendered away (it emits nothing and the form is disabled client-side).
export const prerender = import.meta.env.STATIC_BUILD;

// Per-field maximum lengths (characters), enforced server-side.
const LIMITS = { voornaam: 80, achternaam: 80, email: 150, telefoon: 40, postcode: 16, bericht: 1000 };

export const POST: APIRoute = async ({ request, clientAddress }) => {
  // Block cross-site browser submissions.
  if (!sameOrigin(request)) return json({ ok: false, error: "Ongeldige herkomst." }, 403);

  let body: Record<string, unknown>;
  try {
    body = await readJson(request);
  } catch (e) {
    const tooLarge = (e as Error).message === "PAYLOAD_TOO_LARGE";
    return json(
      { ok: false, error: tooLarge ? "Bericht te groot." : "Ongeldige aanvraag." },
      tooLarge ? 413 : 400
    );
  }

  // Honeypot: bots fill hidden fields; real users leave it empty. Pretend success.
  if (str(body.website)) return json({ ok: true });

  const fields = {
    voornaam: str(body.voornaam),
    achternaam: str(body.achternaam),
    email: str(body.email),
    telefoon: str(body.telefoon),
    postcode: str(body.postcode),
    bericht: str(body.bericht),
  };

  if (!withinLimits(fields, LIMITS))
    return json({ ok: false, error: "Een of meer velden zijn te lang." }, 400);
  if (!isValidEmail(fields.email))
    return json({ ok: false, error: "Vul een geldig e-mailadres in." }, 400);
  if (!fields.postcode) return json({ ok: false, error: "Vul uw postcode in." }, 400);

  const cfgErr = mailConfigError();
  if (cfgErr) return json({ ok: false, error: cfgErr }, 500);

  // Throttle real send attempts only (10 per 10 min per IP), so failed
  // validations or an unconfigured server never lock a legitimate user out.
  const rl = rateLimit(`contact:${clientAddress}`, 10, 10 * 60_000);
  if (!rl.allowed)
    return json({ ok: false, error: "Te veel aanvragen. Probeer het later opnieuw." }, 429, {
      "Retry-After": String(rl.retryAfter),
    });

  const text = [
    "Nieuwe offerteaanvraag via de website",
    "",
    `Naam: ${`${fields.voornaam} ${fields.achternaam}`.trim() || "(leeg)"}`,
    `Email: ${fields.email}`,
    `Telefoon: ${fields.telefoon || "(leeg)"}`,
    `Postcode: ${fields.postcode}`,
    "",
    "Bericht:",
    fields.bericht || "(geen bericht)",
  ].join("\n");

  try {
    await sendMail({ subject: "Offerteaanvraag via website", text, replyTo: fields.email });
  } catch (err) {
    console.error("Offerte mail mislukt:", err);
    return json({ ok: false, error: "Versturen mislukt. Probeer het later opnieuw." }, 502);
  }

  return json({ ok: true });
};
