import { runAI } from "../ai/engine.js";

// ====== STATE SEDERHANA ======
const sessions = {};

function getMode(user){
  if(!sessions[user]){
    sessions[user] = { mode:"AI", greeted:false };
  }
  return sessions[user];
}

// ====== ROUTER ======
function detectRoute(text){
  const t = text.toLowerCase();

  if(t.includes("sarpras")) return "SARPRAS";
  if(t.includes("sekolah")) return "SEKOLAH";
  if(t.includes("umkm")) return "UMKM";
  if(t.includes("operator")) return "OPERATOR";

  return "AI";
}

// ====== SERVICE ENGINE ======
async function runEngine(route,ctx){

  if(route==="SARPRAS"){
    return "Layanan Sarpras aktif. Ketik LAPOR untuk melapor fasilitas.";
  }

  if(route==="SEKOLAH"){
    return "Layanan Sekolah aktif. Ketik INFO untuk informasi akademik.";
  }

  if(route==="UMKM"){
    return "Layanan UMKM aktif. Ketik PRODUK untuk katalog.";
  }

  if(route==="OPERATOR"){
    return "Operator akan segera membantu.";
  }

  return await runAI(ctx.message);
}

// ====== GREETING ======
const greeting = `Halo 👋
Saya AI Mitra Nagari Digital.

Saya membantu:
• Sekolah
• UMKM
• Nagari
• Sistem digital

Ketik kebutuhan Bapak.`;

// ====== HANDLER ======
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

      const session = getMode(from);

      // ===== SIMPAN PESAN MASUK =====
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

      // ===== GREETING PERTAMA =====
      if(!session.greeted){
        session.greeted = true;
        reply = greeting;
      }else{
        const route = detectRoute(text);

        reply = await runEngine(route,{
          user:from,
          message:text
        });
      }

      // ===== KIRIM KE WHATSAPP =====
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

      // ===== SIMPAN BALASAN =====
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
