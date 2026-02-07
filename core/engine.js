import { aiService } from "../services/ai.js";
import { sarprasService } from "../services/sarpras.js";
import { sekolahService } from "../services/sekolah.js";
import { umkmService } from "../services/umkm.js";

export async function runEngine(route,ctx){

  if(route==="SARPRAS") return sarprasService(ctx);
  if(route==="SEKOLAH") return sekolahService(ctx);
  if(route==="UMKM") return umkmService(ctx);

  return aiService(ctx);
}
