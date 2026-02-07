export default function handler(req, res){

  if(req.method !== "POST"){
    return res.status(405).end();
  }

  const { pass } = req.body;

  if(pass !== process.env.ADMIN_PASS){
    return res.status(401).json({ ok:false });
  }

  res.setHeader("Set-Cookie",
    `mitra=${process.env.ADMIN_TOKEN}; HttpOnly; Path=/; SameSite=Lax`
  );

  res.json({ ok:true });
}
