import { cn } from "@/lib/utils";
import { Bot, User } from "lucide-react";

export function Message({
  role,
  content,
}: {
  role: "user" | "assistant";
  content: string;
}) {
  const isUser = role === "user";

  return (
    <div
      className={cn(
        "flex gap-3 animate-in fade-in slide-in-from-bottom-2",
        isUser && "flex-row-reverse",
      )}
    >
      <div
        className={cn(
          "flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-md border",
          isUser ? "bg-background" : "bg-primary text-primary-foreground",
        )}
      >
        {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
      </div>
      <div
        className={cn(
          "flex max-w-md gap-2 rounded-lg px-3 py-2 text-sm",
          isUser
            ? "rounded-br-none bg-primary text-primary-foreground"
            : "rounded-bl-none bg-muted",
        )}
      >
        <p className="leading-relaxed whitespace-pre-wrap">{content}</p>
      </div>
    </div>
  );
}
