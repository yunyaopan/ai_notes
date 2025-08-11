# AI Text Categorizer Setup

This application allows users to input long text and have it automatically categorized into different emotional and thematic categories using AI.

## Features

- **Text Input**: Users can enter long text passages
- **AI Categorization**: Uses OpenRouter's GPT model to categorize text into:
  - Other Emotions
  - Insights
  - Gratitudes
  - Worries & Anxiety
  - Other
- **Review & Edit**: Users can review and modify the categorization before saving
- **Database Storage**: Saves categorized chunks to Supabase with user authentication
- **History View**: View all previously saved chunks organized by category

## Setup Instructions

### 1. Environment Variables

Add these environment variables to your `.env.local` file:

```bash
# Existing Supabase variables (already configured)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY=your_supabase_anon_key

# New OpenRouter API Key
OPENROUTER_API_KEY=your_openrouter_api_key

# Optional: Your site URL for OpenRouter attribution
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 2. Get OpenRouter API Key

1. Go to [OpenRouter.ai](https://openrouter.ai/)
2. Sign up for an account
3. Navigate to your API Keys section
4. Create a new API key
5. Add credits to your account (the app uses GPT-3.5-turbo which is very affordable)

### 3. Database Setup

Run the SQL script in your Supabase SQL Editor:

```sql
-- Copy and paste the contents of database-schema.sql into Supabase SQL Editor
```

Or run this command if you have Supabase CLI:

```bash
supabase db push
```

### 4. Install Dependencies

The OpenAI SDK has already been installed. If you need to install it manually:

```bash
npm install openai
```

### 5. Development

Start the development server:

```bash
npm run dev
```

Visit `http://localhost:3000/protected` (after logging in) to use the text categorizer.

## API Endpoints

- `POST /api/categorize` - Categorizes text using OpenRouter AI
- `POST /api/chunks` - Saves confirmed chunks to database
- `GET /api/chunks` - Retrieves user's saved chunks

## Database Schema

The `text_chunks` table stores:
- `id` - UUID primary key
- `content` - The text chunk
- `category` - One of the five categories
- `user_id` - References the authenticated user
- `created_at` - Timestamp
- `updated_at` - Timestamp (auto-updated)

Row Level Security (RLS) is enabled to ensure users can only access their own data.

## Usage

1. Navigate to the protected page (`/protected`)
2. Enter your text in the text area (minimum 10 characters)
3. Click "Categorize Text" to process with AI
4. Review the categorized chunks
5. Edit categories or content if needed
6. Click "Save Chunks" to store in database
7. View your saved chunks below the form

## Model Information

The app uses OpenRouter's `openai/gpt-3.5-turbo` model, which is cost-effective and suitable for text categorization tasks. You can modify the model in `/lib/api/openrouter.ts` if needed.

## Troubleshooting

1. **Authentication errors**: Ensure you're logged in and Supabase is configured correctly
2. **OpenRouter errors**: Check your API key and account credits
3. **Database errors**: Verify the database schema was created successfully
4. **CORS issues**: Ensure `NEXT_PUBLIC_SITE_URL` is set correctly
