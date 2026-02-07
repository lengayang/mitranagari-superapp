export default async function handler(req, res) {
  try {
    const url = process.env.GAS_GET

    if (!url) {
      return res.status(500).json({
        error: "GAS_GET belum di set di Vercel ENV"
      })
    }

    const r = await fetch(url)
    const data = await r.json()

    res.status(200).json(data)
  } catch (err) {
    res.status(500).json({
      error: err.toString()
    })
  }
}
