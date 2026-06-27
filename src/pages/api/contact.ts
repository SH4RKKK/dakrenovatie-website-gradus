// On-demand endpoint for the quote form (QuoteForm.astro). Validates server-side
// and emails the submission to the company mailbox via SMTP.
import type { APIRoute } from "astro";
import { sendMail, mailConfigError } from "../../lib/mailer";
import { json, str } from "../../lib/http";
import { isValidEmail } from "../../scripts/forms";

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  const cfgErr = mailConfigError();
  if (cfgErr) return json({ ok: false, error: cfgErr }, 500);

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: "Ongeldige aanvraag." }, 400);
  }

  // Honeypot: bots fill hidden fields; real users leave it empty. Pretend success.
  if (str(body.website)) return json({ ok: true });

  const voornaam = str(body.voornaam);
  const achternaam = str(body.achternaam);
  const email = str(body.email);
  const telefoon = str(body.telefoon);
  const postcode = str(body.postcode);
  const bericht = str(body.bericht);

  if (!isValidEmail(email)) return json({ ok: false, error: "Vul een geldig e-mailadres in." }, 400);
  if (!postcode) return json({ ok: false, error: "Vul uw postcode in." }, 400);

  const text = [
    "Nieuwe offerteaanvraag via de website",
    "",
    `Naam: ${`${voornaam} ${achternaam}`.trim() || "(leeg)"}`,
    `Email: ${email}`,
    `Telefoon: ${telefoon || "(leeg)"}`,
    `Postcode: ${postcode}`,
    "",
    "Bericht:",
    bericht || "(geen bericht)",
  ].join("\n");

  try {
    await sendMail({ subject: "Offerteaanvraag via website", text, replyTo: email });
  } catch (err) {
    console.error("Offerte mail mislukt:", err);
    return json({ ok: false, error: "Versturen mislukt. Probeer het later opnieuw." }, 502);
  }

  return json({ ok: true });
};
