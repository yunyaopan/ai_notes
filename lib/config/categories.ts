export interface CategoryConfig {
  key: string;
  label: string;
  description: string;
  color: string;
}

export const CATEGORIES: CategoryConfig[] = [
  {
    key: 'other_emotions',
    label: 'Other Emotions',
    description: 'General emotional expressions (happiness, sadness, anger, etc.)',
    color: 'bg-blue-100 text-blue-800'
  },
  {
    key: 'insights',
    label: 'Insights',
    description: 'Realizations, learnings, or understanding gained',
    color: 'bg-green-100 text-green-800'
  },
  {
    key: 'gratitudes',
    label: 'Gratitudes',
    description: 'Things the person is grateful for or appreciates',
    color: 'bg-yellow-100 text-yellow-800'
  },
  {
    key: 'worries_anxiety',
    label: 'Worries & Anxiety',
    description: 'Concerns, fears, anxious thoughts, or stress',
    color: 'bg-red-100 text-red-800'
  },
  {
    key: 'affirmations',
    label: 'Affirmations',
    description: 'Positive affirmations, self-encouragement, or positive expectations',
    color: 'bg-green-100 text-green-800'
  },
  {
    key: 'ideas',
    label: 'Ideas',
    description: 'Product Ideas, Business Ideas',
    color: 'bg-purple-100 text-purple-800'
  },
  {
    key: 'experiments',
    label: 'Experiments',
    description: 'Self Experiments, Trials',
    color: 'bg-orange-100 text-orange-800'
  },
  {
    key: 'other',
    label: 'Other',
    description: 'Content that doesn\'t fit the above categories',
    color: 'bg-gray-100 text-gray-800'
  }
];

// Helper functions for easier access
export const getCategoryLabels = () => {
  return CATEGORIES.reduce((acc, category) => {
    acc[category.key] = category.label;
    return acc;
  }, {} as Record<string, string>);
};

export const getCategoryColors = () => {
  return CATEGORIES.reduce((acc, category) => {
    acc[category.key] = category.color;
    return acc;
  }, {} as Record<string, string>);
};

export const getCategoryKeys = () => {
  return CATEGORIES.map(category => category.key);
};

// Generate prompt text for AI categorization
export const generateCategoriesPrompt = () => {
  const categoriesList = CATEGORIES.map((category, index) => 
    `${index + 1}. "${category.key}" - ${category.description}`
  ).join('\n');
  
  return `Please separate the text into chunks based on line breaks. 

Then categorize the text into these categories:
${categoriesList}

Return the result as a JSON array where each object has:
- "content": the text chunk
- "category": one of the categories above`;
};
