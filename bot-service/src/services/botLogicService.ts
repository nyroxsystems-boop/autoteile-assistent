import OpenAI from "openai";
import type {
  ResponseOutputMessage,
  ResponseOutputText
} from "openai/resources/responses/responses";
import { generateChatCompletion } from "./openAiService";
import { BOT_SYSTEM_PROMPT } from "../prompts/botSystemPrompt";
import {
  insertMessage,
  findOrCreateOrder,
  updateOrder,
  ConversationStatus
} from "./supabaseService";
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

type ConversationData = {
  conversationStatus: ConversationStatus;
  vehicleDescription?: string | null;
  partDescription?: string | null;
  docMissing?: boolean;
};

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

async function buildLLMReply(
  state: ConversationStatus,
  language: "de" | "en" | null,
  userText: string,
  context: Partial<ConversationData>
): Promise<string> {
  const system = `${BOT_SYSTEM_PROMPT}

Current state: ${state}
Language: ${language ?? "unknown"}
Remember: Do not change the flow or add new steps.`;

  const user = [
    `State: ${state}`,
    `Language: ${language ?? "unknown"}`,
    `Vehicle description: ${context.vehicleDescription ?? "n/a"}`,
    `Part description: ${context.partDescription ?? "n/a"}`,
    `Doc missing: ${context.docMissing ? "yes" : "no/unknown"}`,
    `User message: "${userText}"`
  ].join("\n");

  const reply = await generateChatCompletion({
    messages: [
      { role: "system", content: system },
      { role: "user", content: user }
    ]
  });

  return reply || (language === "en"
    ? "I didn't catch that, could you rephrase?"
    : "Ich habe dich nicht verstanden, kannst du das bitte anders formulieren?");
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
export interface BotMessagePayload {
  from: string;
  text: string;
  orderId?: string | null;
}

function pickLanguage(text: string): "de" | "en" | null {
  const t = text.toLowerCase();
  if (t.includes("1") || t.includes("deutsch")) return "de";
  if (t.includes("2") || t.includes("english")) return "en";
  return null;
}

// ------------------------------
// Hauptlogik – zustandsbasierter Flow
// ------------------------------
export async function handleIncomingBotMessage(
  payload: BotMessagePayload
): Promise<{ reply: string; orderId: string }> {
  const userText = (payload.text || "").trim();

  // Load or create order
  const order = await findOrCreateOrder(payload.from, payload.orderId ?? null);
  const language = (order.language as "de" | "en" | null) ?? null;
  const currentStatus: ConversationStatus = order.status || "choose_language";

  let nextStatus: ConversationStatus = currentStatus;
  let nextLanguage: "de" | "en" | null = language;
  let vehicleDescription = order.vehicle_description;
  let partDescription = order.part_description;

  // Log incoming message best-effort
  try {
    await insertMessage({
      orderId: order.id,
      direction: "incoming",
      channel: "whatsapp",
      fromIdentifier: payload.from,
      toIdentifier: null,
      content: userText,
      rawPayload: { from: payload.from }
    });
  } catch (err: any) {
    logger.error("Failed to log incoming message", { error: err?.message, orderId: order.id });
  }

  // State machine decisions
  switch (currentStatus) {
    case "choose_language": {
      const sel = pickLanguage(userText);
      if (sel) {
        nextLanguage = sel;
        nextStatus = "ask_vehicle_docs";
      } else {
        nextStatus = "choose_language";
      }
      break;
    }
    case "ask_vehicle_docs": {
      nextStatus = "wait_vehicle_docs";
      break;
    }
    case "wait_vehicle_docs": {
      vehicleDescription = vehicleDescription
        ? `${vehicleDescription}\n${userText}`
        : userText;
      nextStatus = "ask_part_info";
      break;
    }
    case "ask_part_info": {
      nextStatus = "wait_part_info";
      break;
    }
    case "wait_part_info": {
      partDescription = partDescription ? `${partDescription}\n${userText}` : userText;
      nextStatus = "processing";
      break;
    }
    default: {
      // processing/show_offers/done
      nextStatus = currentStatus;
    }
  }

  // Build prompt for LLM
  const systemMessage = `${BOT_SYSTEM_PROMPT}
Current conversation state: ${currentStatus}
Current language code: ${nextLanguage ?? language ?? "null"}.`;

  const userMessage = `
Current state: ${currentStatus}
Next state the backend wants to move to: ${nextStatus}
Language code: ${nextLanguage ?? language ?? "null"}
Known vehicle description: ${vehicleDescription ?? "none yet"}
Known part description: ${partDescription ?? "none yet"}

User message: "${userText}"

Based on the current state and next state, answer the user and guide them through this step.`;

  let replyText = "";
  try {
    replyText =
      (await generateChatCompletion({
        messages: [
          { role: "system", content: systemMessage },
          { role: "user", content: userMessage }
        ]
      })) || "";
  } catch (err: any) {
    console.error("OpenAI reply failed in handleIncomingBotMessage:", err?.message);
  }

  // Fallback messages if LLM empty
  if (!replyText) {
    const lang = nextLanguage ?? language ?? "de";
    switch (currentStatus) {
      case "choose_language":
        replyText =
          lang === "en"
            ? "Please choose a language: reply with 1 for Deutsch or 2 for English."
            : "Bitte wähle eine Sprache: Antworte mit 1 für Deutsch oder 2 für English.";
        break;
      case "ask_vehicle_docs":
        replyText =
          lang === "en"
            ? "Please send a photo of your vehicle registration, or tell me VIN/HSN/TSN, or at least make/model/year."
            : "Bitte sende ein Foto deines Fahrzeugscheins oder nenne VIN/HSN/TSN oder mindestens Marke/Modell/Baujahr.";
        break;
      case "wait_vehicle_docs":
        replyText =
          lang === "en"
            ? "Got it. Tell me the part you need and where on the car (front/rear, left/right)."
            : "Alles klar. Welches Teil brauchst du und wo am Auto (vorne/hinten, links/rechts)?";
        break;
      case "ask_part_info":
        replyText =
          lang === "en"
            ? "What part do you need? Please include position (front/rear, left/right) and any symptoms."
            : "Welches Teil brauchst du? Bitte mit Position (vorne/hinten, links/rechts) und Symptomen.";
        break;
      case "wait_part_info":
        replyText =
          lang === "en"
            ? "Thanks, I'll check matching parts and get back with options."
            : "Danke, ich prüfe passende Teile und melde mich mit Angeboten.";
        break;
      default:
        replyText =
          lang === "en"
            ? "Your request is being processed. You'll get an update shortly."
            : "Deine Anfrage ist in Bearbeitung. Du bekommst gleich ein Update.";
    }
  }

  // Persist updated state
  try {
    await updateOrder(order.id, {
      status: nextStatus,
      language: nextLanguage ?? language ?? null,
      vehicle_description: vehicleDescription ?? null,
      part_description: partDescription ?? null
    });
  } catch (err: any) {
    logger.error("Failed to update order in handleIncomingBotMessage", {
      error: err?.message,
      orderId: order.id
    });
  }

  return { reply: replyText, orderId: order.id };
}
