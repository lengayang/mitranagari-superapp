import { runAI } from "../ai/engine.js";

/* ================= SESSION ================= */
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

/* ================= ROUTER ================= */
function detectRoute(text){
  const t = text.toLowerCase().trim();

  if(t==="ai") return "RESET";

  if(t.startsWith("sarpras")) return "SARPRAS";
  if(t.startsWith("sekolah")) return "SEKOLAH";
  if(t.startsWith("umkm")) return "UMKM";
  if(t.startsWith("operator")) return "OPERATOR";

  return null;
}

/* ================= ENGINE ================= */
async function runEngine(mode,ctx){

  if(mode==="SEKOLAH"){
    return "📚 Mode Sekolah aktif.\nKetik: jadwal, info, guru.";
  }

  if(mode==="SARPRAS"){
    if(ctx.message.toLowerCase().includes("lapor")){
      return "🛠 Kirim format:\nLAPOR\nLokasi:\nKerusakan:";
    }
    return "🛠 Mode Sarpras aktif. Ketik LAPOR.";
  }

  if(mode==="UMKM"){
    return "🛒 Mode UMKM aktif. Ketik PRODUK.";
  }

  if(mode==="OPERATOR"){
    return "Operator akan segera membantu.";
  }

  return await runAI(ctx.message);
}

/* ================= GREETING ================= */
const greeting = `Halo 👋
Saya AI Mitra Nagari Digital.

Ketik:
• sekolah
• sarpras
• umkm
• operator`;

/* ================= HANDLER ================= */
export default async function handler(req,res){

  if(req.method==="GET"){
    if(
      req.query["hub.mode"]==="subscribe" &&
      req.query["hub.verify_token"]===process.env.VERIFY_TOKEN
    ){
      return res.status(200).send(req.query["hub.challenge"]);
    }
    return res.sendStatus(403);
  }

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

      /* ===== LOG MASUK ===== */
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
        session.greeted=true;
        reply=greeting;
      }else{

        const route = detectRoute(text);

        /* RESET MODE */
        if(route==="RESET"){
          session.mode="AI";
          reply="Mode kembali ke AI.";
        }

        /* GANTI MODE */
        else if(route){
          session.mode=route;
          reply=`Mode ${route} aktif.`;
        }

        /* JALANKAN MODE SEKARANG */
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

      /* ===== LOG BALAS ===== */
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
