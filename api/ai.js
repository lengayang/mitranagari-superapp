import { runAI } from "../ai/engine.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(200).json({ msg: "AI Mitra Nagari online" });
  }

  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: "No message" });
    }

    // 🔥 JALANKAN AI
    const reply = await runAI(message);

    res.status(200).json({ reply });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "AI error" });
  }
}
