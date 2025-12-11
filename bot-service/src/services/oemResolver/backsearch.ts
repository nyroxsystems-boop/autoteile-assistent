import fetch from "node-fetch";
import { logger } from "../../utils/logger";
import { OEMResolverRequest } from "./types";

type BacksearchResult = {
  tecdocHit: boolean;
  webHit: boolean;
};

const RAPID_KEY = process.env.TECDOC_API_KEY || process.env.RAPIDAPI_KEY || "";
const RAPID_HOST = process.env.TECDOC_RAPID_API_HOST || process.env.RAPIDAPI_HOST || "tecdoc-catalog.p.rapidapi.com";

/**
 * Validate a found OEM by re-querying TecDoc (Rapid) and a lightweight web lookup (7zap).
 * This does NOT invent new OEMs; it only confirms or rejects confidence.
 */
export async function backsearchOEM(oem: string, req: OEMResolverRequest): Promise<BacksearchResult> {
  const result: BacksearchResult = { tecdocHit: false, webHit: false };

  // TecDoc Rapid backsearch
  if (RAPID_KEY) {
    const url = `https://${RAPID_HOST}/articles-oem/search-by-article-oem-no/lang-id/4/article-oem-no/${encodeURIComponent(oem)}`;
    try {
      const res = await fetch(url, {
        method: "GET",
        headers: {
          "x-rapidapi-key": RAPID_KEY,
          "x-rapidapi-host": RAPID_HOST,
          Accept: "application/json"
        }
      });
      if (res.ok) {
        const json: any = await res.json();
        const items = Array.isArray(json?.data) ? json.data : Array.isArray(json?.results) ? json.results : [];
        if (items.length > 0) {
          result.tecdocHit = true;
        }
      } else {
        logger.warn("backsearchOEM TecDoc response not ok", { status: res.status, statusText: res.statusText });
      }
    } catch (err: any) {
      logger.warn("backsearchOEM TecDoc failed", { error: err?.message });
    }
  } else {
    logger.warn("backsearchOEM skipped TecDoc: no API key configured");
  }

  // Simple web check on 7zap (HTML presence of OEM string)
  try {
    const sevenZapUrl = `https://7zap.com/en/search/?keyword=${encodeURIComponent(oem)}`;
    const res = await fetch(sevenZapUrl, { method: "GET" });
    if (res.ok) {
      const html = await res.text();
      if (html.toUpperCase().includes(oem.toUpperCase())) {
        result.webHit = true;
      }
    }
  } catch (err: any) {
    logger.warn("backsearchOEM 7zap failed", { error: err?.message });
  }

  // Log outcome with context
  logger.info("backsearchOEM finished", {
    oem,
    orderId: req.orderId,
    tecdocHit: result.tecdocHit,
    webHit: result.webHit
  });

  return result;
}
