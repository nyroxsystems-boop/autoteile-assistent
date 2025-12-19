// Minimal helper for extracting OEM-like strings from HTML/text.
// This is a simple best-effort implementation to satisfy type imports and basic extraction.

export function normalizeOem(input: string | null | undefined): string {
  if (!input) return "";
  return input.toString().replace(/[\s\n\t]+/g, "").toUpperCase().trim();
}

export function looksLikeOem(s: string): boolean {
  if (!s) return false;
  const norm = normalizeOem(s);
  // Accept alphanumeric with optional - or . between and length 4-30
  return /^[A-Z0-9][A-Z0-9\-\.]{2,28}[A-Z0-9]$/.test(norm);
}

export function extractOemsFromHtml(html: string): string[] {
  if (!html) return [];
  const candidates = new Set<string>();
  // find sequences of uppercase letters/numbers with length 4-20
  const re = /\b[A-Z0-9][A-Z0-9\-\.]{3,18}[A-Z0-9]\b/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) {
    const norm = normalizeOem(m[0]);
    if (looksLikeOem(norm)) candidates.add(norm);
  }
  return Array.from(candidates);
}
