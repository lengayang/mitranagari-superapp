import { runAI } from "../ai/engine.js";

const greeting = `Halo 👋  
Saya AI Mitra Nagari Digital.

Saya membantu:
• Sekolah
• UMKM
• Nagari
• Sistem digital

Ketik kebutuhan Bapak/Ibu.`;

const sessions = {};

export default async function handler(req, res) {

  // ===============================
  // VERIFY WEBHOOK META
  // ===============================
  if (req.method === "GET") {
    const VERIFY_TOKEN = process.env.VERIFY_TOKEN;

    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];

    if (mode === "subscribe" && token === VERIFY_TOKEN) {
      return res.status(200).send(challenge);
    }

    return res.status(403).send("Forbidden");
  }

  // ===============================
  // TERIMA PESAN WHATSAPP
  // ===============================
  if (req.method === "POST") {
    try {

      const body = req.body;

      const messageObj =
        body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];

      if (!messageObj) {
        return res.status(200).send("no message");
      }

      const msg = messageObj.text?.body;
      const from = messageObj.from;

      if (!msg || !from) {
        return res.status(200).send("not text");
      }

      let reply;

      // ===== GREETING PERTAMA =====
      if (!sessions[from]) {
        sessions[from] = true;
        reply = greeting;
      } else {
        try {
          reply = await runAI(msg);
        } catch (e) {
          console.log("AI ERROR:", e);
          reply = "AI aktif. Ketik kebutuhan Bapak/Ibu.";
        }
      }

      // ===============================
      // KIRIM BALASAN KE WHATSAPP
      // ===============================
      const response = await fetch(
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

      const result = await response.json();
      console.log("WA SEND:", result);

      return res.status(200).send("ok");

    } catch (err) {
      console.log("WEBHOOK ERROR:", err);
      return res.status(200).send("error handled");
    }
  }

  return res.status(405).send("Method not allowed");
}
