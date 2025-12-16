export interface CategoryConfig {
  key: string;
  label: string;
  description: string;
  color: string;
  rankable?: boolean; // Whether this category supports ranking/priority
}

export const CATEGORIES: CategoryConfig[] = [
  {
    key: "other_emotions",
    label: "Other Emotions",
    description:
      "General emotional expressions (happiness, sadness, anger, etc.)",
    color:
      "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200",
  },
  {
    key: "insights",
    label: "Insights",
    description: "Realizations, learnings, or understanding gained",
    color:
      "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200",
  },
  {
    key: "gratitudes",
    label: "Gratitudes",
    description: "Things the person is grateful for or appreciates",
    color:
      "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-200",
  },
  {
    key: "worries_anxiety",
    label: "Worries & Anxiety",
    description: "Concerns, fears, anxious thoughts, or stress",
    color: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200",
  },
  {
    key: "affirmations",
    label: "Affirmations",
    description:
      "Positive affirmations, self-encouragement, or positive expectations",
    color:
      "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200",
  },
  {
    key: "ideas",
    label: "Ideas",
    description: "Product Ideas, Business Ideas",
    color:
      "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-200",
    rankable: true,
  },
  {
    key: "experiments",
    label: "Experiments",
    description: "Self Experiments, Trials",
    color:
      "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-200",
    rankable: true,
  },
  {
    key: "wish",
    label: "Wishes",
    description: "Wishes, Dreams, Desires",
    color: "bg-pink-100 text-pink-800 dark:bg-pink-900/40 dark:text-pink-200",
    rankable: true,
  },
  {
    key: "questions",
    label: "Questions",
    description:
      "Questions, inquiries, or things the person is wondering about",
    color:
      "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-200",
    rankable: true,
  },
  {
    key: "other",
    label: "Other",
    description: "Content that doesn't fit the above categories",
    color: "bg-gray-100 text-gray-800 dark:bg-gray-800/40 dark:text-gray-200",
  },
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

// Map category keys to badge variants for proper dark mode support
const categoryVariantMap: Record<
  string,
  | "category-amber"
  | "category-green"
  | "category-yellow"
  | "category-red"
  | "category-orange"
  | "category-pink"
  | "category-indigo"
  | "category-gray"
> = {
  other_emotions: "category-amber",
  insights: "category-green",
  gratitudes: "category-yellow",
  worries_anxiety: "category-red",
  affirmations: "category-green",
  ideas: "category-orange",
  experiments: "category-orange",
  wish: "category-pink",
  questions: "category-indigo",
  other: "category-gray",
};

export const getCategoryBadgeVariant = (categoryKey: string) => {
  return categoryVariantMap[categoryKey] || "category-gray";
};

export const getCategoryKeys = () => {
  return CATEGORIES.map((category) => category.key);
};

export const getRankableCategories = () => {
  return CATEGORIES.filter((category) => category.rankable);
};

export const isCategoryRankable = (categoryKey: string) => {
  const category = CATEGORIES.find((cat) => cat.key === categoryKey);
  return category?.rankable || false;
};

// Generate prompt text for AI categorization
export const generateCategoriesPrompt = () => {
  const categoriesList = CATEGORIES.map(
    (category, index) =>
      `${index + 1}. "${category.key}" - ${category.description}`
  ).join("\n");

  return `Categorize the text into these categories:
${categoriesList}

Return the result as a JSON array which only contains one object:
- "content": the originaltext chunk
- "category": one of the categories above`;
};
