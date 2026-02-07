import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function runAI(message) {

  const completion = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: "Kamu adalah AI Mitra Nagari. Jawab singkat, ramah, profesional."
      },
      { role: "user", content: message }
    ],
  });

  return completion.choices[0].message.content;
}
