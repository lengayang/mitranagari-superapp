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

    const reply = await runAI(message);

    return res.status(200).json({ reply });

  } catch (err) {
    console.error("AI ERROR:", err);
    return res.status(200).json({ reply: "AI error" });
  }
}
