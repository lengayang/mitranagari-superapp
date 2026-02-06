export default async function handler(req, res) {
  try {

    if (req.method === "GET") {
      return res.json({ msg: "AI Mitra Nagari online" });
    }

    const body = req.body;
    const userMsg = body?.msg || "halo";

    // sementara balasan dummy
    const reply = `Halo 👋  
Saya AI Mitra Nagari.

Bapak/Ibu menulis:
"${userMsg}"

Saya siap membantu layanan digital sekolah, UMKM, dan nagari.
Kebutuhan utama Bapak/Ibu apa?`;

    return res.json({ reply });

  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "AI error" });
  }
}
