import { runAI } from "../ai/engine.js";

export default async function handler(req, res) {

  if (req.method !== "POST") {
    return res.status(200).json({ msg: "AI Mitra Nagari online" });
  }

  try {
    const { message } = req.body;

    if (!message) {
      return res.status(200).json({ reply: "Tulis pesan dulu." });
    }

    // ===== JALANKAN AI =====
    const reply = await runAI(message);

    // ===== SIMPAN KE GOOGLE SHEET =====
    try {
      await fetch(process.env.GAS_WEBHOOK, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: "WEB",
          name: "CHAT_HTML",
          message: message,
          reply: reply
        })
      });
    } catch (e) {
      console.log("Gagal simpan ke sheet:", e);
    }

    return res.status(200).json({ reply });

  } catch (err) {
    console.error("AI ERROR:", err);
    return res.status(200).json({ reply: "AI error" });
  }
}
