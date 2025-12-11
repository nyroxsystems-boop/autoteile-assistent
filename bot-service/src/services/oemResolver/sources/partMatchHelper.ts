import { OEMResolverRequest, OEMCandidate } from "../types";

/**
 * Schneller Plausibilitätscheck: Passt Kandidat zum User-Teiltext?
 * - Wenn suspectedNumber vorhanden und exakt gleich, passt.
 * - Sonst einfacher Keyword-Match auf Kategorienamen.
 * - Optional: OpenAI-Check, wenn API-Key verfügbar.
 */
export async function filterByPartMatch(candidates: OEMCandidate[], req: OEMResolverRequest): Promise<OEMCandidate[]> {
  const text = (req.partQuery.rawText || "").toLowerCase();
  const suspected = (req.partQuery.suspectedNumber || "").toUpperCase();
  const normalizedText = text.replace(/[^a-z0-9äöüß]/gi, " ");
  const keywords = [
    "bremse", "brake", "disc", "scheibe", "pad", "belag", "filter", "ölfilter", "air", "luft",
    "querlenker", "lenker", "arm", "stabi", "fahrwerk", "spark", "zünd", "spark plug"
  ];

  const baseFilter = candidates.filter((c) => {
    if (suspected && c.oem.toUpperCase() === suspected) return true;
    // Simple keyword heuristic: allow if text contains at least one known keyword
    if (keywords.some((k) => normalizedText.includes(k))) return true;
    // If no keyword found, keep candidate but lower priority
    return false;
  });

  // Optional OpenAI match (binary keep/discard)
  if (process.env.OPENAI_API_KEY && baseFilter.length > 0) {
    try {
      const prompt = `Teilbeschreibung: "${req.partQuery.rawText}"\nKandidat OEMs: ${baseFilter
        .map((c) => c.oem)
        .join(", ")}\nFrage: Passen diese OEMs zu dem angefragten Teil? Antworte als JSON {"keep":["OEM1",...]} nur mit OEMs, die passen.`;
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
          messages: [
            { role: "system", content: "Du filterst OEM-Nummern nach Passung zum angefragten Fahrzeugteil." },
            { role: "user", content: prompt }
          ],
          temperature: 0
        })
      });
      const data = await res.json();
      const txt = data?.choices?.[0]?.message?.content || "";
      const match = txt.match(/\{[\s\S]*\}/);
      if (match) {
        const parsed = JSON.parse(match[0]);
        const keep: string[] = Array.isArray(parsed?.keep) ? parsed.keep.map((s: string) => s.toUpperCase()) : [];
        if (keep.length) {
          return baseFilter.filter((c) => keep.includes(c.oem.toUpperCase()));
        }
      }
    } catch {
      // falls OpenAI scheitert: einfach baseFilter zurückgeben
    }
  }

  return baseFilter.length ? baseFilter : candidates;
}
