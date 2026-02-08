import dotenv from "dotenv";
dotenv.config();
import axios from "axios";

const API_KEY = process.env.OPENROUTER_TOKEN;

export async function analyzeJob(code) {
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
      // ✅ use a REAL free model
      model: "openrouter/free",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0
    },
    {
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        "Content-Type": "application/json"
      }
    }
  );

  const raw = response.data?.choices?.[0]?.message?.content;
  if (!raw) {
    throw new Error("Empty AI response");
  }

  // 🔒 NEVER parse raw AI output directly
  const extracted = extractJson(raw);

  // 🔒 Normalize for scheduler safety
  return normalizePlan(extracted);
}

/* --------------------------------
   SAFE JSON EXTRACTION
--------------------------------- */
function extractJson(raw) {
  const match = raw.match(/\{[\s\S]*\}/);

  if (!match) {
    console.error("AI RAW OUTPUT:\n", raw);
    throw new Error("AI response does not contain valid JSON");
  }

  try {
    return JSON.parse(match[0]);
  } catch (err) {
    console.error("INVALID JSON BLOCK:\n", match[0]);
    throw err;
  }
}

/* --------------------------------
   NORMALIZATION (VERY IMPORTANT)
--------------------------------- */
function normalizePlan(plan) {
  return {
    language: String(plan.language || "python").toLowerCase(),
    runtime: plan.runtime || "python3",
    dependencies: Array.isArray(plan.dependencies)
      ? plan.dependencies
      : [],
    requirements: {
      minMemoryMB: Math.max(plan.requirements?.minMemoryMB || 256, 256),
      cpuCores: Math.max(plan.requirements?.cpuCores || 1, 1),
      gpu: Boolean(plan.requirements?.gpu),
      gpuMemoryMB: plan.requirements?.gpu
        ? Math.max(plan.requirements?.gpuMemoryMB || 1024, 1024)
        : null
    }
  };
}
