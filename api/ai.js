import { runAI } from "../ai/engine.js";

export default async function handler(req, res) {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(200).json({ reply: "Ketik pesan dulu." });
    }

    const reply = await runAI(message);

    res.status(200).json({ reply });
  } catch (err) {
    console.error("AI ERROR:", err);
    res.status(200).json({ reply: "AI sedang aktif. Coba lagi." });
  }
}
