import OpenAI from "openai";
import fetch from "node-fetch";
import {
  insertMessage,
  findOrCreateOrder,
  updateOrder,
  updateOrderData,
  ConversationStatus,
  upsertVehicleForOrderFromPartial,
  getVehicleForOrder,
  updateOrderOEM,
  listShopOffersByOrderId,
  getOrderById,
  updateOrderStatus
} from "./supabaseService";
import { determineRequiredFields } from "./oemRequiredFieldsService";
import { resolveOEM } from "./oemService";
import { logger } from "../utils/logger";
import { scrapeOffersForOrder } from "./scrapingService";
import { GENERAL_QA_SYSTEM_PROMPT } from "../prompts/generalQaPrompt";

// KI-Client für NLU
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || ""
});

async function answerGeneralQuestion(params: {
  userText: string;
  language: "de" | "en";
  missingVehicleInfo: string[];
  knownVehicleSummary: string;
}): Promise<string> {
  const { userText, language, missingVehicleInfo, knownVehicleSummary } = params;

  let missingInfoSentence = "";
  if (missingVehicleInfo.length > 0) {
    if (language === "de") {
      missingInfoSentence =
        "\n\nDamit ich passende Teile finden kann, brauche ich noch: " + missingVehicleInfo.join(", ") + ".";
    } else {
      missingInfoSentence =
        "\n\nTo find the correct parts, I still need: " + missingVehicleInfo.join(", ") + ".";
    }
  }

  const userPrompt =
    (language === "de"
      ? `Nutzerfrage: "${userText}"\n\nBereits bekannte Fahrzeugdaten: ${knownVehicleSummary}\nNoch fehlende Infos: ${
          missingVehicleInfo.join(", ") || "keine"
        }`
      : `User question: "${userText}"\n\nKnown vehicle data: ${knownVehicleSummary}\nMissing info: ${
          missingVehicleInfo.join(", ") || "none"
        }`) + "\n\nBitte beantworte die Frage oben.";

  try {
    const response = await client.chat.completions.create({
      model: "gpt-4.1",
      messages: [
        { role: "system", content: GENERAL_QA_SYSTEM_PROMPT },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.2
    });

    let text = response.choices[0]?.message?.content?.trim() || "";

    text += missingInfoSentence;

    return text;
  } catch (err: any) {
    console.error("General QA failed:", err?.message);
    return language === "de"
      ? "Gute Frage! Leider kann ich sie gerade nicht beantworten. Versuch es bitte später erneut."
      : "Good question! I can’t answer it right now, please try again later.";
  }
}

// ------------------------------
// Parsing Interface
// ------------------------------
export interface ParsedUserMessage {
  intent: "request_part" | "give_vehicle_info" | "smalltalk" | "unknown";

  // Fahrzeuginfos
  make?: string | null;
  model?: string | null;
  year?: number | null;
  engine?: string | null;
  hsn?: string | null;
  tsn?: string | null;
  vin?: string | null;

  // Teileinfos
  part?: string | null; // Freitext, z.B. "Bremssattel"
  partCategory?: string | null; // normalisiert, z.B. "brake_caliper", "brake_disc"
  position?: string | null; // z.B. "front_left", "front_axle", "rear_both"
  partDetails?: any | null; // z.B. { discDiameter: 300 }

  // fehlende Infos
  missingVehicleInfo?: string[]; // ["make","model","year","engine"]
  missingPartInfo?: string[]; // ["position","disc_diameter"]

  // Smalltalk
  smalltalkType?: SmalltalkType | null;
  smalltalkReply?: string | null;
}

// Pflichtfelder pro Teilkategorie (Minimalanforderungen für OEM-Ermittlung)
const partRequiredFields: Record<string, string[]> = {
  brake_caliper: ["position"],
  brake_disc: ["position", "disc_diameter"],
  brake_pad: ["position"],
  shock_absorber: ["position"],
};

type SmalltalkType = "greeting" | "thanks" | "bot_question";

// ------------------------------
// Hilfsfunktionen
// ------------------------------
function detectLanguageSelection(text: string): "de" | "en" | null {
  if (!text) return null;
  const t = text.trim().toLowerCase();

  if (["1", "de", "deutsch", "german", "ger"].includes(t)) return "de";
  if (["2", "en", "english", "englisch", "eng"].includes(t)) return "en";

  return null;
}

function detectLanguageFromText(text: string): "de" | "en" | null {
  const t = text?.toLowerCase() ?? "";
  const germanHints = ["hallo", "moin", "servus", "grüß", "danke", "tschau", "bitte"];
  const englishHints = ["hello", "hi", "hey", "thanks", "thank you", "cheers"];

  if (germanHints.some((w) => t.includes(w))) return "de";
  if (englishHints.some((w) => t.includes(w))) return "en";
  return null;
}

function detectSmalltalk(text: string): SmalltalkType | null {
  const t = text?.toLowerCase() ?? "";
  if (!t) return null;
  const greetings = ["hallo", "hi", "hello", "hey", "moin", "servus", "guten tag", "good morning", "good evening"];
  const thanks = ["danke", "vielen dank", "thx", "thanks", "thank you"];
  const botQuestions = ["bist du ein bot", "are you a bot", "echter mensch", "real person"];

  if (greetings.some((g) => t.includes(g))) return "greeting";
  if (thanks.some((w) => t.includes(w))) return "thanks";
  if (botQuestions.some((b) => t.includes(b))) return "bot_question";
  return null;
}

function buildSmalltalkReply(kind: SmalltalkType, lang: "de" | "en", stage: string | null): string {
  const needsVehicleDoc = stage === "awaiting_vehicle_document";
  const needsVehicleData = stage === "collecting_vehicle_data";
  const needsPartData = stage === "collecting_part_data";

  if (kind === "thanks") {
    return lang === "de"
      ? "Gern geschehen! Sag mir einfach, wenn du noch ein Teil oder mehr Infos brauchst."
      : "You’re welcome! Let me know if you need a part or any other help.";
  }

  if (kind === "bot_question") {
    return lang === "de"
      ? "Ich bin dein Teile-Assistent und helfe dir, das richtige Ersatzteil zu finden. Schick mir Marke/Modell/Baujahr oder ein Foto vom Fahrzeugschein."
      : "I’m your parts assistant and can help you find the right part. Send me the car brand/model/year or a photo of the registration document.";
  }

  // greeting
  if (needsVehicleDoc) {
    return lang === "de"
      ? "Hi! 👋 Schick mir am besten zuerst ein Foto deines Fahrzeugscheins. Wenn du keins hast, nenn mir bitte Marke, Modell, Baujahr und falls möglich Motor/HSN/TSN."
      : "Hi there! 👋 Please send a photo of your vehicle registration first. If you don’t have one, tell me brand, model, year and, if possible, engine/HSN/TSN.";
  }
  if (needsVehicleData) {
    return lang === "de"
      ? "Hallo! 👋 Welche Fahrzeugdaten hast du für mich? Marke, Modell, Baujahr und Motor helfen mir am meisten."
      : "Hello! 👋 Which vehicle details do you have for me? Brand, model, year, and engine help the most.";
  }
  if (needsPartData) {
    return lang === "de"
      ? "Hey! 👋 Um dir das richtige Teil zu finden, sag mir bitte um welches Teil es geht und vorne/hinten, links/rechts."
      : "Hey! 👋 To find the right part, tell me which part you need and whether it’s front/rear, left/right.";
  }

  return lang === "de"
    ? "Hallo! 👋 Wie kann ich dir helfen? Suchst du ein Ersatzteil? Dann schick mir Marke/Modell/Baujahr oder ein Foto vom Fahrzeugschein."
    : "Hi! 👋 How can I help? Looking for a part? Share the car brand/model/year or send a photo of the registration.";
}

/**
 * Simpler Heuristik-Check, ob der Kunde sagt, dass er keinen Fahrzeugschein hat.
 */
function detectNoVehicleDocument(text: string): boolean {
  if (!text) return false;
  const t = text.toLowerCase();
  const patterns = [
    "kein fahrzeugschein", "keinen fahrzeugschein",
    "brief nicht da", "brief habe ich nicht",
    "hab den schein nicht", "hab kein schein", "hab keinen schein",
    "keine papiere", "papiere nicht da",
    "no registration", "no vehicle document", "lost my papers"
  ];
  return patterns.some(p => t.includes(p));
}

/**
 * Ermittelt, ob die Teilinfos vollständig genug sind, um OEM zu starten.
 */
function hasSufficientPartInfo(parsed: ParsedUserMessage, orderData: any): { ok: boolean; missing: string[] } {
  const category = parsed.partCategory || orderData?.partCategory || null;
  if (!category) {
    return { ok: false, missing: ["partCategory"] };
  }

  const required = partRequiredFields[category] || [];
  const missing: string[] = [];

  for (const field of required) {
    if (field === "position") {
      const pos = parsed.position || orderData?.partPosition || null;
      if (!pos) missing.push("position");
    } else if (field === "disc_diameter") {
      const fromParsed = parsed.partDetails?.discDiameter;
      const fromOrder = orderData?.partDetails?.discDiameter;
      if (!fromParsed && !fromOrder) missing.push("disc_diameter");
    } else if (field === "suspension_type") {
      const fromParsed = parsed.partDetails?.suspensionType;
      const fromOrder = orderData?.partDetails?.suspensionType;
      if (!fromParsed && !fromOrder) missing.push("suspension_type");
    }
  }

  return { ok: missing.length === 0, missing };
}

/**
 * Baut eine Rückfrage für fehlende Fahrzeug-Felder.
 */
function buildVehicleFollowUpQuestion(missingFields: string[], lang: "de" | "en"): string | null {
  if (!missingFields || missingFields.length === 0) return null;

  const qDe: Record<string, string> = {
    make: "Welche Automarke ist es?",
    model: "Welches Modell genau?",
    year: "Welches Baujahr hat dein Fahrzeug?",
    engine: "Welche Motorisierung ist verbaut (kW oder Motorkennbuchstabe)?",
    vin: "Hast du die Fahrgestellnummer (VIN) für mich?",
    hsn: "Hast du die HSN (Feld 2.1 im Fahrzeugschein)?",
    tsn: "Hast du die TSN (Feld 2.2 im Fahrzeugschein)?"
  };

  const qEn: Record<string, string> = {
    make: "What is the brand of your car?",
    model: "What is the exact model?",
    year: "What is the model year of your car?",
    engine: "Which engine is installed (kW or engine code)?",
    vin: "Do you have the VIN (vehicle identification number)?",
    hsn: "Do you have the HSN (field 2.1 on the registration)?",
    tsn: "Do you have the TSN (field 2.2 on the registration)?"
  };

  const key = missingFields[0];

  const map = lang === "de" ? qDe : qEn;
  return map[key] || null;
}

/**
 * Baut eine Rückfrage für fehlende Teil-Felder.
 */
function buildPartFollowUpQuestion(missingFields: string[], partCategory: string | null, lang: "de" | "en"): string | null {
  if (!missingFields || missingFields.length === 0) return null;

  const field = missingFields[0];

  if (lang === "de") {
    if (field === "position") {
      return "Brauchst du das Teil vorne oder hinten? Links oder rechts?";
    }
    if (field === "disc_diameter") {
      return "Weißt du, ob du die kleinere oder größere Bremsscheibe hast (z. B. 280mm oder 300mm)? Wenn du es nicht weißt, ist das nicht schlimm – dein Händler prüft das zur Not.";
    }
    if (field === "suspension_type") {
      return "Weißt du, ob dein Fahrzeug ein Sportfahrwerk oder das Standardfahrwerk hat?";
    }
    if (field === "partCategory") {
      return "Um welches Teil geht es genau? Zum Beispiel: Bremsscheiben, Bremsbeläge, Bremssattel, Stoßdämpfer, Querlenker…";
    }
  } else {
    if (field === "position") {
      return "Do you need the part at the front or rear? Left or right side?";
    }
    if (field === "disc_diameter") {
      return "Do you know if you have the smaller or larger brake disc (e.g. 280mm or 300mm)? If you don’t know, your dealer will double-check it.";
    }
    if (field === "suspension_type") {
      return "Do you know if your car has a sport suspension or the standard suspension?";
    }
    if (field === "partCategory") {
      return "Which exact part do you need? For example: brake discs, brake pads, brake caliper, shock absorber, control arm…";
    }
  }

  return null;
}

/**
 * Merges newly parsed part info into the existing part info stored in order_data.
 * Fields are only overwritten when new values are provided.
 */
function mergePartInfo(existing: any, parsed: ParsedUserMessage) {
  const merged: any = {
    ...existing,
    partDetails: { ...(existing?.partDetails || {}) }
  };

  if (parsed.partCategory) {
    merged.partCategory = parsed.partCategory;
  }
  if (parsed.position) {
    merged.partPosition = parsed.position;
  }
  if (parsed.partDetails?.discDiameter !== undefined && parsed.partDetails?.discDiameter !== null) {
    merged.partDetails.discDiameter = parsed.partDetails.discDiameter;
  }
  if (parsed.partDetails?.suspensionType) {
    merged.partDetails.suspensionType = parsed.partDetails.suspensionType;
  }
  if (parsed.part) {
    merged.partText = merged.partText ? `${merged.partText}\n${parsed.part}` : parsed.part;
  }

  return merged;
}

async function runOemLookupAndScraping(
  orderId: string,
  language: "de" | "en" | null,
  parsed: ParsedUserMessage,
  orderData: any,
  partDescription: string | null
): Promise<{ replyText: string; nextStatus: ConversationStatus }> {
  const vehicle = await getVehicleForOrder(orderId);
  const vehicleForOem = {
    make: vehicle?.make ?? undefined,
    model: vehicle?.model ?? undefined,
    year: vehicle?.year ?? undefined,
    engine: vehicle?.engineCode ?? undefined,
    vin: vehicle?.vin ?? undefined,
    hsn: vehicle?.hsn ?? undefined,
    tsn: vehicle?.tsn ?? undefined
  };

  const missingVehicleFields = determineRequiredFields(vehicleForOem);
  if (missingVehicleFields.length > 0) {
    const q = buildVehicleFollowUpQuestion(missingVehicleFields, language ?? "de");
    return {
      replyText:
        q ||
        (language === "en"
          ? "I need a bit more vehicle info."
          : "Ich brauche noch ein paar Fahrzeugdaten."),
      nextStatus: "collect_vehicle"
    };
  }

  const partText =
    parsed.part ||
    orderData?.requestedPart ||
    orderData?.partText ||
    partDescription ||
    (language === "en" ? "the part you mentioned" : "das genannte Teil");

  try {
    const oemResult = await resolveOEM(vehicleForOem, partText);

    if (oemResult.success && oemResult.oemNumber) {
      await updateOrderOEM(orderId, {
        oemStatus: "ok",
        oemData: { oemNumber: oemResult.oemNumber }
      });

      try {
        await scrapeOffersForOrder(orderId, oemResult.oemNumber);
      } catch (err: any) {
        logger.error("Auto-scraping failed after OEM resolution", {
          error: err?.message,
          orderId,
          oemNumber: oemResult.oemNumber
        });
      }

      logger.info("OEM lookup finished in bot flow", {
        orderId,
        success: oemResult.success,
        oemNumber: oemResult.oemNumber ?? null,
        message: oemResult.message ?? null
      });

      return {
        replyText:
          language === "en"
            ? "Perfect, I’ve identified the right part for your car. I’m now checking different shops for suitable offers."
            : "Perfekt, ich habe das passende Teil für dein Fahrzeug gefunden. Ich prüfe jetzt verschiedene Shops auf passende Angebote.",
        nextStatus: "show_offers"
      };
    } else {
      await updateOrderOEM(orderId, {
        oemStatus: "error",
        oemError: oemResult.message ?? "OEM konnte nicht ermittelt werden."
      });

      return {
        replyText:
          language === "en"
            ? "I couldn't identify the right part yet. Could you share the engine code or more vehicle details?"
            : "Ich konnte das passende Teil noch nicht bestimmen. Kannst du mir den Motorkennbuchstaben oder weitere Fahrzeugdaten schicken?",
        nextStatus: "collect_vehicle"
      };
    }
  } catch (err: any) {
    logger.error("resolveOEM failed", { error: err?.message, orderId });
    return {
      replyText:
        language === "en"
          ? "A technical error occurred while finding the right part. Please send more vehicle info."
          : "Beim Finden des passenden Teils ist ein technischer Fehler aufgetreten. Bitte schick mir noch ein paar Fahrzeugdaten.",
      nextStatus: "collect_vehicle"
    };
  }
}

async function downloadImageBuffer(url: string): Promise<Buffer> {
  const resp = await fetch(url);
  if (!resp.ok) {
    throw new Error(`Failed to download image: ${resp.status} ${resp.statusText}`);
  }
  const arrayBuffer = await resp.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;

async function downloadFromTwilio(mediaUrl: string): Promise<Buffer> {
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) {
    throw new Error("Missing Twilio credentials (TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN)");
  }
  const authHeader =
    "Basic " + Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString("base64");

  const res = await fetch(mediaUrl, {
    headers: {
      Authorization: authHeader
    }
  });

  if (!res.ok) {
    throw new Error(`Failed to download image: ${res.status} ${res.statusText}`);
  }

  const arrayBuffer = await res.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

export interface VehicleOcrResult {
  make: string | null;
  model: string | null;
  vin: string | null;
  hsn: string | null;
  tsn: string | null;
  year: number | null;
  engineKw: number | null;
  fuelType: string | null;
  emissionClass: string | null;
  rawText: string;
}

async function extractVehicleDataFromImage(imageBuffer: Buffer): Promise<VehicleOcrResult> {
  const base64 = imageBuffer.toString("base64");
  const imageUrl = `data:image/jpeg;base64,${base64}`;

  const systemPrompt =
    "You are an expert OCR and data extractor for German vehicle registration documents (Zulassungsbescheinigung Teil I, old Fahrzeugschein). " +
    "Be robust to rotated, blurred, dark, skewed, partially occluded images. Always return strict JSON for the requested fields.";

  const userPrompt = `
Lies dieses Bild (deutscher Fahrzeugschein, Zulassungsbescheinigung Teil I oder altes Fahrzeugschein-Formular).
Berücksichtige:
- Bild kann gedreht (90/180°), perspektivisch verzerrt, unscharf, dunkel oder teilweise verdeckt sein.
- Erkenne Ausrichtung selbst, lies so viel Text wie möglich.
Felder, die du extrahieren sollst (wenn unsicher → null):
- make (Hersteller, Feld D.1 oder Klartext, z.B. "BMW" / "BAYER. MOT. WERKE")
- model (Typ/Handelsbezeichnung, Feld D.2/D.3, z.B. "316ti")
- vin (Fahrgestellnummer, Feld E)
- hsn (Herstellerschlüsselnummer, Feld "zu 2.1")
- tsn (Typschlüsselnummer, Feld "zu 2.2")
- year (Erstzulassung/Herstellungsjahr, Feld B, als Zahl, z.B. 2002)
- engineKw (Leistung in kW, Feld P.2)
- fuelType (Kraftstoff, Feld P.3, z.B. "Benzin", "Diesel")
- emissionClass (z.B. "EURO 4")
Gib als Ergebnis NUR folgendes JSON (ohne zusätzlichen Text) zurück:
{
  "make": "...",
  "model": "...",
  "vin": "...",
  "hsn": "...",
  "tsn": "...",
  "year": 2002,
  "engineKw": 85,
  "fuelType": "...",
  "emissionClass": "...",
  "rawText": "Vollständiger erkannter Text"
}
Fülle unbekannte Felder mit null. rawText soll den gesamten erkannten Text enthalten (oder "" falls nichts erkannt).
`;

  try {
    const resp = await client.chat.completions.create({
      model: "gpt-4.1",
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: [
            { type: "text", text: userPrompt },
            { type: "image_url", image_url: { url: imageUrl } }
          ]
        }
      ],
      temperature: 0
    });

    const content = resp.choices[0]?.message?.content ?? "";
    const parsed = safeParseVehicleJson(content);
    return parsed;
  } catch (err: any) {
    logger.error("OpenAI Vision OCR failed", { error: err?.message });
    return {
      make: null,
      model: null,
      vin: null,
      hsn: null,
      tsn: null,
      year: null,
      engineKw: null,
      fuelType: null,
      emissionClass: null,
      rawText: ""
    };
  }
}

function safeParseVehicleJson(text: string): VehicleOcrResult {
  const empty: VehicleOcrResult = {
    make: null,
    model: null,
    vin: null,
    hsn: null,
    tsn: null,
    year: null,
    engineKw: null,
    fuelType: null,
    emissionClass: null,
    rawText: ""
  };

  if (!text) return empty;

  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  const jsonString = start !== -1 && end !== -1 && end > start ? text.slice(start, end + 1) : text;

  try {
    const obj = JSON.parse(jsonString);
    return {
      make: obj.make ?? null,
      model: obj.model ?? null,
      vin: obj.vin ?? null,
      hsn: obj.hsn ?? null,
      tsn: obj.tsn ?? null,
      year: obj.year ?? null,
      engineKw: obj.engineKw ?? null,
      fuelType: obj.fuelType ?? null,
      emissionClass: obj.emissionClass ?? null,
      rawText: obj.rawText ?? ""
    };
  } catch {
    return empty;
  }
}

export interface VehicleInfoPatch {
  make?: string;
  model?: string;
  year?: number;
  vin?: string;
  hsn?: string;
  tsn?: string;
  engineKw?: number;
  fuelType?: string;
}

export type Intent = "ASK_PART" | "GIVE_VEHICLE_DATA" | "SMALLTALK" | "OTHER";

export interface NlpResult {
  intent: Intent;
  requestedPart: string | null;
  vehiclePatch: VehicleInfoPatch;
  clarificationQuestion: string | null;
}

export async function understandUserText(
  text: string,
  currentVehicle: VehicleOcrResult,
  currentOrder: { requestedPart?: string | null }
): Promise<NlpResult> {
  const system = `
Du bist ein Assistent für einen Autoteile-WhatsApp-Bot.
Aufgaben:
- Intention erkennen: ASK_PART (Nutzer fragt nach Teil), GIVE_VEHICLE_DATA (Nutzer gibt Fahrzeugdaten), SMALLTALK, OTHER.
- Fahrzeugdaten aus dem Text extrahieren (make, model, year, vin, hsn, tsn, engineKw, fuelType). Nur setzen, wenn sicher erkennbar oder explizit korrigiert.
- requestedPart füllen, falls ein Teil erwähnt wird (inkl. Positionshinweisen wie vorne/hinten/links/rechts).
- Falls unklar, clarificationQuestion setzen, sonst null.
Gib NUR eine JSON-Antwort im Format:
{
  "intent": "ASK_PART" | "GIVE_VEHICLE_DATA" | "SMALLTALK" | "OTHER",
  "requestedPart": string | null,
  "vehiclePatch": { "make": string, "model": string, "year": number, "vin": string, "hsn": string, "tsn": string, "engineKw": number, "fuelType": string },
  "clarificationQuestion": string | null
}
Fehlende/unsichere Felder: weglassen oder null. Keine freien Texte außerhalb des JSON.`;

  const user = `
Aktuelle Nachricht: """${text}"""
Bereits bekanntes Fahrzeug: ${JSON.stringify(currentVehicle)}
Bereits angefragtes Teil: ${currentOrder?.requestedPart ?? null}
Extrahiere neue Infos aus der Nachricht. Überschreibe bekannte Felder nur, wenn der Nutzer sie explizit korrigiert.`;

  try {
    const resp = await client.chat.completions.create({
      model: "gpt-4.1",
      messages: [
        { role: "system", content: system },
        { role: "user", content: user }
      ],
      temperature: 0
    });
    const content = resp.choices[0]?.message?.content ?? "";
    return safeParseNlpJson(content);
  } catch (err: any) {
    logger.error("OpenAI text understanding failed", { error: err?.message });
    return {
      intent: "OTHER",
      requestedPart: null,
      vehiclePatch: {},
      clarificationQuestion: null
    };
  }
}

function safeParseNlpJson(text: string): NlpResult {
  const empty: NlpResult = {
    intent: "OTHER",
    requestedPart: null,
    vehiclePatch: {},
    clarificationQuestion: null
  };
  if (!text) return empty;
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  const jsonString = start !== -1 && end !== -1 && end > start ? text.slice(start, end + 1) : text;
  try {
    const obj = JSON.parse(jsonString);
    return {
      intent: obj.intent ?? "OTHER",
      requestedPart: obj.requestedPart ?? null,
      vehiclePatch: obj.vehiclePatch ?? {},
      clarificationQuestion: obj.clarificationQuestion ?? null
    };
  } catch {
    return empty;
  }
}

function determineMissingVehicleFields(vehicle: any): string[] {
  const missing: string[] = [];
  if (!vehicle?.make) missing.push("make");
  if (!vehicle?.model) missing.push("model");
  const hasVin = !!vehicle?.vin;
  const hasHsnTsn = !!vehicle?.hsn && !!vehicle?.tsn;
  if (!hasVin && !hasHsnTsn) {
    missing.push("vin_or_hsn_tsn");
  }
  return missing;
}

// ------------------------------
// Schritt 1: Nutzertext analysieren (NLU via OpenAI)
// ------------------------------
export async function parseUserMessage(text: string): Promise<ParsedUserMessage> {
  const prompt = `
Du bist ein KI-Parser für einen Autoteile-Bot.

Du sollst eine KUNDENNACHRICHT analysieren und folgende Felder extrahieren:

- "intent": 
    - "request_part" → Kunde fragt nach einem Teil oder beschreibt ein Problem mit einem Fahrzeugteil
    - "give_vehicle_info" → Kunde gibt Fahrzeugdaten an (Marke, Modell, Baujahr, HSN/TSN, VIN etc.)
    - "smalltalk" → Begrüßung oder allgemeines "Hi", "Danke", "Bist du ein Bot?" etc.
    - "unknown" → alles andere

- Fahrzeuginfos (falls erkennbar):
    - "make": z.B. "BMW", "VW"
    - "model": z.B. "320d", "Golf 7"
    - "year": z.B. 2012
    - "engine": z.B. "2.0 TDI", "135kW", "N47"
    - "hsn": Herstellerschlüsselnummer
    - "tsn": Typschlüsselnummer
    - "vin": Fahrgestellnummer

- Teileinfos (falls erkennbar):
    - "part": Freitext wie der Kunde es nennt, z.B. "Bremssattel vorne links"
    - "partCategory": normalisiert, z.B.:
        - "brake_caliper"
        - "brake_disc"
        - "brake_pad"
        - "shock_absorber"
        - "control_arm"
        - "clutch"
        - etc.
    - "position": z.B. "front_left", "front_right", "front_axle", "rear_left", "rear_right", "rear_axle", "unknown"
    - "partDetails": optionales Objekt mit Details wie:
        - { "discDiameter": 300 }
        - { "suspensionType": "sport" }

- "missingVehicleInfo": Liste von Strings, welche Fahrzeugdaten fehlen, z.B. ["make","model","year","engine"]
- "missingPartInfo": Liste von Strings, welche Teilinfos fehlen, z.B. ["position","disc_diameter"]
- "smalltalkType": "greeting" | "thanks" | "bot_question" | null
- "smalltalkReply": kurze, freundliche Antwort für Smalltalk (nur setzen, wenn intent="smalltalk")

Wenn du etwas nicht sicher weißt, lass das Feld auf null.

Gib NUR folgendes JSON zurück:

{
  "intent": "...",
  "make": "...",
  "model": "...",
  "year": 2012,
  "engine": "...",
  "hsn": null,
  "tsn": null,
  "vin": null,
  "part": "...",
  "partCategory": "...",
  "position": "...",
  "partDetails": { ... },
  "missingVehicleInfo": [...],
  "missingPartInfo": [...],
  "smalltalkType": "...",
  "smalltalkReply": "..."
}

KUNDENTEXT:
${text}
`;

  try {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is not set");
    }

    const completion: any = await client.responses.create({
      model: "gpt-4.1-mini",
      input: prompt,
      text: { format: { type: "json_object" } }
    });

    const textContent =
      completion.output?.find((item: any) => item.type === "message")?.content?.find(
        (part: any) => part.type === "output_text"
      )?.text ??
      completion.output?.[0]?.content?.[0]?.text;

    if (!textContent) {
      throw new Error("Model returned no text output");
    }

    return JSON.parse(textContent) as ParsedUserMessage;
  } catch (error: any) {
    logger.error("parseUserMessage failed", { error: error?.message, text });

    // Fallback: Intent unknown
    return {
      intent: "unknown",
      missingVehicleInfo: [],
      missingPartInfo: []
    };
  }
}

// ------------------------------
// Hauptlogik – zustandsbasierter Flow
// ------------------------------
export interface BotMessagePayload {
  from: string;
  text: string;
  orderId?: string | null;
  mediaUrls?: string[];
}

// In-memory per-sender lock to reduce race conditions on concurrent messages.
const conversationLocks = new Map<string, Promise<void>>();

async function withConversationLock<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const prev = conversationLocks.get(key) ?? Promise.resolve();
  let release!: () => void;
  const current = new Promise<void>((res) => {
    release = res;
  });
  conversationLocks.set(key, prev.then(() => current));
  await prev;
  try {
    return await fn();
  } finally {
    release();
    if (conversationLocks.get(key) === current) {
      conversationLocks.delete(key);
    }
  }
}

// Helper: detect explicit language choice in the language selection step
function pickLanguageFromChoice(text: string): "de" | "en" | null {
  const t = text.toLowerCase();
  if (t.includes("1") || t.includes("deutsch")) return "de";
  if (t.includes("2") || t.includes("english")) return "en";
  return null;
}

// Helper: detect if user text contains vehicle hints (brand/model/year)
function hasVehicleHints(text: string): boolean {
  const t = text.toLowerCase();
  const brands = ["bmw", "audi", "vw", "volkswagen", "mercedes", "benz", "ford", "opel", "skoda", "seat", "toyota", "honda", "hyundai", "kia"];
  const yearPattern = /\b(19|20)\d{2}\b/;
  return brands.some((b) => t.includes(b)) || yearPattern.test(t);
}

// Sanitizes free text to avoid control chars and overly long inputs.
function sanitizeText(input: string, maxLen = 500): string {
  if (!input) return "";
  const trimmed = input.trim().slice(0, maxLen);
  return trimmed.replace(/[\u0000-\u001F\u007F]/g, " ");
}

// ------------------------------
// Hauptlogik – zustandsbasierter Flow
// ------------------------------
export async function handleIncomingBotMessage(
  payload: BotMessagePayload
): Promise<{ reply: string; orderId: string }> {
  return withConversationLock(payload.from, async () => {
    const userText = sanitizeText(payload.text || "", 1000);
    const hasVehicleImage = Array.isArray(payload.mediaUrls) && payload.mediaUrls.length > 0;
    const vehicleImageNote =
      hasVehicleImage && payload.mediaUrls
        ? payload.mediaUrls.map((url, idx) => `[REGISTRATION_IMAGE_${idx + 1}]: ${url}`).join("\n")
        : null;

    // Order laden oder erstellen
    const order = await findOrCreateOrder(payload.from, payload.orderId ?? null);
    logger.info("BotFlow start", {
      from: payload.from,
      orderId: order.id,
      text: userText,
      status: order.status
    });
    let language: "de" | "en" | null = order.language ?? null;
    let languageChanged = false;

    // Nur wenn noch keine Sprache gespeichert ist, heuristisch ermitteln und speichern
    if (!language) {
      const detectedLang = detectLanguageSelection(userText) ?? detectLanguageFromText(userText);
      if (detectedLang) {
        language = detectedLang;
        languageChanged = true;
        try {
          await updateOrder(order.id, { language });
          logger.info("Language detected and stored", { orderId: order.id, language });
        } catch (err: any) {
          logger.error("Failed to persist detected language", { error: err?.message, orderId: order.id });
        }
      }
    }
    let nextStatus: ConversationStatus = order.status || "choose_language";
    let vehicleDescription = order.vehicle_description;
    let partDescription = order.part_description;
    // Lade vorhandenes order_data, um kumulativ zu arbeiten
    let orderData: any = {};
    try {
      const fullOrder = await getOrderById(order.id);
      orderData = fullOrder?.orderData || {};
    } catch (err: any) {
      logger.error("Failed to fetch order_data", { error: err?.message, orderId: order.id });
    }

    // Nachricht loggen (best effort)
    try {
      await insertMessage({
        orderId: order.id,
        direction: "incoming",
        channel: "whatsapp",
        fromIdentifier: payload.from,
        toIdentifier: null,
        content: userText,
        rawPayload: { from: payload.from, mediaUrls: payload.mediaUrls || [] }
      });
    } catch (err: any) {
      logger.error("Failed to log incoming message", { error: err?.message, orderId: order.id });
    }

    // parseUserMessage für Intent/NLU
    let parsed: ParsedUserMessage = { intent: "unknown" };
    try {
      parsed = await parseUserMessage(userText);
    } catch (err: any) {
      logger.error("parseUserMessage failed", { error: err?.message });
    }

    // requestedPart aus Usertext merken und persistieren
    const requestedPart = parsed.part?.trim();
    if (requestedPart) {
      try {
        await updateOrderData(order.id, { requestedPart });
        orderData = { ...orderData, requestedPart };
      } catch (err: any) {
        logger.error("Failed to persist requestedPart", { error: err?.message, orderId: order.id });
      }
      partDescription = partDescription ? `${partDescription}\n${requestedPart}` : requestedPart;
    }

    // Allgemeine Fragen (General QA)
    if (parsed.intent === "general_question") {
      const currentVehicle = await getVehicleForOrder(order.id);
      const knownVehicleSummary = JSON.stringify(currentVehicle ?? {});
      const lang = language ?? detectLanguageFromText(userText) ?? "de";
      const reply = await answerGeneralQuestion({
        userText,
        language: lang,
        missingVehicleInfo: parsed.missingVehicleInfo ?? [],
        knownVehicleSummary
      });
      return { reply, orderId: order.id };
    }

    // Smalltalk: Antworten, State unverändert
    if (parsed.intent === "smalltalk") {
      const lang = language ?? detectLanguageFromText(userText) ?? "de";

      if (!language && lang) {
        language = lang;
        languageChanged = true;
        try {
          await updateOrder(order.id, { language });
        } catch (err: any) {
          logger.error("Failed to persist language on smalltalk", { error: err?.message, orderId: order.id });
        }
      }

      let reply =
        parsed.smalltalkReply ||
        (lang === "en"
          ? "Hi! How can I help you with your car parts today?"
          : "Hi! Wie kann ich dir heute bei Autoteilen helfen?");

      if (nextStatus === "collect_vehicle") {
        reply += lang === "en"
          ? " I still need your vehicle details (registration photo or make/model/year)."
          : " Ich brauche noch deine Fahrzeugdetails (Fahrzeugschein oder Marke/Modell/Baujahr).";
      } else if (nextStatus === "collect_part") {
        reply += lang === "en"
          ? " Tell me which part you need and where (front/rear, left/right)."
          : " Sag mir bitte, welches Teil du brauchst und wo (vorne/hinten, links/rechts).";
      }

      return { reply, orderId: order.id };
    }

    let replyText = "";

    switch (nextStatus) {
      case "choose_language": {
        // Wenn bereits Sprache gesetzt ist, nicht erneut fragen
        if (language) {
          nextStatus = "collect_vehicle";
          replyText =
            language === "en"
              ? "Hello and welcome! Please send a photo of your registration document, or tell me VIN/HSN/TSN, or at least make/model/year."
              : "Hallo und willkommen! Bitte sende ein Foto deines Fahrzeugscheins oder nenne VIN/HSN/TSN oder mindestens Marke/Modell/Baujahr.";
          break;
        }

        const chosen = pickLanguageFromChoice(userText) ?? detectLanguageFromText(userText);
        if (chosen) {
          language = chosen;
          languageChanged = true;
          try {
            await updateOrder(order.id, { language });
          } catch (err: any) {
            logger.error("Failed to persist chosen language", { error: err?.message, orderId: order.id });
          }
          nextStatus = "collect_vehicle";
          replyText =
            language === "en"
              ? "Hello and welcome! Please send a photo of your registration document, or tell me VIN/HSN/TSN, or at least make/model/year."
              : "Hallo und willkommen! Bitte sende ein Foto deines Fahrzeugscheins oder nenne VIN/HSN/TSN oder mindestens Marke/Modell/Baujahr.";
        } else {
          replyText =
            "Hallo und willkommen! Bitte wähle 1 für Deutsch oder 2 for English.\nHello and welcome! Please choose 1 for German or 2 for English.";
        }
        break;
      }

      case "collect_vehicle": {
        // Bild zählt als Fahrzeugschein
        if (hasVehicleImage) {
          const note = vehicleImageNote || "";
          vehicleDescription = vehicleDescription ? `${vehicleDescription}\n${note}` : note;
          let anyBufferDownloaded = false;
          let ocrSucceeded = false;
          try {
            const buffers: Buffer[] = [];
            for (const url of payload.mediaUrls ?? []) {
              try {
                const buf = await downloadFromTwilio(url);
                buffers.push(buf);
                anyBufferDownloaded = true;
              } catch (err: any) {
                logger.error("Failed to download vehicle image", { error: err?.message, orderId: order.id });
              }
            }

            if (buffers.length > 0) {
              const ocr = await extractVehicleDataFromImage(buffers[0]);
              logger.info("Vehicle OCR result", { orderId: order.id, ocr });
              ocrSucceeded = true;

              await upsertVehicleForOrderFromPartial(order.id, {
                make: ocr.make ?? null,
                model: ocr.model ?? null,
                year: ocr.year ?? null,
                engineCode: null,
                vin: ocr.vin ?? null,
                hsn: ocr.hsn ?? null,
                tsn: ocr.tsn ?? null
              });

              try {
                await updateOrderData(order.id, { vehicleOcrRawText: ocr.rawText ?? "" });
              } catch (err: any) {
                logger.error("Failed to store vehicle OCR raw text", { error: err?.message, orderId: order.id });
              }
            }
          } catch (err: any) {
            logger.error("Vehicle OCR failed", { error: err?.message, orderId: order.id });
          }

          if (!anyBufferDownloaded) {
            replyText =
              language === "en"
                ? "I couldn’t load your registration photo. Please type your make, model, year, and VIN/HSN/TSN."
                : "Ich konnte dein Fahrzeugschein-Foto nicht laden. Bitte schreib mir Marke, Modell, Baujahr und VIN/HSN/TSN.";
            nextStatus = "collect_vehicle";
            break;
          }

          // Nach OCR prüfen, ob genug Daten für OEM vorhanden sind
          const vehicle = await getVehicleForOrder(order.id);
          const missingFields = determineMissingVehicleFields(vehicle);
          const partTextFromOrder =
            orderData?.partText ||
            orderData?.requestedPart ||
            partDescription ||
            parsed.part ||
            null;

          if (missingFields.length === 0 && partTextFromOrder) {
            const oemFlow = await runOemLookupAndScraping(
              order.id,
              language ?? "de",
              { ...parsed, part: partTextFromOrder },
              orderData,
              partDescription ?? null
            );
            replyText = oemFlow.replyText;
            nextStatus = oemFlow.nextStatus;
          } else if (missingFields.length === 0) {
            nextStatus = "collect_part";
            replyText =
              language === "en"
                ? "Got the vehicle document. Which part do you need? Please include position (front/rear, left/right) and any symptoms."
                : "Fahrzeugschein verarbeitet. Welches Teil brauchst du? Bitte Position (vorne/hinten, links/rechts) und Symptome nennen.";
          } else {
            // gezielte Rückfrage
            const field = missingFields[0];
            if (field === "vin_or_hsn_tsn") {
              replyText =
                language === "en"
                  ? "I couldn’t read VIN or HSN/TSN. Please send those numbers or a clearer photo."
                  : "Ich konnte VIN oder HSN/TSN nicht sicher erkennen. Bitte schick mir die Nummern oder ein schärferes Foto.";
            } else if (field === "make") {
              replyText = language === "en" ? "Which car brand is it?" : "Welche Automarke ist es?";
            } else if (field === "model") {
              replyText = language === "en" ? "Which exact model is it?" : "Welches Modell genau?";
            } else {
              replyText =
                language === "en"
                  ? "Please share VIN or HSN/TSN, or at least make/model/year, so I can identify your car."
                  : "Bitte nenne mir VIN oder HSN/TSN oder mindestens Marke/Modell/Baujahr, damit ich dein Auto identifizieren kann.";
            }
            nextStatus = "collect_vehicle";
          }

          break;
        }

        // Fahrzeugdaten speichern (kumulativ)
        logger.info("Vehicle partial from parsed message", {
          orderId: order.id,
          partial: {
            make: parsed.make ?? null,
            model: parsed.model ?? null,
            year: parsed.year ?? null,
            engineCode: parsed.engine ?? null,
            vin: parsed.vin ?? null,
            hsn: parsed.hsn ?? null,
            tsn: parsed.tsn ?? null
          }
        });
        await upsertVehicleForOrderFromPartial(order.id, {
          make: parsed.make ?? null,
          model: parsed.model ?? null,
          year: parsed.year ?? null,
          engineCode: parsed.engine ?? null,
          vin: parsed.vin ?? null,
          hsn: parsed.hsn ?? null,
          tsn: parsed.tsn ?? null
        });

        // Kumuliertes Fahrzeug aus DB holen und Pflichtfelder prüfen
        const vehicle = await getVehicleForOrder(order.id);
        logger.info("Vehicle after upsert", { orderId: order.id, vehicle });
        const missingVehicleFields = determineRequiredFields({
          make: vehicle?.make,
          model: vehicle?.model,
          year: vehicle?.year,
          engine: vehicle?.engineCode,
          vin: vehicle?.vin,
          hsn: vehicle?.hsn,
          tsn: vehicle?.tsn
        });

        if (missingVehicleFields.length > 0) {
          const q = buildVehicleFollowUpQuestion(missingVehicleFields, language ?? "de");
          replyText =
            q ||
            (language === "en"
              ? "Please share VIN or HSN/TSN, or at least make/model/year, so I can identify your car."
              : "Bitte nenne mir VIN oder HSN/TSN oder mindestens Marke/Modell/Baujahr, damit ich dein Auto identifizieren kann.");
          nextStatus = "collect_vehicle";
        } else {
          nextStatus = "collect_part";
          replyText =
            language === "en"
              ? "Thanks, I have enough vehicle info. Which part do you need? Please include position (front/rear, left/right) and any symptoms."
              : "Danke, ich habe genug Fahrzeugdaten. Welches Teil brauchst du? Bitte Position (vorne/hinten, links/rechts) und Symptome nennen.";
        }
        break;
      }

      case "collect_part": {
        // Teileinfos kumulativ aus order_data + neuer Nachricht mergen
        const existingPartInfo = {
          partCategory: orderData?.partCategory ?? null,
          partPosition: orderData?.partPosition ?? null,
          partDetails: orderData?.partDetails ?? {},
          partText: orderData?.partText ?? null
        };

        const mergedPartInfo = mergePartInfo(existingPartInfo, parsed);
        partDescription = partDescription ? `${partDescription}\n${userText}` : userText;

        // persistierte order_data aktualisieren
        try {
          await updateOrderData(order.id, {
            partCategory: mergedPartInfo.partCategory ?? null,
            partPosition: mergedPartInfo.partPosition ?? null,
            partDetails: mergedPartInfo.partDetails ?? {},
            partText: mergedPartInfo.partText ?? null,
            requestedPart: mergedPartInfo.partText ?? orderData?.requestedPart ?? null
          });
          orderData = { ...orderData, ...mergedPartInfo };
        } catch (err: any) {
          logger.error("Failed to update order_data with part info", { error: err?.message, orderId: order.id });
        }

        const suff = hasSufficientPartInfo(parsed, orderData);

        if (!suff.ok) {
          const q = buildPartFollowUpQuestion(
            suff.missing,
            mergedPartInfo.partCategory ?? parsed.partCategory ?? null,
            language ?? "de"
          );
          replyText =
            q ||
            (language === "en"
              ? "Please describe the exact part you need, the position (front/rear, left/right), and any symptoms or a part number if you have one."
              : "Bitte beschreibe genau, welches Teil du brauchst, die Position (vorne/hinten, links/rechts) und eventuelle Symptome oder eine Teilenummer, falls vorhanden.");
          nextStatus = "collect_part";
        } else {
          const partText =
            mergedPartInfo.partText ||
            parsed.part ||
            (partDescription || "").trim() ||
            (language === "en" ? "the part you mentioned" : "das genannte Teil");
          logger.info("Conversation state", {
            orderId: order.id,
            prevStatus: order.status,
            nextStatus: "oem_lookup",
            language
          });
          const oemFlow = await runOemLookupAndScraping(
            order.id,
            language ?? "de",
            { ...parsed, part: partText },
            orderData,
            partDescription ?? null
          );
          replyText = oemFlow.replyText;
          nextStatus = oemFlow.nextStatus;
        }
        break;
      }

      case "oem_lookup": {
        const oemFlow = await runOemLookupAndScraping(
          order.id,
          language ?? "de",
          parsed,
          orderData,
          partDescription ?? null
        );
        replyText = oemFlow.replyText;
        nextStatus = oemFlow.nextStatus;
        break;
      }

      case "show_offers": {
        try {
          const offers = await listShopOffersByOrderId(order.id);
          const sorted = (offers ?? []).slice().sort((a, b) => {
            const pa = a.price ?? Number.POSITIVE_INFINITY;
            const pb = b.price ?? Number.POSITIVE_INFINITY;
            return pa - pb;
          });

          logger.info("Show offers", { orderId: order.id, offersCount: sorted.length });
          if (!sorted || sorted.length === 0) {
            replyText =
              language === "en"
                ? "I’m still collecting offers for you. You’ll get a selection shortly."
                : "Ich suche noch passende Angebote. Du bekommst gleich eine Auswahl.";
            nextStatus = "show_offers";
            break;
          }

          if (sorted.length === 1) {
            const offer = sorted[0];
            const delivery = offer.deliveryTimeDays ?? (language === "en" ? "n/a" : "k.A.");
            replyText =
              language === "en"
                ? `I’ve found a suitable offer:\n\nBrand: ${offer.brand ?? "n/a"}\nShop: ${offer.shopName}\nPrice: ${offer.price} ${offer.currency}\nDelivery time: ${delivery} days.\n\nIf this works for you, please reply with "Yes" or "OK".`
                : `Ich habe ein passendes Angebot gefunden:\n\nMarke: ${offer.brand ?? "unbekannt"}\nShop: ${offer.shopName}\nPreis: ${offer.price} ${offer.currency}\nLieferzeit: ${delivery} Tage.\n\nWenn das für dich passt, antworte bitte mit "Ja" oder "OK".`;

            try {
              await updateOrderData(order.id, {
                selectedOfferCandidateId: offer.id
              });
              orderData = { ...orderData, selectedOfferCandidateId: offer.id };
            } catch (err: any) {
              logger.error("Failed to store selectedOfferCandidateId", { error: err?.message, orderId: order.id });
            }

            logger.info("Offer options sent to user", {
              orderId: order.id,
              optionIds: [offer.id],
              optionShops: [offer.shopName],
              nextStatus: "await_offer_confirmation"
            });
            nextStatus = "await_offer_confirmation";
            break;
          }

          const top = sorted.slice(0, 3);
          const lines =
            language === "en"
              ? top.map(
                  (o, idx) =>
                    `${idx + 1}) ${o.brand ?? "n/a"} at ${o.shopName}, ${o.price} ${o.currency}, delivery about ${
                      o.deliveryTimeDays ?? "n/a"
                    } days`
                )
              : top.map(
                  (o, idx) =>
                    `${idx + 1}) ${o.brand ?? "k.A."} bei ${o.shopName}, ${o.price} ${o.currency}, Lieferung ca. ${
                      o.deliveryTimeDays ?? "k.A."
                    } Tage`
                );

          replyText =
            language === "en"
              ? "I found some offers. Please choose one:\n\n" +
                lines.join("\n") +
                "\n\nReply with 1, 2 or 3."
              : "Ich habe passende Angebote gefunden. Bitte wähle eines:\n\n" +
                lines.join("\n") +
                "\n\nAntworte einfach mit 1, 2 oder 3.";

          try {
            await updateOrderData(order.id, {
              offerChoiceIds: top.map((o) => o.id)
            });
            orderData = { ...orderData, offerChoiceIds: top.map((o) => o.id) };
          } catch (err: any) {
            logger.error("Failed to store offerChoiceIds", { error: err?.message, orderId: order.id });
          }

          logger.info("Offer options sent to user", {
            orderId: order.id,
            optionIds: top.map((o) => o.id),
            optionShops: top.map((o) => o.shopName),
            nextStatus: "await_offer_choice"
          });
          nextStatus = "await_offer_choice";
        } catch (err: any) {
          logger.error("Fetching offers failed", { error: err?.message, orderId: order.id });
          replyText =
            language === "en"
              ? "I couldn't retrieve offers right now. I'll update you soon."
              : "Ich konnte gerade keine Angebote abrufen. Ich melde mich bald erneut.";
          nextStatus = "show_offers";
        }
        break;
      }

      case "await_offer_choice": {
        const t = (userText || "").trim().toLowerCase();
        let choiceIndex: number | null = null;
        if (t.includes("1")) choiceIndex = 0;
        else if (t.includes("2")) choiceIndex = 1;
        else if (t.includes("3")) choiceIndex = 2;
        logger.info("User offer choice message", { orderId: order.id, text: userText });

        const choiceIds: string[] | undefined = orderData?.offerChoiceIds;
        if (choiceIndex === null || !choiceIds || choiceIndex < 0 || choiceIndex >= choiceIds.length) {
          replyText =
            language === "en"
              ? 'Please reply with 1, 2 or 3 to pick one of the offers.'
              : 'Bitte antworte mit 1, 2 oder 3, um ein Angebot auszuwählen.';
          nextStatus = "await_offer_choice";
          break;
        }

        const chosenOfferId = choiceIds[choiceIndex];
        const offers = await listShopOffersByOrderId(order.id);
        const chosen = offers.find((o) => o.id === chosenOfferId);
        if (!chosen) {
          replyText =
            language === "en"
              ? "I couldn’t match your choice. I’ll show the offers again."
              : "Ich konnte deine Auswahl nicht zuordnen. Ich zeige dir die Angebote gleich erneut.";
          nextStatus = "show_offers";
          break;
        }

        try {
          await updateOrderData(order.id, {
            selectedOfferId: chosen.id,
            selectedOfferSummary: {
              shopName: chosen.shopName,
              brand: chosen.brand,
              price: chosen.price,
              currency: chosen.currency,
              deliveryTimeDays: chosen.deliveryTimeDays
            }
          });
          await updateOrderStatus(order.id, "ready");
        } catch (err: any) {
          logger.error("Failed to store selected offer", { error: err?.message, orderId: order.id, chosenOfferId });
        }

        logger.info("User selected offer", {
          orderId: order.id,
          choiceIndex,
          chosenOfferId: chosen.id,
          chosenShop: chosen.shopName,
          price: chosen.price
        });
        replyText =
          language === "en"
            ? `Thank you! Your order (${order.id}) has been saved with the offer from ${chosen.shopName} (${chosen.brand ?? "n/a"}, ${chosen.price} ${chosen.currency}). Your dealer can now see this in the system.`
            : `Vielen Dank! Deine Bestellung (${order.id}) wurde mit dem Angebot von ${chosen.shopName} (${chosen.brand ?? "k.A."}, ${chosen.price} ${chosen.currency}) gespeichert. Dein Händler sieht diese Auswahl jetzt im System.`;
        nextStatus = "done";
        break;
      }

      case "await_offer_confirmation": {
        const t = (userText || "").trim().toLowerCase();
        const isYes = ["ja", "okay", "ok", "passt", "yes", "yep", "okey"].some((w) => t.includes(w));
        const isNo = ["nein", "no", "nicht", "anders"].some((w) => t.includes(w));
        const candidateId = orderData?.selectedOfferCandidateId as string | undefined;
        logger.info("User offer confirmation", {
          orderId: order.id,
          text: userText,
          isYes,
          isNo,
          candidateOfferId: candidateId
        });

        if (!isYes && !isNo) {
          replyText =
            language === "en"
              ? 'If this offer works for you, please reply with "Yes" or "OK". If not, tell me what matters most (price, brand, delivery time).'
              : 'Wenn das Angebot für dich passt, antworte bitte mit "Ja" oder "OK". Wenn nicht, sag mir kurz, was dir wichtig ist (z.B. Preis, Marke oder Lieferzeit).';
          nextStatus = "await_offer_confirmation";
          break;
        }

        if (isNo) {
          replyText =
            language === "en"
              ? "Got it, I’ll see if I can find alternative offers. Tell me what matters most: price, brand or delivery time."
              : "Alles klar, ich schaue, ob ich dir noch andere Angebote finden kann. Sag mir gerne, was dir wichtiger ist: Preis, Marke oder Lieferzeit.";
          nextStatus = "show_offers";
          break;
        }

        if (!candidateId) {
          replyText =
            language === "en"
              ? "I lost track of the offer. I’ll fetch the options again."
              : "Ich habe das Angebot nicht mehr parat. Ich hole die Optionen nochmal.";
          nextStatus = "show_offers";
          break;
        }

        const offers = await listShopOffersByOrderId(order.id);
        const chosen = offers.find((o) => o.id === candidateId);
        if (!chosen) {
          replyText =
            language === "en"
              ? "I couldn’t find that offer anymore. I’ll show available offers again."
              : "Ich konnte dieses Angebot nicht mehr finden. Ich zeige dir die verfügbaren Angebote erneut.";
          nextStatus = "show_offers";
          break;
        }

        try {
          await updateOrderData(order.id, {
            selectedOfferId: chosen.id,
            selectedOfferSummary: {
              shopName: chosen.shopName,
              brand: chosen.brand,
              price: chosen.price,
              currency: chosen.currency,
              deliveryTimeDays: chosen.deliveryTimeDays
            }
          });
          await updateOrderStatus(order.id, "ready");
        } catch (err: any) {
          logger.error("Failed to store confirmed offer", { error: err?.message, orderId: order.id, candidateId });
        }

        logger.info("Offer selection stored", {
          orderId: order.id,
          selectedOfferId: chosen.id,
          statusUpdatedTo: "ready"
        });
        replyText =
          language === "en"
            ? `Perfect, I’ve saved this offer for you as order ${order.id}. Your dealer can now see that you selected this product.`
            : `Perfekt, ich habe dieses Angebot für dich als Bestellung ${order.id} gespeichert. Dein Händler sieht jetzt, dass du dieses Produkt ausgewählt hast.`;
        nextStatus = "done";
        break;
      }

      case "done": {
        replyText =
          language === "en"
            ? "Do you want to start a new request for another vehicle or part?"
            : "Möchtest du eine neue Anfrage für ein weiteres Fahrzeug oder Teil starten?";
        nextStatus = "choose_language";
        language = null;
        break;
      }

      default: {
        // Unerwarteter Zustand: sauber neustarten
        nextStatus = "choose_language";
        language = null;
        replyText =
          "Es ist ein interner Fehler im Status aufgetreten. Lass uns neu starten: Bitte wähle 1 für Deutsch oder 2 for English.\nThere was an internal state error. Let’s restart: please choose 1 for German or 2 for English.";
      }
    }

    // Fallback, falls keine Antwort gesetzt wurde
    if (!replyText) {
      replyText =
        (language ?? "de") === "en"
          ? "I'm working on your request. I'll update you soon."
          : "Ich arbeite an deiner Anfrage und melde mich gleich.";
    }

    const vehicleDescToSave = hasVehicleImage
      ? vehicleDescription
        ? `${vehicleDescription}\n${vehicleImageNote ?? ""}`
        : vehicleImageNote ?? ""
      : vehicleDescription || "";

    // State + Daten speichern
    try {
      await updateOrder(order.id, {
        status: nextStatus,
        language,
        vehicle_description: vehicleDescToSave || null,
        part_description: partDescription ?? null
      });
    } catch (err: any) {
      logger.error("Failed to update order in handleIncomingBotMessage", {
        error: err?.message,
        orderId: order.id
      });
    }

    return { reply: replyText, orderId: order.id };
  });
}
