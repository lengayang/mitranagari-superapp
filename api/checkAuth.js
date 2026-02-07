export default function handler(req,res){

  const cookie = req.headers.cookie || "";

  if(cookie.includes(process.env.ADMIN_TOKEN)){
    return res.json({ ok:true });
  }

  res.status(401).json({ ok:false });
}
