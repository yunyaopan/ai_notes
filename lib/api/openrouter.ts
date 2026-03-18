import OpenAI from "openai";
import { generateCategoriesPrompt } from "@/lib/config/categories";

const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
  defaultHeaders: {
    "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
    "X-Title": "AI Notes App",
  },
});

export async function categorizeText(
  text: string,
): Promise<Array<{ content: string; category: string }>> {
  const categoriesPrompt = generateCategoriesPrompt();
  const prompt = `${categoriesPrompt}

Text to analyze:
${text}

`;

  const completion = await openai.chat.completions.create({
    model: "openai/gpt-4.1-nano",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.3,
    max_tokens: 4096,
  });

  const response = completion.choices[0]?.message?.content;
  if (!response) {
    throw new Error("No response from AI model");
  }

  try {
    const cleaned = response.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
    const chunks = JSON.parse(cleaned);
    const result = Array.isArray(chunks) ? chunks : [chunks];
    console.log("AI categorization result:", JSON.stringify(result, null, 2));
    // Normalize common category mismatches from the model
    const categoryAliases: Record<string, string> = {
      wishes: "wish",
      worry: "worries_anxiety",
      anxiety: "worries_anxiety",
      emotion: "other_emotions",
      emotions: "other_emotions",
      insight: "insights",
      gratitude: "gratitudes",
      affirmation: "affirmations",
      idea: "ideas",
      experiment: "experiments",
      question: "questions",
    };
    return result.map((chunk) => ({
      ...chunk,
      category: categoryAliases[chunk.category] ?? chunk.category,
    }));
  } catch (error) {
    console.error("Failed to parse AI response:", error, "\nRaw response:", response);
    throw new Error("Invalid response format from AI model");
  }
}
