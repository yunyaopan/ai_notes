import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ensureSubscription, isSubscriptionOn } from "@/lib/api/subscription";
import OpenAI from "openai";

const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
  defaultHeaders: {
    "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
    "X-Title": "AI Notes App",
  },
});

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface ChatRequest {
  messages: ChatMessage[];
  notes?: string[];
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check if user is authenticated
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Ensure subscription exists and check access
    await ensureSubscription(user);
    const hasAccess = await isSubscriptionOn(user);
    if (!hasAccess) {
      return NextResponse.json(
        { error: "Active subscription required" },
        { status: 403 },
      );
    }

    const body: ChatRequest = await request.json();

    if (!body.messages || !Array.isArray(body.messages)) {
      return NextResponse.json(
        { error: "Messages array is required" },
        { status: 400 },
      );
    }

    if (body.messages.length === 0) {
      return NextResponse.json(
        { error: "At least one message is required" },
        { status: 400 },
      );
    }

    // Build the system prompt
    const systemPrompt = `You are a helpful AI assistant reviewing the user's recent notes and journal entries. 
Your role is to help the user reflect on their thoughts, emotions, and experiences.
You provide thoughtful insights, ask clarifying questions, and offer supportive guidance.
Be empathetic, constructive, and encouraging in all your responses.`;

    // Prepare messages for OpenRouter API
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: "system", content: systemPrompt },
      ...body.messages,
    ];

    // Force chat API to use GPT-5.2 on OpenRouter. Do not change this
    // if you want chat to always use gpt-5.2. Text categorization uses
    // a different file (`lib/api/openrouter.ts`) and remains unchanged.
    const completion = await openai.chat.completions.create({
      model: "openai/gpt-5.2-chat",
      messages,
      temperature: 0.7,
      max_tokens: 1000,
    });

    const response = completion.choices[0]?.message?.content;
    if (!response) {
      throw new Error("No response from AI model");
    }

    return NextResponse.json({
      message: response,
      role: "assistant",
    });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: "Failed to get chat response" },
      { status: 500 },
    );
  }
}
