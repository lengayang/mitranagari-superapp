import { runAI } from "../ai/engine.js";

const greeting = `Halo 👋
Saya AI Mitra Nagari Digital.

Saya membantu:
• Sekolah
• UMKM
• Nagari
• Sistem digital

Ketik kebutuhan Bapak.`;

const sessions = {};

export default async function handler(req, res) {

  // ===== VERIFY META =====
  if (req.method === "GET") {
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];

    if (mode === "subscribe" && token === process.env.VERIFY_TOKEN) {
      return res.status(200).send(challenge);
    }

    return res.status(403).send("Forbidden");
  }

  // ===== RECEIVE MESSAGE =====
  if (req.method === "POST") {
    try {

      const body = req.body;

      const message =
        body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];

      if (!message) {
        return res.status(200).send("no message");
      }

      const from = message.from;
      const text = message.text?.body;

      if (!text) {
        return res.status(200).send("not text");
      }

      const name =
        body.entry?.[0]?.changes?.[0]?.value?.contacts?.[0]?.profile?.name || "";

      // ===== SIMPAN PESAN MASUK KE SHEET =====
      try {
        await fetch(process.env.GAS_WEBHOOK, {
          method: "POST",
          body: JSON.stringify({
            phone: from,
            name,
            message: text,
            reply: ""
          })
        });
      } catch (e) {
        console.log("Sheet save error:", e);
      }

      let reply;

      if (!sessions[from]) {
        sessions[from] = true;
        reply = greeting;
      } else {
        reply = await runAI(text);
      }

      // ===== KIRIM BALASAN KE WHATSAPP =====
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

      // ===== SIMPAN BALASAN AI KE SHEET =====
      try {
        await fetch(process.env.GAS_WEBHOOK, {
          method: "POST",
          body: JSON.stringify({
            phone: from,
            name,
            message: text,
            reply: reply
          })
        });
      } catch (e) {
        console.log("Sheet reply save error:", e);
      }

      return res.status(200).send("ok");

    } catch (err) {
      console.log("WEBHOOK ERROR:", err);
      return res.status(200).send("error handled");
    }
  }
}
