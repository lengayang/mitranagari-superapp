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

  // =============================
  // VERIFY META WEBHOOK
  // =============================
  if (req.method === "GET") {
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];

    if (mode === "subscribe" && token === process.env.VERIFY_TOKEN) {
      return res.status(200).send(challenge);
    }

    return res.status(403).send("Forbidden");
  }

  // =============================
  // TERIMA PESAN WA
  // =============================
  if (req.method === "POST") {
    try {
      const body = req.body;

      const messageObj =
        body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];

      if (!messageObj) {
        return res.status(200).send("no message");
      }

      const from = messageObj.from;
      const msg = messageObj.text?.body;

      if (!msg) {
        return res.status(200).send("not text");
      }

      let reply;

      if (!sessions[from]) {
        sessions[from] = true;
        reply = greeting;
      } else {
        reply = await runAI(msg);
      }

      // =============================
      // KIRIM BALASAN KE WA
      // =============================
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
            recipient_type: "individual",
            to: from,
            type: "text",
            text: {
              preview_url: false,
              body: reply,
            },
          }),
        }
      );

      const data = await response.text();
      console.log("WA SEND:", data);

      return res.status(200).send("ok");
    } catch (err) {
      console.log("WEBHOOK ERROR:", err);
      return res.status(200).send("error handled");
    }
  }
}
