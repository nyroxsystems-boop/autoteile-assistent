import OpenAI from "openai";
import type {
  ResponseOutputMessage,
  ResponseOutputText
} from "openai/resources/responses/responses";
import type { Order } from "../types/models";
import {
  insertMessage,
  getOrderById,
  insertOrder,
  upsertVehicleForOrderFromPartial,
  getVehicleForOrder,
  updateOrderStatus,
  updateOrderData,
  listShopOffersByOrderId,
  updateOrderLanguage
} from "./supabaseService";
import { resolveOEM } from "./oemService";
import { scrapeOffersForOrder } from "./scrapingService";
import { determineRequiredFields } from "./oemRequiredFieldsService";
import { logger } from "../utils/logger";

// KI-Client für NLU
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || ""
});

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

    const completion = await client.responses.create({
      model: "gpt-4.1-mini",
      input: prompt,
      text: { format: { type: "json_object" } }
    });

    const message = completion.output.find(
      (item): item is ResponseOutputMessage => item.type === "message"
    );

    const textContent = message?.content.find(
      (part): part is ResponseOutputText => part.type === "output_text"
    )?.text;

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
export async function handleIncomingBotMessage(
  orderId: string | null,
  from: string,
  text: string
): Promise<{ reply: string; orderId: string }> {

  let order: Order | null = null;

  try {
    // 1. Order holen oder neu erstellen
    if (orderId) {
      order = await getOrderById(orderId);
    }
    if (!order) {
      order = await insertOrder({
        customerName: null,
        customerContact: from,
        requestedPartName: text,
        vehicleId: null
      });
    }

    // 2. Eingehende Nachricht speichern
    try {
      await insertMessage({
        orderId: order.id,
        direction: "incoming",
        channel: "whatsapp",
        fromIdentifier: from,
        toIdentifier: null,
        content: text,
        rawPayload: { simulated: true }
      });
    } catch (dbErr: any) {
      logger.error("Failed to store incoming bot message", {
        error: dbErr?.message,
        orderId: order.id
      });
      // Continue flow even if logging fails
    }

    const orderData = order.orderData || {};
    let stage: string | null = orderData.stage || null;
    const guessedLang = detectLanguageFromText(text);
    let lang: "de" | "en" = (order.language as "de" | "en") || guessedLang || "de";

    const smalltalkType = detectSmalltalk(text);

    if (smalltalkType && !order.language) {
      await updateOrderData(order.id, {
        stage: "awaiting_language"
      });

      const reply =
        "Hallo! 👋 / Hi there! 👋\n" +
        "Bitte wähle deine Sprache:\n" +
        "1️⃣ Deutsch\n" +
        "2️⃣ English\n\n" +
        "Please choose your language:\n" +
        "1️⃣ German\n" +
        "2️⃣ English";

      return { reply, orderId: order.id };
    }

    if (smalltalkType && lang) {
      const reply = buildSmalltalkReply(smalltalkType, lang, stage);
      return { reply, orderId: order.id };
    }

    // ---------------------------
    // 2a. Sprache wählen
    // ---------------------------
    if (!order.language) {
      const selected = detectLanguageSelection(text);

      if (!selected) {
        // Noch keine Sprache erkannt → Sprachauswahl senden
        await updateOrderData(order.id, {
          stage: "awaiting_language"
        });

        const reply =
          "Bitte wähle deine Sprache:\n" +
          "1️⃣ Deutsch\n" +
          "2️⃣ English\n\n" +
          "Please choose your language:\n" +
          "1️⃣ German\n" +
          "2️⃣ English";

        return { reply, orderId: order.id };
      }

      // Sprache erkannt → speichern
      lang = selected;
      await updateOrderLanguage(order.id, selected);
      await updateOrderData(order.id, {
        language: selected,
        stage: "awaiting_vehicle_document"
      });

      const replyDe =
        "Alles klar, wir machen auf Deutsch weiter.\n\n" +
        "Bitte schick mir jetzt zuerst ein gut lesbares Foto von deinem Fahrzeugschein (Zulassungsbescheinigung Teil 1).\n" +
        "Wenn möglich, schick zusätzlich ein Foto von dem Teil oder der Stelle am Auto, um die es geht.";

      const replyEn =
        "Great, we will continue in English.\n\n" +
        "Please send me a clear photo of your vehicle registration document.\n" +
        "If possible, also send a photo of the part or the area on the car you need help with.";

      return {
        reply: selected === "de" ? replyDe : replyEn,
        orderId: order.id
      };
    }

    // Ab hier ist language gesetzt
    lang = (order.language as "de" | "en") || "de";
    stage = orderData.stage || "awaiting_vehicle_document";

    // ---------------------------
    // 2b. Fahrzeugschein-Phase
    // ---------------------------
    if (stage === "awaiting_vehicle_document" && !orderData.vehicleDocumentReceived) {
      // Kunde sagt explizit, dass er keinen Fahrzeugschein hat → Fallback auf Text-Fahrzeugdaten
      if (detectNoVehicleDocument(text)) {
        await updateOrderData(order.id, {
          stage: "collecting_vehicle_data"
        });

        const replyDe =
          "Kein Problem 👍\n" +
          "Dann machen wir es so:\n" +
          "Schreib mir bitte:\n" +
          "– Marke (z. B. BMW)\n" +
          "– Modell (z. B. 320d Touring)\n" +
          "– Baujahr\n" +
          "– wenn möglich: Motor / kW oder HSN/TSN.";

        const replyEn =
          "No problem 👍\n" +
          "Then let's do it like this:\n" +
          "Please tell me:\n" +
          "- Brand (e.g. BMW)\n" +
          "- Model (e.g. 320d Touring)\n" +
          "- Year\n" +
          "- if possible: engine / kW or HSN/TSN.";

        return {
          reply: lang === "de" ? replyDe : replyEn,
          orderId: order.id
        };
      }

      // Sonst weiter freundlich nach Fahrzeugschein + Bild fragen
      const reminderDe =
        "Bitte schick mir zuerst ein Foto von deinem Fahrzeugschein " +
        "und, wenn möglich, ein Foto von dem Teil oder der Stelle am Auto, um die es geht.";

      const reminderEn =
        "Please first send a photo of your vehicle registration document " +
        "and, if possible, a photo of the part or the area on the car you need help with.";

      return {
        reply: lang === "de" ? reminderDe : reminderEn,
        orderId: order.id
      };
    }

    // Falls extern (Media-Webhook) bereits vehicleDocumentReceived gesetzt hat:
    if (stage === "awaiting_vehicle_document" && orderData.vehicleDocumentReceived) {
      // Wir können zur Teilephase wechseln
      stage = "collecting_part_data";
      await updateOrderData(order.id, { stage });
    }

    // ---------------------------
    // 3. Nachricht parsen (NLU)
    // ---------------------------
    const parsed = await parseUserMessage(text);

    if (parsed.intent === "smalltalk") {
      const reply = parsed.smalltalkReply || buildSmalltalkReply(parsed.smalltalkType ?? "greeting", lang, stage);
      return { reply, orderId: order.id };
    }

    // 4. Fahrzeugdaten aus Text speichern/aktualisieren (auch fallback)
    await upsertVehicleForOrderFromPartial(order.id, {
      make: parsed.make ?? null,
      model: parsed.model ?? null,
      year: parsed.year ?? null,
      engineCode: parsed.engine ?? null,
      vin: parsed.vin ?? null,
      hsn: parsed.hsn ?? null,
      tsn: parsed.tsn ?? null
    });

    const vehicle = await getVehicleForOrder(order.id);
    const vehicleForOem = {
      make: vehicle?.make ?? parsed.make ?? undefined,
      model: vehicle?.model ?? parsed.model ?? undefined,
      year: vehicle?.year ?? parsed.year ?? undefined,
      engine: vehicle?.engineCode ?? parsed.engine ?? undefined,
      vin: vehicle?.vin ?? parsed.vin ?? undefined,
      hsn: vehicle?.hsn ?? parsed.hsn ?? undefined,
      tsn: vehicle?.tsn ?? parsed.tsn ?? undefined
    };

    // ---------------------------
    // 4a. vehicle-data collecting fallback
    // ---------------------------
    if (stage === "collecting_vehicle_data") {
      const missingVehicleFields = determineRequiredFields(vehicleForOem);

      if (missingVehicleFields.length > 0) {
        const question = buildVehicleFollowUpQuestion(missingVehicleFields, lang);
        if (question) {
          await updateOrderData(order.id, {
            stage: "collecting_vehicle_data",
            pendingVehicleFields: missingVehicleFields,
            lastQuestionKey: missingVehicleFields[0]
          });
          return {
            reply: question,
            orderId: order.id
          };
        }
      }

      // Fahrzeugdaten jetzt ausreichend → weiter zur Teilephase
      stage = "collecting_part_data";
      await updateOrderData(order.id, {
        stage: "collecting_part_data",
        pendingVehicleFields: []
      });
    }

    // ---------------------------
    // 4b. Teilephase: collecting_part_data
    // ---------------------------
    if (stage === "collecting_part_data") {
      // Merge Teil-Infos mit evtl. bereits erkanntem Bild-Guesst (imagePartGuess aus order_data)
      const partCategory =
        parsed.partCategory ||
        orderData.partCategory ||
        orderData.imagePartGuess?.partCategory ||
        null;

      const position =
        parsed.position ||
        orderData.partPosition ||
        orderData.imagePartGuess?.position ||
        null;

      const mergedPartDetails = {
        ...(orderData.partDetails || {}),
        ...(parsed.partDetails || {})
      };

      // Prüfen, ob wir genug Teilinfos haben
      const suff = hasSufficientPartInfo(
        {
          ...parsed,
          partCategory,
          position,
          partDetails: mergedPartDetails
        },
        orderData
      );

      if (!suff.ok) {
        const question = buildPartFollowUpQuestion(suff.missing, partCategory, lang);
        if (question) {
          await updateOrderData(order.id, {
            stage: "collecting_part_data",
            partCategory,
            partPosition: position,
            partDetails: mergedPartDetails,
            pendingPartFields: suff.missing,
            lastQuestionKey: suff.missing[0]
          });

          return {
            reply: question,
            orderId: order.id
          };
        }
      }

      // Teilinfos ausreichend → Teilzustand in order_data speichern
      await updateOrderData(order.id, {
        stage: "processing",
        partCategory,
        partPosition: position,
        partDetails: mergedPartDetails
      });

      stage = "processing";
    }

    // ---------------------------
    // 5. OEM + Scraping nur wenn wir in "processing" sind
    // ---------------------------
    if (stage === "processing") {
      await updateOrderStatus(order.id, "processing");

      // Sicherheit: Fahrzeugdaten prüfen
      const missingVehicleFields = determineRequiredFields(vehicleForOem);
      if (missingVehicleFields.length > 0) {
        const question = buildVehicleFollowUpQuestion(missingVehicleFields, lang);
        if (question) {
          await updateOrderData(order.id, {
            stage: "collecting_vehicle_data",
            pendingVehicleFields: missingVehicleFields,
            lastQuestionKey: missingVehicleFields[0]
          });
          return {
            reply: question,
            orderId: order.id
          };
        }
      }

      // OEM ermitteln
      let oem: string | null = null;
      try {
        const partDescription = parsed.part || orderData.partCategory || "unbekanntes Teil";
        const oemResult = await resolveOEM(vehicleForOem, partDescription);

        if (!oemResult.success || !oemResult.oemNumber) {
          await updateOrderData(order.id, {
            stage: "oem_failed",
            oemError: oemResult.message ?? "OEM konnte nicht ermittelt werden."
          });

          const replyDe =
            "Ich konnte die OEM-Nummer noch nicht sicher bestimmen. " +
            "Bitte schick mir, wenn möglich, noch mehr Fahrzeug- oder Teil-Details, " +
            "oder dein Händler prüft das direkt im System für dich.";

          const replyEn =
            "I could not reliably determine the OEM number yet. " +
            "Please send me more details about the vehicle or part, or your dealer will check it directly in the system.";

          return {
            reply: lang === "de" ? replyDe : replyEn,
            orderId: order.id
          };
        }

        oem = oemResult.oemNumber;
        await updateOrderData(order.id, {
          stage: "oem_resolved",
          oemNumber: oem
        });
      } catch (oemError: any) {
        logger.error("resolveOEM failed", {
          error: oemError?.message,
          orderId: order.id,
          vehicleForOem
        });

        await updateOrderData(order.id, {
          stage: "error",
          errorType: "oem_resolution",
          errorMessage: oemError?.message ?? "Unknown OEM error"
        });

        const replyDe =
          "Beim Abruf der Fahrzeug-/Teiledaten ist ein technischer Fehler aufgetreten. " +
          "Dein Händler hat deine Anfrage trotzdem im System und kann das Teil manuell für dich prüfen.";

        const replyEn =
          "A technical error occurred while retrieving the vehicle/part data. " +
          "Your dealer still has your request in the system and can check the correct part manually.";

        return {
          reply: lang === "de" ? replyDe : replyEn,
          orderId: order.id
        };
      }

      if (!oem) {
        const replyDe =
          "Ich konnte die OEM-Nummer leider nicht bestimmen. Dein Händler hat deine Anfrage im System und meldet sich bei dir.";
        const replyEn =
          "I could not determine the OEM number. Your dealer has your request in the system and will contact you.";

        return {
          reply: lang === "de" ? replyDe : replyEn,
          orderId: order.id
        };
      }

      // Scraping
      let offers: any[] = [];
      try {
        offers = await scrapeOffersForOrder(order.id, oem);
      } catch (scrapeError: any) {
        logger.error("scrapeOffersForOrder failed", {
          error: scrapeError?.message,
          orderId: order.id,
          oem
        });

        await updateOrderData(order.id, {
          stage: "error",
          errorType: "scraping",
          errorMessage: scrapeError?.message ?? "Unknown scraping error",
          oemNumber: oem
        });

        await updateOrderStatus(order.id, "ready");

        const replyDe =
          `Ich habe die OEM-Nummer **${oem}** ermittelt. ` +
          `Die angebundenen Shops sind gerade technisch nicht erreichbar, ` +
          `aber dein Händler sieht alle Fahrzeugdaten und die OEM im System und kann das Teil manuell für dich prüfen.`;

        const replyEn =
          `I have determined the OEM number **${oem}**. ` +
          `The connected shops are currently not reachable, ` +
          `but your dealer sees all vehicle data and the OEM in the system and can check the part manually.`;

        return {
          reply: lang === "de" ? replyDe : replyEn,
          orderId: order.id
        };
      }

      await updateOrderStatus(order.id, "ready");

      if (!offers || offers.length === 0) {
        const replyDe =
          `Top, ich habe deine Anfrage aufgenommen und die OEM-Nummer **${oem}** ermittelt.\n\n` +
          "Aktuell konnte ich in den angebundenen Shops noch keine Angebote finden.\n" +
          "Dein Händler hat aber alle Fahrzeugdaten und die OEM im System " +
          "und prüft das passende Teil manuell für dich.\n\n" +
          "Du wirst von ihm kontaktiert, sobald er alles geprüft hat.";

        const replyEn =
          `Great, I have received your request and determined the OEM number **${oem}**.\n\n` +
          "Currently I could not find any offers in the connected shops.\n" +
          "Your dealer has all vehicle data and the OEM in the system " +
          "and will manually check the correct part for you.\n\n" +
          "They will contact you once everything is checked.";

        await updateOrderData(order.id, {
          stage: "waiting_for_dealer",
          offersFound: 0,
          oemNumber: oem
        });

        return {
          reply: lang === "de" ? replyDe : replyEn,
          orderId: order.id
        };
      }

      const sorted = [...offers].sort((a, b) => a.price - b.price);
      const best = sorted[0];

      const replyDe =
        "Danke dir! Ich habe deine Anfrage aufgenommen und alles für deinen Händler vorbereitet.\n\n" +
        `✅ OEM-Nummer: **${oem}**\n` +
        `✅ Anzahl gefundener Angebote: ${offers.length}\n\n` +
        `Günstigstes Angebot (zur Info):\n` +
        `🛒 Shop: ${best.shopName}\n` +
        `💶 Preis: ${best.price} ${best.currency}\n` +
        `⏱️ Lieferzeit: ${best.deliveryTimeDays ?? "unbekannt"} Tage\n` +
        `🔧 Marke: ${best.brand ?? "k.A."}\n\n` +
        "Dein Händler sieht jetzt alle Details im System (Fahrzeugschein-Daten, OEM, Angebote) " +
        "und meldet sich bei dir, um Preis & Bestellung final mit dir abzustimmen.";

      const replyEn =
        "Thanks! I have received your request and prepared everything for your dealer.\n\n" +
        `✅ OEM number: **${oem}**\n` +
        `✅ Number of offers found: ${offers.length}\n\n` +
        `Cheapest offer (for info):\n` +
        `🛒 Shop: ${best.shopName}\n` +
        `💶 Price: ${best.price} ${best.currency}\n` +
        `⏱️ Delivery time: ${best.deliveryTimeDays ?? "unknown"} days\n` +
        `🔧 Brand: ${best.brand ?? "n/a"}\n\n` +
        "Your dealer now sees all details in the system (vehicle registration data, OEM, offers) " +
        "and will contact you to finalize price and ordering.";

      await updateOrderData(order.id, {
        stage: "waiting_for_dealer",
        offersFound: offers.length,
        oemNumber: oem,
        cheapestOffer: {
          shopName: best.shopName,
          price: best.price,
          currency: best.currency,
          deliveryTimeDays: best.deliveryTimeDays ?? null,
          brand: best.brand ?? null
        }
      });

      return {
        reply: lang === "de" ? replyDe : replyEn,
        orderId: order.id
      };
    }

    // Wenn wir hier landen und keine spezielle Stage getroffen haben → Fallback
    const fallbackReplyDe =
      "Ich habe deine Nachricht gespeichert. Wenn du möchtest, kannst du mir ein Foto deines Fahrzeugscheins und ein Foto von dem Teil schicken, um das es geht. Dann helfe ich dir, das richtige Teil zu finden.";
    const fallbackReplyEn =
      "I have saved your message. If you like, you can send me a photo of your vehicle registration document and a photo of the part or area on the car, and I will help you find the correct part.";

    return {
      reply: lang === "de" ? fallbackReplyDe : fallbackReplyEn,
      orderId: order.id
    };
  } catch (fatalError: any) {
    logger.error("handleIncomingBotMessage fatal error", {
      error: fatalError?.message,
      stack: fatalError?.stack,
      orderId: order?.id,
      from,
      text
    });

    if (order?.id) {
      try {
        await updateOrderData(order.id, {
          stage: "error",
          errorType: "fatal",
          errorMessage: fatalError?.message ?? "Unknown fatal error"
        });
        await updateOrderStatus(order.id, "failed");
      } catch (innerErr: any) {
        logger.error("Failed to update order status after fatal error", {
          error: innerErr?.message,
          orderId: order.id
        });
      }
    }

    return {
      reply:
        "Es ist ein technischer Fehler aufgetreten. Deine Anfrage wurde aber gespeichert und dein Händler sieht sie im System. Er meldet sich bei dir, sobald er alles geprüft hat.",
      orderId: order?.id ?? orderId ?? ""
    };
  }
}
