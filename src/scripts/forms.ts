// Shared front-end form helpers for the contact (QuoteForm) and review forms.
// Both forms POST JSON to a server API route (src/pages/api/*) which sends the
// email over SMTP. submitForm is the single place that talks to the backend.

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(value: string): boolean {
  return EMAIL_RE.test(value);
}

// POST a form payload as JSON to an API route. Resolves on success; throws an
// Error whose message is a user-facing (Dutch) string on any failure, so callers
// can show it directly in the form's error region.
export async function submitForm(
  endpoint: string,
  payload: Record<string, unknown>
): Promise<void> {
  // Static preview build has no backend; explain that instead of failing on a 404.
  if (import.meta.env.STATIC_BUILD) {
    throw new Error("Versturen is uitgeschakeld in deze preview.");
  }

  let res: Response;
  try {
    res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch {
    throw new Error("Geen verbinding. Controleer uw internet en probeer het opnieuw.");
  }

  let body: { ok?: boolean; error?: string } | null = null;
  try {
    body = await res.json();
  } catch {
    /* non-JSON response */
  }

  if (!res.ok || !body?.ok) {
    throw new Error(body?.error || "Versturen mislukt. Probeer het later opnieuw.");
  }
}

// Show the single error region, mark the offending field invalid, wire up
// aria-describedby for AT, and move focus to it.
export function showFieldError(
  errEl: HTMLElement | null,
  field: HTMLElement | null,
  message: string
): void {
  if (errEl) {
    errEl.textContent = message;
    errEl.classList.remove("hidden");
    if (errEl.id) field?.setAttribute("aria-describedby", errEl.id);
  }
  field?.setAttribute("aria-invalid", "true");
  field?.focus();
}

// Reset the error region and clear invalid/describedby state from every field.
export function clearFieldErrors(
  errEl: HTMLElement | null,
  fields: (HTMLElement | null)[]
): void {
  errEl?.classList.add("hidden");
  for (const f of fields) {
    f?.removeAttribute("aria-invalid");
    f?.removeAttribute("aria-describedby");
  }
}
