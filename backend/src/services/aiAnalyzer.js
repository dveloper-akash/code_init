import axios from "axios";

const API_KEY = process.env.OPENROUTER_TOKEN;

export async function aiAnalyzer(code) {
  const systemPrompt = `
You are a strict job execution planner.
Return ONLY valid JSON.
No explanations.
No markdown.
`;

  const userPrompt = `
Analyze the code and return execution requirements in this JSON format:

{
  "language": "string",
  "runtime": "string",
  "dependencies": ["string"],
  "requirements": {
    "minMemoryMB": number,
    "cpuCores": number,
    "gpu": boolean,
    "gpuMemoryMB": number | null
  }
}

Code:
${code}
`;

  const response = await axios.post(
    "https://openrouter.ai/api/v1/chat/completions",
    {
      model: "openrouter/free",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0
    },
    {
      headers: {
        "Authorization": `Bearer ${API_KEY}`,
        "Content-Type": "application/json"
      }
    }
  );

  const raw = response.data.choices?.[0]?.message?.content;
  if (!raw) throw new Error("Empty response");

  const cleaned = raw
    .replace(/^```json/, "")
    .replace(/^```/, "")
    .replace(/```$/, "")
    .trim();

  return JSON.parse(cleaned);
}
