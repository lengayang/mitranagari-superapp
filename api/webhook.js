import fetch from "node-fetch";
import { runAI } from "../ai/engine.js";

export const config = {
  api: { bodyParser: true },
};

const greeting = `
Halo 👋  
Saya AI Mitra Nagari Digital.

Saya membantu:
• Sekolah
• UMKM
• Nagari
• Sistem digital

Ketik kebutuhan Bapak/Ibu.
`;

const sessions = {};

export default async function handler(req, res) {

  // ===== VERIFY META =====
  if (req.method === "GET") {
    const VERIFY_TOKEN = process.env.VERIFY_TOKEN;

    if (
      req.query["hub.mode"] === "subscribe" &&
      req.query["hub.verify_token"] === VERIFY_TOKEN
    ) {
      return res.status(200).send(req.query["hub.challenge"]);
    }

    return res.sendStatus(403);
  }

  // ===== RECEIVE MESSAGE =====
  if (req.method === "POST") {
    try {
      const body = req.body;

      const msg =
        body.entry?.[0]?.changes?.[0]?.value?.messages?.[0]?.text?.body;

      const from =
        body.entry?.[0]?.changes?.[0]?.value?.messages?.[0]?.from;

      if (!msg || !from) return res.sendStatus(200);

      let reply;

      if (!sessions[from]) {
        sessions[from] = true;
        reply = greeting;
      } else {
        reply = await runAI(msg);
      }

      await fetch(
        `https://graph.facebook.com/v19.0/${process.env.PHONE_NUMBER_ID}/messages`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.WA_TOKEN}`,
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

      return res.sendStatus(200);

    } catch (err) {
      console.log("WEBHOOK ERROR:", err);
      return res.sendStatus(200);
    }
  }
}
