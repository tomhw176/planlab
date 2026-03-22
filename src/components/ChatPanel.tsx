"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Loader2, Bot, User, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatPanelProps {
  context: {
    courseId?: string;
    unitId?: string;
    lessonId?: string;
    resourceId?: string;
  };
  onRefresh: () => void;
}

interface Message {
  role: "user" | "assistant";
  content: string;
}

const QUICK_ACTIONS = [
  { label: "Generate lesson plan", prompt: "Generate a detailed lesson plan for:" },
  { label: "Create worksheet", prompt: "Create a worksheet for the current lesson that includes:" },
  { label: "Create rubric", prompt: "Create an assessment rubric for:" },
  { label: "Suggest activities", prompt: "Suggest engaging student activities for:" },
  { label: "Align to curriculum", prompt: "Help me align this to BC curriculum standards:" },
  { label: "Improve this plan", prompt: "Review and suggest improvements for the current lesson plan." },
];

export function ChatPanel({ context, onRefresh }: ChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [chatId, setChatId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (messageText?: string) => {
    const text = messageText ?? input.trim();
    if (!text || loading) return;

    const userMsg: Message = { role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          chatId,
          ...context,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to get response");
      }

      const data = await res.json();
      setChatId(data.chatId);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.response },
      ]);
      onRefresh();
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `Error: ${err instanceof Error ? err.message : "Something went wrong"}. Make sure your ANTHROPIC_API_KEY is set in .env`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="w-96 border-l border-border bg-surface flex flex-col h-full">
      {/* Header */}
      <div className="p-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Sparkles size={16} className="text-primary" />
          <h2 className="font-semibold text-sm">AI Assistant</h2>
        </div>
        <p className="text-xs text-muted mt-0.5">
          {context.lessonId
            ? "Lesson context"
            : context.unitId
              ? "Unit context"
              : context.courseId
                ? "Course context"
                : "General"}
        </p>
      </div>

      {/* Quick Actions */}
      {messages.length === 0 && (
        <div className="p-3 border-b border-border">
          <p className="text-xs text-muted mb-2">Quick actions:</p>
          <div className="flex flex-wrap gap-1.5">
            {QUICK_ACTIONS.map((action) => (
              <button
                key={action.label}
                onClick={() => setInput(action.prompt)}
                className="text-xs px-2 py-1 bg-primary/10 text-primary rounded-full hover:bg-primary/20 transition-colors"
              >
                {action.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-muted text-sm py-8">
            <Bot size={32} className="mx-auto mb-3 opacity-30" />
            <p>Ask me to help plan lessons, generate resources, or improve your curriculum.</p>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className={cn(
              "flex gap-2",
              msg.role === "user" ? "justify-end" : "justify-start"
            )}
          >
            {msg.role === "assistant" && (
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                <Bot size={14} className="text-primary" />
              </div>
            )}
            <div
              className={cn(
                "rounded-lg px-3 py-2 text-sm max-w-[85%] whitespace-pre-wrap",
                msg.role === "user"
                  ? "bg-primary text-white"
                  : "bg-background border border-border"
              )}
            >
              {msg.content}
            </div>
            {msg.role === "user" && (
              <div className="w-6 h-6 rounded-full bg-foreground/10 flex items-center justify-center shrink-0 mt-0.5">
                <User size={14} className="text-foreground" />
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex gap-2">
            <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <Loader2 size={14} className="text-primary animate-spin" />
            </div>
            <div className="bg-background border border-border rounded-lg px-3 py-2 text-sm text-muted">
              Thinking...
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-border">
        <div className="flex gap-2">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about your curriculum..."
            rows={2}
            className="flex-1 px-3 py-2 text-sm border border-border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
          <button
            onClick={() => sendMessage()}
            disabled={!input.trim() || loading}
            className={cn(
              "px-3 rounded-lg transition-colors self-end",
              input.trim() && !loading
                ? "bg-primary text-white hover:bg-primary-dark"
                : "bg-border text-muted cursor-not-allowed"
            )}
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
