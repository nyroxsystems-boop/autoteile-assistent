import express from "express";
import fetch from "node-fetch";

const router = express.Router();

// Twilio posts application/x-www-form-urlencoded bodies
router.use(express.urlencoded({ extended: false }));

function xmlEscape(str: string): string {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

router.post("/", async (req, res) => {
  const from = (req.body?.From as string) || "";
  const text = (req.body?.Body as string) || "";
  const numMedia = (req.body?.NumMedia as string) || "0";

  // Log incoming Twilio webhook payload
  console.log("[Twilio Webhook] Incoming", { from, text, numMedia });

  let replyText =
    "Es ist ein technischer Fehler aufgetreten. Bitte versuche es später erneut.";

  try {
    const botResponse = await fetch("https://autoteile-bot-service.onrender.com/bot/message", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        from,
        text,
        orderId: null
      })
    });

    if (!botResponse.ok) {
      throw new Error(`Bot API returned status ${botResponse.status}`);
    }

    const data = (await botResponse.json()) as { reply?: string };
    replyText = data.reply || replyText;
  } catch (err: any) {
    console.error("[Twilio Webhook] Error calling bot/message", { error: err?.message });
  }

  const twiml = `<Response><Message>${xmlEscape(replyText)}</Message></Response>`;
  res.type("text/xml").status(200).send(twiml);
});

export default router;
