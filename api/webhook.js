import { runAI } from "../ai/engine.js";

const firstGreeting = `
Halo 👋  
Saya AI resmi PT Mitra Nagari Digital.

Kami membantu:
• Sekolah (website, PPDB, e-learning, sistem digital)
• UMKM (branding, katalog, promosi digital)
• Nagari (profil nagari, layanan publik, data warga)
• Konsultasi teknologi & AI

Kak/Bapak/Ibu dari kategori mana?
1️⃣ Sekolah  
2️⃣ UMKM  
3️⃣ Nagari  
4️⃣ Konsultasi umum  

Tulis nomor pilihan atau kebutuhan utama.
`;

// memory sederhana (sementara)
const userSession = {};

export default async function handler(req, res) {

  // ===== VERIFY META =====
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

  // ===== TERIMA PESAN =====
  if (req.method === "POST") {
    try {
      const body = req.body;

      const msg =
        body.entry?.[0]?.changes?.[0]?.value?.messages?.[0]?.text?.body;

      const from =
        body.entry?.[0]?.changes?.[0]?.value?.messages?.[0]?.from;

      if (!msg || !from) return res.sendStatus(200);

      let reply;

      // ===== PESAN PERTAMA USER =====
      if (!userSession[from]) {
        userSession[from] = true;
        reply = firstGreeting;
      } else {
        // ===== PESAN BERIKUTNYA → AI =====
        reply = await runAI(msg);
      }

      // ===== KIRIM BALASAN WA =====
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
      res.sendStatus(200);
    }
  }
}
