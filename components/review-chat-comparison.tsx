import { useState, useEffect, useCallback } from "react";
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

interface ReviewChatComparisonProps {
  userNotes?: string[];
}

const ANGLES = [
  {
    label: "INFP成长",
    prompt: `我是一个 INFP（基于 Myers-Briggs Type Indicator）。我希望能成长为更高阶的infp。 以下是我最近的日记内容。 请帮我分析我成长为高阶infp的最重要的一个突破点。 给我3个具体的行动实验。 请直接、客观、以成长为目标，不需要安慰。用中文回答。`,
  },
  {
    label: "道德经视角",
    prompt: `请用道德经的智慧 (请列出与我的日记最相关的道德经原文以及提供解释帮助我理解如何能运用到自己情况上），结合我最近的日记内容，分析我目前最重要的成长突破点，并给出3个具体的行动建议。用中文回答。`,
  },
  {
    label: "Why Buddhism is True",
    prompt: `请以《Why Buddhism is True》的作者视角(请列出与我的日记最相关的观点以及提供解释帮助我理解如何能运用到自己情况上），结合我最近的日记内容，分析我目前最重要的成长突破点，并给出3个具体的行动建议。用中文回答。`,
  },
];

function SingleReviewChat({
  prompt,
  userNotes,
  label,
}: {
  prompt: string;
  userNotes?: string[];
  label: string;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);

  const fetchNotesAndInitialize = useCallback(async () => {
    try {
      const notesResponse = await fetch("/api/chunks", { method: "GET" });
      if (!notesResponse.ok) throw new Error("Failed to fetch notes");
      const notesData = await notesResponse.json();
      const chunks = notesData.chunks || [];
      const latestNotes = chunks.slice(0, 30);
      if (latestNotes.length === 0)
        throw new Error("No notes found. Please add some notes first.");
      const notesContext = latestNotes
        .map(
          (chunk: { category?: string; content: string }) =>
            `[${chunk.category ?? "uncategorized"}]: ${chunk.content}`,
        )
        .join("\n\n");
      const initialUserMessage: ChatMessage = {
        role: "user",
        content: `${prompt}\n\nHere are my recent notes:\n\n${notesContext}`,
        id: `user-${Date.now()}`,
      };
      setMessages([initialUserMessage]);
      const chatResponse = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [initialUserMessage] }),
      });
      if (!chatResponse.ok) throw new Error("Failed to get AI analysis");
      const chatData = await chatResponse.json();
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: chatData.message,
          id: `assistant-${Date.now()}`,
        },
      ]);
      setInitialized(true);
    } catch {
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
  }, [prompt]);

  useEffect(() => {
    if (!initialized) fetchNotesAndInitialize();
  }, [initialized, fetchNotesAndInitialize]);

  const handleSendMessage = async (input: string) => {
    if (!input.trim()) return;
    const userMessage: ChatMessage = {
      role: "user",
      content: input,
      id: `user-${Date.now()}`,
    };
    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);
    try {
      const messagesToSend: ChatMessage[] = [...messages, userMessage];
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: messagesToSend, notes: userNotes }),
      });
      if (!response.ok) throw new Error("Failed to get response");
      const data = await response.json();
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.message,
          id: `assistant-${Date.now()}`,
        },
      ]);
    } catch {
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
    <div className="flex flex-col border rounded-lg m-2 flex-1 min-w-[340px] max-w-full bg-white shadow h-full">
      <div className="border-b px-4 py-2 font-bold text-center bg-gray-50">
        {label}
      </div>
      <Conversation className="flex-1 p-2 overflow-y-auto min-h-[200px]">
        {messages.map((message) => (
          <Message
            key={message.id}
            role={message.role}
            content={message.content}
          />
        ))}
      </Conversation>
      <div className="border-t px-2 py-2">
        <PromptInput
          onSubmit={handleSendMessage}
          disabled={loading}
          placeholder="Ask follow-up..."
        />
      </div>
    </div>
  );
}

export function ReviewChatComparison({ userNotes }: ReviewChatComparisonProps) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-8 right-8 z-40 rounded-full bg-primary text-primary-foreground p-4 shadow-lg hover:shadow-xl hover:scale-110 transition-all duration-200"
        title="Review your notes with AI (Comparison)"
        aria-label="Open notes review chat comparison"
      >
        <span className="font-bold">AI对比</span>
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="flex flex-col h-[90vh] max-h-[98vh] w-full max-w-[98vw] gap-0 p-0">
          <DialogHeader className="border-b px-6 py-4">
            <DialogTitle>Notes Review Chat Comparison</DialogTitle>
          </DialogHeader>
          <div className="flex flex-row flex-1 overflow-x-auto gap-4 p-4 bg-gray-50 min-h-0">
            {ANGLES.map((angle) => (
              <SingleReviewChat
                key={angle.label}
                prompt={angle.prompt}
                label={angle.label}
                userNotes={userNotes}
              />
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
