import { runAI } from "../ai/engine.js";

export async function aiService({message}){
  return await runAI(message);
}
