export default async function handler(req, res) {
  try {

    const cookie = req.headers.cookie || "";

    if (!cookie.includes(process.env.ADMIN_TOKEN)) {
      return res.status(401).json({ error: "unauthorized" });
    }

    const r = await fetch(process.env.GAS_GET);
    const data = await r.json();

    res.status(200).json(data);

  } catch (err) {
    console.log("GETCHATS ERROR:", err);
    res.status(500).json({ error: "server error" });
  }
}
