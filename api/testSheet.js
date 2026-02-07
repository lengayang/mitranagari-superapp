export default async function handler(req, res) {

  const r = await fetch(process.env.GAS_WEBHOOK,{
    method:"POST",
    body: JSON.stringify({
      phone:"628111111111",
      name:"TEST",
      message:"TES MASUK",
      reply:""
    })
  })

  const text = await r.text()
  res.send(text)
}
