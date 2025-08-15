import OpenAI from 'openai';

const openai = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY,
  defaultHeaders: {
    'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
    'X-Title': 'AI Notes App',
  },
});

export async function categorizeText(text: string) {
  const prompt = `
Separate the text into chunks based on line breaks. 

Categorize the text into these categories:
1. "other_emotions" - General emotional expressions (happiness, sadness, anger, etc.)
2. "insights" - Realizations, learnings, or understanding gained
3. "gratitudes" - Things the person is grateful for or appreciates
4. "worries_anxiety" - Concerns, fears, anxious thoughts, or stress
5. "affirmations" - Positive affirmations, self-encouragement, or positive statements
6. "other" - Content that doesn't fit the above categories

Return the result as a JSON array where each object has:
- "content": the text chunk
- "category": one of the five categories above

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
