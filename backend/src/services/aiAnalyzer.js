import axios from "axios";

export async function analyzeJob(code) {
  const systemPrompt = `
You are a strict job execution planner.
You MUST return ONLY valid JSON.
No explanations.
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

  let res;

  try {
    res = await axios.post(
      "https://models.inference.ai.azure.com",
      {
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
          "Content-Type": "application/json",
        },
        timeout: 15000,
      }
    );
  } catch (err) {
    console.error("AI API error:", err.response?.data || err.message);
    throw new Error("AI planner request failed");
  }

  const raw = res.data.choices?.[0]?.message?.content;

  if (!raw) {
    throw new Error("Empty AI response");
  }

  const cleaned = raw
    .trim()
    .replace(/^```json/, "")
    .replace(/^```/, "")
    .replace(/```$/, "");

  try {
    return JSON.parse(cleaned);
  } catch {
    console.error("Invalid JSON from AI:", cleaned);
    throw new Error("AI returned invalid JSON");
  }
}
