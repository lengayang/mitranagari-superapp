import { runAI } from "../ai/engine.js";

/* =========================
   SESSION MEMORY
   ========================= */
const sessions = {};

function getSession(user){
  if(!sessions[user]){
    sessions[user] = {
      greeted:false,
      mode:"AI"
    };
  }
  return sessions[user];
}

/* =========================
   ROUTER
   ========================= */
function detectRoute(text){
  const t = text.toLowerCase().trim();

  if(t==="ai") return "RESET";

  if(t.includes("sarpras")) return "SARPRAS";
  if(t.includes("sekolah")) return "SEKOLAH";
  if(t.includes("umkm")) return "UMKM";
  if(t.includes("operator")) return "OPERATOR";

  return null;
}

/* =========================
   SERVICE ENGINE
   ========================= */
async function runEngine(mode,ctx){

  if(mode==="SARPRAS"){
    if(ctx.message.toLowerCase().includes("lapor")){
      return "Silakan kirim format:\nLAPOR\nLokasi:\nKerusakan:";
    }
    return "Mode Sarpras aktif. Ketik *LAPOR* untuk melapor fasilitas.";
  }

  if(mode==="SEKOLAH"){
    return "Mode Sekolah aktif. Ketik *INFO* untuk layanan sekolah.";
  }

  if(mode==="UMKM"){
    return "Mode UMKM aktif. Ketik *PRODUK* untuk katalog.";
  }

  if(mode==="OPERATOR"){
    return "Baik, operator akan segera membantu.";
  }

  /* default AI */
  return await runAI(ctx.message);
}

/* =========================
   GREETING
   ========================= */
const greeting = `Halo 👋
Saya AI Mitra Nagari Digital.

Saya membantu:
• Sekolah
• UMKM
• Nagari
• Sistem digital

Ketik kebutuhan Bapak.`;

/* =========================
   HANDLER
   ========================= */
export default async function handler(req,res){

  /* ===== VERIFY META ===== */
  if(req.method==="GET"){
    if(
      req.query["hub.mode"]==="subscribe" &&
      req.query["hub.verify_token"]===process.env.VERIFY_TOKEN
    ){
      return res.status(200).send(req.query["hub.challenge"]);
    }
    return res.sendStatus(403);
  }

  /* ===== RECEIVE WA ===== */
  if(req.method==="POST"){
    try{

      const body = req.body;
      const msg = body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
      if(!msg) return res.sendStatus(200);

      const from = msg.from;
      const text = msg.text?.body || "";
      if(!text) return res.sendStatus(200);

      const name =
        body.entry?.[0]?.changes?.[0]?.value?.contacts?.[0]?.profile?.name || "";

      const session = getSession(from);

      /* ===== LOG PESAN MASUK ===== */
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

      /* ===== GREETING ===== */
      if(!session.greeted){
        session.greeted = true;
        reply = greeting;
      }else{

        /* DETEKSI MODE BARU */
        const route = detectRoute(text);

        if(route==="RESET"){
          session.mode="AI";
          reply = "Mode kembali ke AI.";
        }
        else if(route){
          session.mode = route;
          reply = `Mode ${route} aktif.`;
        }
        else{
          reply = await runEngine(session.mode,{
            user:from,
            message:text
          });
        }
      }

      /* ===== KIRIM WA ===== */
      await fetch(
        `https://graph.facebook.com/v19.0/${process.env.PHONE_NUMBER_ID}/messages`,
        {
          method:"POST",
          headers:{
            Authorization:`Bearer ${process.env.WA_TOKEN}`,
            "Content-Type":"application/json"
          },
          body:JSON.stringify({
            messaging_product:"whatsapp",
            to:from,
            text:{ body:reply }
          })
        }
      );

      /* ===== LOG BALASAN ===== */
      await fetch(process.env.GAS_WEBHOOK,{
        method:"POST",
        headers:{ "Content-Type":"application/json" },
        body: JSON.stringify({
          phone: from,
          name,
          message: text,
          reply
        })
      });

      return res.sendStatus(200);

    }catch(err){
      console.log("WEBHOOK ERROR:",err);
      return res.sendStatus(200);
    }
  }
}
