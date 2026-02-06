import { runAI } from "../ai/engine.js";

export default async function handler(req, res) {

  // ===== VERIFIKASI META =====
  if (req.method === "GET") {
    const VERIFY_TOKEN = "mitra_token_2026";

    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];

    if (mode === "subscribe" && token === VERIFY_TOKEN) {
      return res.status(200).send(challenge);
    }

    return res.sendStatus(403);
  }

  // ===== TERIMA PESAN WA =====
  if (req.method === "POST") {
    try {
      const body = req.body;

      const msg =
        body.entry?.[0]?.changes?.[0]?.value?.messages?.[0]?.text?.body;

      const from =
        body.entry?.[0]?.changes?.[0]?.value?.messages?.[0]?.from;

      if (!msg || !from) return res.sendStatus(200);

      const reply = await runAI(msg);

      await fetch(
        `https://graph.facebook.com/v19.0/${process.env.PHONE_NUMBER_ID}/messages`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messaging_product: "whatsapp",
            to: from,
            type: "text",
            text: { body: reply },
          }),
        }
      );

      res.sendStatus(200);
    } catch (e) {
      console.error(e);
      res.sendStatus(500);
    }
  }
}
