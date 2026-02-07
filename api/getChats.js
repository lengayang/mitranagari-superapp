export default async function handler(req, res) {
  const r = await fetch(process.env.GAS_GET)
  const data = await r.json()

  res.json(data)
}
