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
    if (
      req.query["hub.mode"] === "subscribe" &&
      req.query["hub.verify_token"] === process.env.VERIFY_TOKEN
    ) {
      return res.status(200).send(req.query["hub.challenge"]);
    }
    return res.sendStatus(403);
  }

  // ===== RECEIVE MESSAGE =====
  if (req.method === "POST") {
    try {

      const body = req.body;
      const msg = body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
      if (!msg) return res.sendStatus(200);

      const from = msg.from;
      const text = msg.text?.body || "";

      if (!text) return res.sendStatus(200);

      const name =
        body.entry?.[0]?.changes?.[0]?.value?.contacts?.[0]?.profile?.name || "";

      // ===== SIMPAN KE SHEET (PESAN MASUK) =====
      await fetch(process.env.GAS_WEBHOOK,{
        method:"POST",
        headers:{ "Content-Type":"application/json" },
        body: JSON.stringify({
          phone: from,
          name,
          message: text,
          reply: ""
        })
      });

      let reply;

      if (!sessions[from]) {
        sessions[from] = true;
        reply = greeting;
      } else {
        reply = await runAI(text);
      }

      // ===== KIRIM BALASAN WA =====
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
            text: { body: reply },
          }),
        }
      );

      // ===== SIMPAN BALASAN KE SHEET =====
      await fetch(process.env.GAS_WEBHOOK,{
        method:"POST",
        headers:{ "Content-Type":"application/json" },
        body: JSON.stringify({
          phone: from,
          name,
          message: text,
          reply: reply
        })
      });

      return res.sendStatus(200);

    } catch (err) {
      console.log("WEBHOOK ERROR:", err);
      return res.sendStatus(200);
    }
  }
}
