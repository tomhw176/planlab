"use client";

import { useState, useCallback } from "react";
import { Pencil, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { SectionAIMenu } from "../ai/SectionAIMenu";
import { useAIGenerate } from "../ai/useAIGenerate";

export type AccentColor = "indigo" | "amber" | "emerald";

const ACCENT_CLASSES: Record<AccentColor, string> = {
  indigo: "border-l-primary",
  amber: "border-l-amber-500",
  emerald: "border-l-emerald-500",
};

interface LessonCardProps {
  title: string;
  sectionKey: string;
  accent: AccentColor;
  lessonId: string;
  isEmpty: boolean;
  children: (props: { editing: boolean }) => React.ReactNode;
  onSave: () => Promise<void> | void;
  onCancel: () => void;
  onAIAccept?: (content: string) => void;
  className?: string;
  span?: "full" | "half";
}

export function LessonCard({
  title,
  sectionKey,
  accent,
  lessonId,
  isEmpty,
  children,
  onSave,
  onCancel,
  onAIAccept,
  className,
  span = "half",
}: LessonCardProps) {
  const [editing, setEditing] = useState(false);
  const { generate, isLoading, result: aiPreview, clear: clearAI } = useAIGenerate(lessonId);
  const [lastAction, setLastAction] = useState<{ section: string; action: string } | null>(null);

  const handleSave = useCallback(async () => {
    await onSave();
    setEditing(false);
  }, [onSave]);

  const handleCancel = useCallback(() => {
    onCancel();
    setEditing(false);
  }, [onCancel]);

  const handleGenerate = useCallback(async (section: string, action: string) => {
    setLastAction({ section, action });
    await generate(section, action);
  }, [generate]);

  const handleAcceptAI = useCallback(() => {
    if (aiPreview && onAIAccept) {
      onAIAccept(aiPreview);
    }
    clearAI();
  }, [aiPreview, onAIAccept, clearAI]);

  const handleRejectAI = useCallback(() => {
    clearAI();
  }, [clearAI]);

  const handleRegenerate = useCallback(() => {
    if (lastAction) {
      handleGenerate(lastAction.section, lastAction.action);
    }
  }, [lastAction, handleGenerate]);

  return (
    <div
      className={cn(
        "bg-surface rounded-xl shadow-sm border-l-4 border border-border",
        ACCENT_CLASSES[accent],
        span === "full" ? "col-span-full" : "",
        className
      )}
    >
      {/* Card Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/50">
        <h4 className="text-xs font-semibold text-muted uppercase tracking-wider">
          {title}
        </h4>
        <div className="flex items-center gap-1">
          <SectionAIMenu
            sectionKey={sectionKey}
            isGenerating={isLoading}
            aiPreview={aiPreview}
            onGenerate={handleGenerate}
            onAccept={handleAcceptAI}
            onReject={handleRejectAI}
            onRegenerate={handleRegenerate}
            lastAction={lastAction}
          />
          {editing ? (
            <>
              <button
                onClick={handleSave}
                className="p-1 rounded text-success hover:bg-success/10 transition-colors"
                title="Save"
              >
                <Check size={14} />
              </button>
              <button
                onClick={handleCancel}
                className="p-1 rounded text-danger hover:bg-danger/10 transition-colors"
                title="Cancel"
              >
                <X size={14} />
              </button>
            </>
          ) : (
            <button
              onClick={() => setEditing(true)}
              className="p-1 rounded text-muted hover:text-foreground hover:bg-surface-hover transition-colors"
              title="Edit"
            >
              <Pencil size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Card Body */}
      <div className="px-4 py-3">
        {/* AI Preview */}
        {aiPreview !== null && (
          <div className="mb-3 p-3 rounded-lg bg-primary/5 border border-primary/20">
            <p className="text-xs font-medium text-primary mb-1">AI Suggestion</p>
            <p className="text-sm whitespace-pre-wrap">{aiPreview}</p>
          </div>
        )}

        {isEmpty && !editing && aiPreview === null ? (
          <div className="py-3 text-center">
            <p className="text-sm text-muted italic">Not yet defined</p>
          </div>
        ) : (
          children({ editing })
        )}
      </div>
    </div>
  );
}
