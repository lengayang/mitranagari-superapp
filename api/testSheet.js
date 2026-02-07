export default async function handler(req, res) {

  const url = process.env.GAS_WEBHOOK;

  if(!url){
    return res.send("GAS_WEBHOOK belum ada di ENV");
  }

  console.log("URL:",url);

  const r = await fetch(url,{
    method:"POST",
    headers:{
      "Content-Type":"application/json"
    },
    body: JSON.stringify({
      phone:"628111111111",
      name:"TEST",
      message:"TES MASUK",
      reply:""
    })
  });

  const text = await r.text();
  console.log("RESP:",text);

  res.send(text);
}
