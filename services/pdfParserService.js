const fs = require("fs");
const OpenAI = require("openai");
const { PDFParse } = require("pdf-parse");

const AI_MODEL = process.env.OPENAI_MODEL || "openai/gpt-oss-120b";

function createServiceError(message, statusCode = 500) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function toNullableNumber(value) {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  const textValue = String(value);
  const normalized = textValue.replace(/,/g, "").trim();
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function extractValue(text, keyword) {
  const escapedKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(
    `${escapedKeyword}\\s*[:\\-]?\\s*(?:Rs\\.?\\s*)?([0-9][0-9,]*(?:\\.\\d+)?)`,
    "i"
  );
  const match = text.match(pattern);
  const value = toNullableNumber(match && match[1]);
  return value;
}

function extractFirstMatchingValue(text, keywords) {
  for (const keyword of keywords) {
    const value = extractValue(text, keyword);
    if (value !== null) {
      return value;
    }
  }

  return null;
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

function normalizeAiResult(parsed) {
  const deductions = parsed && typeof parsed === "object" ? parsed.deductions : {};

  const deduction80C = toNullableNumber(
    deductions && (deductions["80C"] ?? deductions.section80C)
  );
  const deduction80D = toNullableNumber(
    deductions && (deductions["80D"] ?? deductions.section80D)
  );
  const deductionNps = toNullableNumber(deductions && deductions.nps);

  const grossSalary = toNullableNumber(
    parsed && (parsed.grossSalary ?? parsed.salary)
  );

  return {
    income: toNullableNumber(parsed && parsed.income),
    grossSalary,
    salary: grossSalary,
    hra: toNullableNumber(parsed && parsed.hra),
    taxDeducted: toNullableNumber(parsed && parsed.taxDeducted),
    deductions: {
      "80C": deduction80C,
      "80D": deduction80D,
      nps: deductionNps,
    },
  };
}

async function extractWithAI(text) {
  if (!text || !text.trim()) {
    return null;
  }

  try {
    const client = getOpenAIClient();
    const response = await client.chat.completions.create({
      model: AI_MODEL,
      temperature: 0,
      messages: [
        {
          role: "system",
          content: "You extract structured financial data from Form 16. Return strict JSON only.",
        },
        {
          role: "user",
          content: `Extract financial details from this Form 16 text.
Return JSON with:
- income
- grossSalary
- hra
- taxDeducted
- deductions (80C, 80D, nps)
Only return valid JSON.

Text:
${text}`,
        },
      ],
    });

    const rawContent = response.choices && response.choices[0] && response.choices[0].message
      ? response.choices[0].message.content
      : "";
    const jsonString = extractJsonString(rawContent);
    const parsed = JSON.parse(jsonString);
    return normalizeAiResult(parsed);
  } catch (error) {
    return null;
  }
}

function extractWithRegex(text) {
  const grossSalary = extractFirstMatchingValue(text, [
    "Gross Salary",
    "Gross Salary Received",
    "Salary as per provisions",
  ]);

  return {
    income: extractFirstMatchingValue(text, [
      "Total Income",
      "Gross Total Income",
      "Total Taxable Income",
      "Income Chargeable under the head Salaries",
    ]),
    grossSalary,
    salary: grossSalary,
    hra: extractFirstMatchingValue(text, [
      "HRA Exempt",
      "House Rent Allowance",
      "HRA",
    ]),
    taxDeducted: extractFirstMatchingValue(text, [
      "Tax Deducted",
      "Tax Deducted at Source",
      "TDS",
      "Total tax deposited",
    ]),
    deductions: {
      "80C": extractFirstMatchingValue(text, [
        "80C",
        "Section 80C",
      ]),
      "80D": extractFirstMatchingValue(text, [
        "80D",
        "Section 80D",
      ]),
      nps: extractFirstMatchingValue(text, [
        "NPS",
        "Section 80CCD",
      ]),
    },
  };
}

function mergeHybridResult(aiResult, regexResult) {
  const primary = aiResult || {};
  const fallback = regexResult || {};
  const primaryDeductions = primary.deductions || {};
  const fallbackDeductions = fallback.deductions || {};

  return {
    income: primary.income ?? fallback.income ?? null,
    grossSalary: primary.grossSalary ?? fallback.grossSalary ?? null,
    salary: primary.salary ?? fallback.salary ?? null,
    hra: primary.hra ?? fallback.hra ?? null,
    taxDeducted: primary.taxDeducted ?? fallback.taxDeducted ?? null,
    deductions: {
      "80C": primaryDeductions["80C"] ?? fallbackDeductions["80C"] ?? null,
      "80D": primaryDeductions["80D"] ?? fallbackDeductions["80D"] ?? null,
      nps: primaryDeductions.nps ?? fallbackDeductions.nps ?? null,
    },
  };
}

async function parsePDF(filePath) {
  if (!filePath) {
    throw createServiceError("filePath is required", 400);
  }

  let parser;

  try {
    const buffer = fs.readFileSync(filePath);
    parser = new PDFParse({ data: buffer });
    const parsedPdf = await parser.getText();
    const text = parsedPdf && parsedPdf.text ? parsedPdf.text : "";
    const aiResult = await extractWithAI(text);
    const regexResult = extractWithRegex(text);
    return mergeHybridResult(aiResult, regexResult);
  } catch (error) {
    throw createServiceError(`Failed to parse PDF document: ${error.message}`, 500);
  } finally {
    if (parser) {
      await parser.destroy().catch(() => {});
    }
  }
}

module.exports = {
  parsePDF,
};
