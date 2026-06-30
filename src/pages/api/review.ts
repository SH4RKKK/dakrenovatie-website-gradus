// On-demand endpoint for the review modal (ReviewModal.astro). Emails the review
// to the company mailbox, including a ready-to-save JSON block the owner drops
// into resources/reviews/text/ to approve it (same flow as before, now server-sent).
import type { APIRoute } from "astro";
import { sendMail, mailConfigError } from "../../lib/mailer";
import { json, str, sameOrigin, readJson, withinLimits } from "../../lib/http";
import { isValidEmail } from "../../scripts/forms";
import { mailRateLimit } from "../../lib/rate-limit";

// On-demand in the normal build; in the static build there is no server, so this
// route is prerendered away (it emits nothing and the form is disabled client-side).
export const prerender = import.meta.env.STATIC_BUILD;

const LIMITS = { naam: 120, email: 150, postcode: 16, review: 1000 };

export const POST: APIRoute = async ({ request, clientAddress }) => {
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

  if (str(body.website)) return json({ ok: true }); // honeypot

  const fields = {
    naam: str(body.naam),
    email: str(body.email),
    postcode: str(body.postcode),
    review: str(body.review),
  };
  const anonymous = body.anonymous === true || body.anonymous === "on";
  // Date is passed from the client (server has no Date in this runtime context).
  const date = /^\d{4}-\d{2}-\d{2}$/.test(str(body.date)) ? str(body.date) : "";

  if (!withinLimits(fields, LIMITS))
    return json({ ok: false, error: "Een of meer velden zijn te lang." }, 400);
  if (!isValidEmail(fields.email))
    return json({ ok: false, error: "Vul een geldig e-mailadres in." }, 400);
  if (!fields.postcode) return json({ ok: false, error: "Vul uw postcode in." }, 400);
  if (!fields.review) return json({ ok: false, error: "Schrijf uw beoordeling." }, 400);

  const cfgErr = mailConfigError();
  if (cfgErr) {
    // Log the specific missing config server-side; tell the client only a generic
    // message so an unconfigured deployment doesn't leak which secrets are unset.
    console.error("Mail niet geconfigureerd:", cfgErr);
    return json({ ok: false, error: "Versturen is tijdelijk niet beschikbaar." }, 503);
  }

  // Throttle real send attempts only (a global send ceiling + 1 per minute per
  // IP), so failed validations or an unconfigured server never lock a
  // legitimate user out. The global bucket caps total outbound mail even if the
  // per-IP key is spoofed.
  const rl = mailRateLimit("review", clientAddress);
  if (!rl.allowed)
    return json({ ok: false, error: "Te veel aanvragen. Probeer het later opnieuw." }, 429, {
      "Retry-After": String(rl.retryAfter),
    });

  const record = {
    name: fields.naam,
    email: fields.email,
    postcode: fields.postcode,
    review: fields.review,
    anonymous,
    date,
  };
  const jsonBlock = JSON.stringify(record, null, 2);
  const slug =
    (fields.naam || "anoniem")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "review";
  const filename = `${date || "datum"}-${slug}.json`;

  const text = [
    "Nieuwe recensie via de website",
    "",
    `Naam: ${fields.naam || "(leeg)"}`,
    `Email: ${fields.email}`,
    `Postcode: ${fields.postcode}`,
    `Anoniem weergeven: ${anonymous ? "Ja" : "Nee"}`,
    "",
    "Beoordeling:",
    fields.review,
    "",
    `De recensie is bijgevoegd als ${filename}. Sla dit bestand op in resources/reviews/text om de recensie goed te keuren.`,
  ].join("\n");

  try {
    await sendMail({
      subject: "Nieuwe recensie via de website",
      text,
      replyTo: fields.email,
      attachments: [{ filename, content: jsonBlock, contentType: "application/json" }],
    });
  } catch (err) {
    console.error("Recensie mail mislukt:", err);
    return json({ ok: false, error: "Versturen mislukt. Probeer het later opnieuw." }, 502);
  }

  return json({ ok: true });
};
