import { Router, Request, Response } from "express";
import { handleIncomingBotMessage } from "../services/botLogicService";
import { insertMessage } from "../services/supabaseService";

const router = Router();

/**
 * POST /bot/message
 * 
 * Der komplette End-to-End Bot Flow:
 * - Nachricht verstehen
 * - Rückfragen stellen falls Infos fehlen
 * - OEM ermitteln
 * - Angebote scrapen
 * - Bestes Angebot bestimmen
 * - Antwort generieren
 */
router.post("/", async (req: Request, res: Response) => {
  const { from, text, orderId } = req.body ?? {};

  if (!from || !text) {
    return res.status(400).json({ error: "from and text are required" });
  }

  try {
    const result = await handleIncomingBotMessage(orderId ?? null, from, text);

    // Antwort als outgoing message speichern
    try {
      await insertMessage({
        orderId: result.orderId || null,
        direction: "outgoing",
        channel: "whatsapp",
        fromIdentifier: null,
        toIdentifier: from,
        content: result.reply,
        rawPayload: null
      });
    } catch (dbErr: any) {
      console.error("Failed to store outgoing bot message", { error: dbErr?.message, orderId: result.orderId });
      // Do not fail the whole request if logging to DB fails
    }

    res.json(result);
  } catch (err: any) {
    console.error("BotFlow Error:", err);
    res.status(500).json({
      error: "BotFlow failed",
      details: err?.message
    });
  }
});

export default router;
