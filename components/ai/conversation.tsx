import { cn } from "@/lib/utils";
import React from "react";

export function Conversation({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [children]);

  return (
    <div
      className={cn("flex flex-col gap-4 overflow-y-auto h-full", className)}
    >
      {children}
      <div ref={messagesEndRef} />
    </div>
  );
}
