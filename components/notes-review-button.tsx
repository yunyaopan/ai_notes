"use client";

import { useState, useEffect, useCallback } from "react";
import { MessageCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Conversation } from "@/components/ai/conversation";
import { Message } from "@/components/ai/message";
import { PromptInput } from "@/components/ai/prompt-input";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  id?: string;
}

interface NotesReviewButtonProps {
  userNotes?: string[];
}

const INITIAL_ANALYSIS_PROMPT = `我是一个 INFP（基于 Myers-Briggs Type Indicator）。我希望能成长为更高阶的infp。 以下是我最近的日记内容。 请帮我分析我成长为高阶infp的最重要的一个突破点。 给我3个具体的行动实验。 请直接、客观、以成长为目标，不需要安慰。用中文回答。`;

export function NotesReviewButton({ userNotes }: NotesReviewButtonProps) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);

  // Define fetchNotesAndInitialize before useEffect
  const fetchNotesAndInitialize = useCallback(async () => {
    try {
      // Fetch latest notes from the database
      const notesResponse = await fetch("/api/chunks", {
        method: "GET",
      });

      if (!notesResponse.ok) {
        throw new Error("Failed to fetch notes");
      }

      const notesData = await notesResponse.json();
      const chunks = notesData.chunks || [];

      // Get latest 30 notes (or all if fewer than 30 exist)
      const latestNotes = chunks.slice(0, 30);

      // Ensure we have notes and format them
      if (latestNotes.length === 0) {
        throw new Error("No notes found. Please add some notes first.");
      }

      // Format notes for context - include all fetched notes
      const notesContext = latestNotes
        .map(
          (chunk: { category?: string; content: string }) =>
            `[${chunk.category ?? "uncategorized"}]: ${chunk.content}`,
        )
        .join("\n\n");

      console.log(`Fetched ${latestNotes.length} notes for analysis`);

      // Create initial user message with notes context
      const initialUserMessage: ChatMessage = {
        role: "user",
        content: `${INITIAL_ANALYSIS_PROMPT}\n\nHere are my recent notes:\n\n${notesContext}`,
        id: `user-${Date.now()}`,
      };

      // Show user message
      setMessages([initialUserMessage]);

      // Send to AI for analysis
      const chatResponse = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [initialUserMessage],
        }),
      });

      if (!chatResponse.ok) {
        throw new Error("Failed to get AI analysis");
      }

      const chatData = await chatResponse.json();

      // Add AI response
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: chatData.message,
          id: `assistant-${Date.now()}`,
        },
      ]);

      setInitialized(true);
    } catch (error) {
      console.error("Error initializing chat:", error);
      setMessages([
        {
          role: "assistant",
          content:
            "Sorry, I encountered an error fetching your notes. Please try again.",
          id: `assistant-error-${Date.now()}`,
        },
      ]);
      setInitialized(true);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch latest notes and initialize with AI analysis
  useEffect(() => {
    if (open && !initialized) {
      fetchNotesAndInitialize();
    }
  }, [open, initialized, fetchNotesAndInitialize]);

  const handleSendMessage = async (input: string) => {
    if (!input.trim()) return;

    // Add user message
    const userMessage: ChatMessage = {
      role: "user",
      content: input,
      id: `user-${Date.now()}`,
    };
    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);

    try {
      // Prepare messages for API - include all previous messages
      const messagesToSend: ChatMessage[] = [...messages, userMessage];

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: messagesToSend,
          notes: userNotes,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to get response");
      }

      const data = await response.json();

      // Add assistant message
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.message,
          id: `assistant-${Date.now()}`,
        },
      ]);
    } catch (error) {
      console.error("Chat error:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, I encountered an error. Please try again later.",
          id: `assistant-error-${Date.now()}`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Review Button */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-8 right-8 z-40 rounded-full bg-primary text-primary-foreground p-4 shadow-lg hover:shadow-xl hover:scale-110 transition-all duration-200"
        title="Review your notes with AI"
        aria-label="Open notes review chat"
      >
        <MessageCircle className="h-6 w-6" />
      </button>

      {/* Chat Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="flex flex-col h-[600px] max-h-[90vh] w-full max-w-2xl gap-0 p-0">
          <DialogHeader className="border-b px-6 py-4">
            <DialogTitle>Notes Review Chat</DialogTitle>
          </DialogHeader>

          <div className="flex flex-col flex-1 overflow-hidden">
            {/* Conversation Area */}
            <Conversation className="flex-1">
              {messages.map((message) => (
                <Message
                  key={message.id}
                  role={message.role}
                  content={message.content}
                />
              ))}
            </Conversation>

            {/* Input Area */}
            <div className="border-t px-4 py-4">
              <PromptInput
                onSubmit={handleSendMessage}
                disabled={loading}
                placeholder="Ask follow-up questions about your notes..."
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
