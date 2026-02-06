import 'dotenv/config';
import express from "express";
import cors from "cors";
import { runAI } from "../../ai/engine.js";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("AI Mitra Nagari Server Aktif");
});

app.post("/ai", async (req, res) => {
  try {
    const { message } = req.body;
    const reply = await runAI(message);
    res.json({ reply });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(3000, () => {
  console.log("Server jalan di http://localhost:3000");
});
