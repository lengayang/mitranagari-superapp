export default async function handler(req,res){

  const cookie = req.headers.cookie || "";

  if(!cookie.includes(process.env.ADMIN_TOKEN)){
    return res.status(401).json({ error:"unauthorized" });
  }

export default async function handler(req, res) {
  try {
    const url = process.env.GAS_GET

    const r = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json"
      }
    })

    const text = await r.text()

    // debug jika bukan JSON
    if (text.startsWith("<")) {
      return res.status(500).json({
        error: "GAS mengembalikan HTML, bukan JSON",
        preview: text.slice(0, 200)
      })
    }

    const data = JSON.parse(text)

    res.status(200).json(data)

  } catch (err) {
    res.status(500).json({
      error: err.toString()
    })
  }
}
