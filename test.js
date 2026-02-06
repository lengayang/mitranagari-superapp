import { runAI } from "./ai/engine.js";

async function main() {
  const res = await runAI("Halo AI Mitra Nagari");
  console.log(res);
}

main();
