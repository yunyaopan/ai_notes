import OpenAI from 'openai';
import { generateCategoriesPrompt } from '@/lib/config/categories';

const openai = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY,
  defaultHeaders: {
    'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
    'X-Title': 'AI Notes App',
  },
});

export async function categorizeText(text: string) {
  const categoriesPrompt = generateCategoriesPrompt();
  const prompt = `${categoriesPrompt}

Text to analyze:
${text}

`;

  const completion = await openai.chat.completions.create({
    model: 'openai/gpt-3.5-turbo',
    messages: [
      { role: 'user', content: prompt }
    ],
    temperature: 0.3,
  });

  const response = completion.choices[0]?.message?.content;
  if (!response) {
    throw new Error('No response from AI model');
  }

  try {
    const chunks = JSON.parse(response);
    return chunks;
  } catch (error) {
    console.error('Failed to parse AI response:', error);
    throw new Error('Invalid response format from AI model');
  }
}
