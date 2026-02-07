import { runAI } from "../ai/engine.js";

/* ===============================
   AMBIL MODE TERAKHIR DARI SHEET
   =============================== */
async function getMode(user){
  try{
    const r = await fetch(process.env.GAS_GET);
    const data = await r.json();

    const rows = data.slice(1).reverse();

    for(const row of rows){
      if(row[1] === user && row[6]){
        return row[6];
      }
    }

    return "AI";

  }catch(e){
    console.log("getMode error",e);
    return "AI";
  }
}

/* ===============================
   SIMPAN MODE KE SHEET
   =============================== */
async function setMode(user,mode,name){
  try{
    await fetch(process.env.GAS_WEBHOOK,{
      method:"POST",
      headers:{ "Content-Type":"application/json" },
      body: JSON.stringify({
        phone:user,
        name,
        message:"[MODE]",
        reply:mode,
        agent:mode
      })
    });
  }catch(e){
    console.log("setMode error",e);
  }
}

/* ===============================
   DETEKSI PERINTAH MODE
   =============================== */
function detect(text){
  const t = text.toLowerCase().trim();

  if(t === "ai") return "RESET";
  if(t.startsWith("sekolah")) return "SEKOLAH";
  if(t.startsWith("sarpras")) return "SARPRAS";
  if(t.startsWith("umkm")) return "UMKM";
  if(t.startsWith("operator")) return "OPERATOR";

  return null;
}

/* ===============================
   HANDLER
   =============================== */
export default async function handler(req,res){

  /* ===== VERIFY META ===== */
  if(req.method === "GET"){
    if(
      req.query["hub.mode"]==="subscribe" &&
      req.query["hub.verify_token"]===process.env.VERIFY_TOKEN
    ){
      return res.status(200).send(req.query["hub.challenge"]);
    }
    return res.sendStatus(403);
  }

  /* ===== RECEIVE MESSAGE ===== */
  if(req.method === "POST"){
    try{

      const body = req.body;
      const msg = body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
      if(!msg) return res.sendStatus(200);

      const from = msg.from;
      const text = msg.text?.body || "";

      if(!text) return res.sendStatus(200);

      const name =
        body.entry?.[0]?.changes?.[0]?.value?.contacts?.[0]?.profile?.name || "";

      /* ===== AMBIL MODE TERAKHIR ===== */
      let mode = await getMode(from);

      /* ===== CEK PERINTAH MODE ===== */
      const route = detect(text);

      if(route === "RESET"){
        mode = "AI";
        await setMode(from,"AI",name);
      }
      else if(route){
        mode = route;
        await setMode(from,route,name);
      }

      /* ===== TENTUKAN BALASAN ===== */
      let reply;

      if(mode === "SEKOLAH"){
        reply = "📚 Mode Sekolah aktif.\nKetik: jadwal / info.";
      }
      else if(mode === "SARPRAS"){
        if(text.toLowerCase().includes("lapor")){
          reply = "🛠 Kirim format:\nLAPOR\nLokasi:\nKerusakan:";
        }else{
          reply = "🛠 Mode Sarpras aktif. Ketik LAPOR.";
        }
      }
      else if(mode === "UMKM"){
        reply = "🛒 Mode UMKM aktif. Ketik PRODUK.";
      }
      else if(mode === "OPERATOR"){
        reply = "Operator akan segera membantu.";
      }
      else{
        reply = await runAI(text);
      }

      /* ===== KIRIM KE WHATSAPP ===== */
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

      /* ===== LOG CHAT ===== */
      await fetch(process.env.GAS_WEBHOOK,{
        method:"POST",
        headers:{ "Content-Type":"application/json" },
        body: JSON.stringify({
          phone:from,
          name,
          message:text,
          reply,
          agent:mode
        })
      });

      return res.sendStatus(200);

    }catch(err){
      console.log("WEBHOOK ERROR:",err);
      return res.sendStatus(200);
    }
  }
}
