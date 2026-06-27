// On-demand endpoint for the review modal (ReviewModal.astro). Emails the review
// to the company mailbox, including a ready-to-save JSON block the owner drops
// into resources/reviews/text/ to approve it (same flow as before, now server-sent).
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

  if (str(body.website)) return json({ ok: true }); // honeypot

  const naam = str(body.naam);
  const email = str(body.email);
  const postcode = str(body.postcode);
  const reviewText = str(body.review);
  const anonymous = body.anonymous === true || body.anonymous === "on";
  // Date is passed from the client (server has no Date in this runtime context).
  const date = /^\d{4}-\d{2}-\d{2}$/.test(str(body.date)) ? str(body.date) : "";

  if (!isValidEmail(email)) return json({ ok: false, error: "Vul een geldig e-mailadres in." }, 400);
  if (!postcode) return json({ ok: false, error: "Vul uw postcode in." }, 400);
  if (!reviewText) return json({ ok: false, error: "Schrijf uw beoordeling." }, 400);

  const record = { name: naam, email, postcode, review: reviewText, anonymous, date };
  const jsonBlock = JSON.stringify(record, null, 2);
  const slug =
    (naam || "anoniem")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "review";
  const filename = `${date || "datum"}-${slug}.json`;

  const text = [
    "Nieuwe review via de website",
    "",
    `Naam: ${naam || "(leeg)"}`,
    `Email: ${email}`,
    `Postcode: ${postcode}`,
    `Anoniem weergeven: ${anonymous ? "Ja" : "Nee"}`,
    "",
    "Beoordeling:",
    reviewText,
    "",
    `--- JSON (sla op als ${filename} in resources/reviews/text om goed te keuren) ---`,
    jsonBlock,
  ].join("\n");

  try {
    await sendMail({ subject: "Nieuwe review via de website", text, replyTo: email });
  } catch (err) {
    console.error("Review mail mislukt:", err);
    return json({ ok: false, error: "Versturen mislukt. Probeer het later opnieuw." }, 502);
  }

  return json({ ok: true });
};
