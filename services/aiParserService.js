const OpenAI = require("openai");

const AI_MODEL = process.env.OPENAI_MODEL || "openai/gpt-oss-120b";

function createServiceError(message, statusCode = 500) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function extractJsonString(content) {
  if (typeof content !== "string") {
    return "";
  }

  const trimmed = content.trim();

  if (trimmed.startsWith("```")) {
    return trimmed.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
  }

  return trimmed;
}

function getOpenAIClient() {
  if (!process.env.OPENAI_API_KEY) {
    throw createServiceError("OPENAI_API_KEY is not configured", 500);
  }

  const config = {
    apiKey: process.env.OPENAI_API_KEY,
  };

  if (process.env.OPENAI_BASE_URL) {
    config.baseURL = process.env.OPENAI_BASE_URL;
  }

  return new OpenAI(config);
}

async function parseUserInput(text) {
  if (typeof text !== "string" || text.trim().length === 0) {
    throw createServiceError("Text input is required", 400);
  }

  const prompt = `Extract financial details from the following input and return JSON with:
- income (number)
- rent (number)
- deductions (object with section80C, section80D, nps)

Only return valid JSON.

  Input: ${text}`;

  try {
    const client = getOpenAIClient();
    const response = await client.chat.completions.create({
      model: AI_MODEL,
      temperature: 0,
      messages: [
        {
          role: "system",
          content:
            "You extract structured financial data. Return only strict JSON with keys income, rent, and deductions.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const rawContent = response.choices && response.choices[0] && response.choices[0].message
      ? response.choices[0].message.content
      : "";
    const jsonString = extractJsonString(rawContent);
    const parsed = JSON.parse(jsonString);

    return {
      income: Number(parsed.income || 0),
      rent: Number(parsed.rent || 0),
      deductions: {
        section80C: Number(parsed.deductions && parsed.deductions.section80C || 0),
        section80D: Number(parsed.deductions && parsed.deductions.section80D || 0),
        nps: Number(parsed.deductions && parsed.deductions.nps || 0),
      },
    };
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw createServiceError("AI response could not be parsed as valid JSON", 502);
    }

    throw createServiceError(error.message || "Failed to parse input with AI", error.statusCode);
  }
}

module.exports = {
  parseUserInput,
};
