import OpenAI from "openai";
import { SYSTEM_PROMPT } from "./prompt.js";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export async function runAI(message) {
  const completion = await client.chat.completions.create({
    model: "gpt-5.2",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: message }
    ]
  });

  return completion.choices[0].message.content;
}
