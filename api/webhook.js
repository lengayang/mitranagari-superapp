import { runAI } from "../ai/engine.js";

/* ===== AMBIL MODE USER DARI SHEET ===== */
async function getMode(user){
  const r = await fetch(process.env.GAS_GET);
  const data = await r.json();

  const rows = data.slice(1).reverse();

  for(const row of rows){
    if(row[1]===user && row[6]){
      return row[6]; // kolom agent = mode
    }
  }

  return "AI";
}

/* ===== SIMPAN MODE ===== */
async function setMode(user,mode,name){
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
}

/* ===== ROUTER ===== */
function detect(text){
  const t=text.toLowerCase();

  if(t==="ai") return "RESET";
  if(t.includes("sekolah")) return "SEKOLAH";
  if(t.includes("sarpras")) return "SARPRAS";
  if(t.includes("umkm")) return "UMKM";
  if(t.includes("operator")) return "OPERATOR";

  return null;
}

/* ===== HANDLER ===== */
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

      const body=req.body;
      const msg=body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
      if(!msg) return res.sendStatus(200);

      const from=msg.from;
      const text=msg.text?.body || "";

      const name=
      body.entry?.[0]?.changes?.[0]?.value?.contacts?.[0]?.profile?.name || "";

      /* MODE SEKARANG */
      let mode = await getMode(from);

      const route = detect(text);

      if(route==="RESET"){
        mode="AI";
        await setMode(from,"AI",name);
      }

      else if(route){
        mode=route;
        await setMode(from,route,name);
      }

      let reply;

      if(mode==="SEKOLAH"){
        reply="📚 Mode Sekolah aktif. Ketik jadwal / info.";
      }
      else if(mode==="SARPRAS"){
        reply="🛠 Mode Sarpras aktif. Ketik LAPOR.";
      }
      else if(mode==="UMKM"){
        reply="🛒 Mode UMKM aktif.";
      }
      else if(mode==="OPERATOR"){
        reply="Operator akan membantu.";
      }
      else{
        reply=await runAI(text);
      }

      /* KIRIM WA */
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

      /* LOG */
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
      console.log(err);
      return res.sendStatus(200);
    }
  }
}
