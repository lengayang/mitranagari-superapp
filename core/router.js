export function route(state,message){

  const text = message.toLowerCase();

  if(text.includes("sarpras")) return "SARPRAS";
  if(text.includes("sekolah")) return "SEKOLAH";
  if(text.includes("umkm")) return "UMKM";
  if(text.includes("operator")) return "OPERATOR";

  return state.mode || "AI";
}
