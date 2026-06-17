// Shared front-end form helpers for the contact (QuoteForm) and review forms.
// Submission is mailto-only for now; swap `openMailto` for a real endpoint later
// and both forms switch over in one place.

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(value: string): boolean {
  return EMAIL_RE.test(value);
}

// Build a mailto: link from a subject + body lines and navigate to it. Every
// part is encodeURIComponent-encoded, so user input can't inject extra headers
// (CC/BCC), break out of the body, or smuggle CRLF/`javascript:` payloads.
export function openMailto(recipient: string, subject: string, bodyLines: string[]): void {
  const s = encodeURIComponent(subject);
  const b = encodeURIComponent(bodyLines.join("\n"));
  window.location.href = `mailto:${recipient}?subject=${s}&body=${b}`;
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
