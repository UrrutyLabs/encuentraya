/**
 * Detects contact information (phone, email, or suggestive phrases) in chat text.
 * Used to block messages that try to exchange off-platform contact details.
 */

/** Normalize text for matching: trim and collapse repeated spaces. */
function normalize(text: string): string {
  return text.trim().replace(/\s+/g, " ");
}

/** Uruguayan mobile: 09X XXX XX XX = 0 + 9 digits (with optional spaces/dots/dashes). */
const UY_MOBILE_REGEX =
  /\b0\d{2}[\s.\-]*\d{3}[\s.\-]*\d{2}[\s.\-]*\d{2}\b|\b0\d{9}\b/g;

/** International: +598 9..., +54 9..., etc. (country code + optional space + digit block). */
const INTL_PHONE_REGEX = /\+\d{1,4}[\s.\-]*\d[\s.\-]*\d[\s.\-]*\d[\s.\-]*\d/g;

/** Email: local@domain.tld (simple, catches most). */
const EMAIL_REGEX = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g;

/** Phrases that suggest sharing contact info (case-insensitive). */
const CONTACT_PHRASES = [
  "mi número",
  "mi numero",
  "mi cel",
  "mi tel",
  "mi mail",
  "mi email",
  "mi whatsapp",
  "escríbime al",
  "escribime al",
  "escríbeme al",
  "escribeme al",
  "llamame al",
  "llámame al",
  "llamame a",
  "llámame a",
  "teléfono",
  "telefono",
  "celular",
  "whatsapp",
  "wa.me",
  "t.me",
  "@gmail",
  "@hotmail",
  "@yahoo",
  "@outlook",
  "contacto directo",
  "hablame por",
  "hablame al",
  "escríbeme por",
  "escribeme por",
];

/**
 * Returns true if the text appears to contain phone numbers, email addresses,
 * or phrases that suggest sharing contact information.
 */
export function containsContactInfo(text: string): boolean {
  if (!text || typeof text !== "string") return false;

  const normalized = normalize(text);

  UY_MOBILE_REGEX.lastIndex = 0;
  if (UY_MOBILE_REGEX.test(normalized)) return true;

  INTL_PHONE_REGEX.lastIndex = 0;
  if (INTL_PHONE_REGEX.test(normalized)) return true;

  EMAIL_REGEX.lastIndex = 0;
  if (EMAIL_REGEX.test(normalized)) return true;

  const lower = normalized.toLowerCase();
  for (const phrase of CONTACT_PHRASES) {
    if (lower.includes(phrase)) return true;
  }

  return false;
}
