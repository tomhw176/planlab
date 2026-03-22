"use client";

import { useState } from "react";
import {
  Sparkles,
  MessageSquare,
  Loader2,
  Wand2,
  CheckCircle,
  Compass,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  lessonId: string;
  onFullGenerate: () => void;
  onReview: () => void;
  onAlignCurriculum: () => void;
  onAdjustTiming: () => void;
  onToggleChat: () => void;
  chatOpen: boolean;
  isGenerating: boolean;
  generatingAction: string | null;
}

const ACTIONS = [
  {
    key: "full_plan",
    label: "Generate Full Plan",
    icon: Wand2,
    color: "text-primary",
  },
  {
    key: "review",
    label: "Review & Improve",
    icon: CheckCircle,
    color: "text-emerald-600",
  },
  {
    key: "align",
    label: "Align to Curriculum",
    icon: Compass,
    color: "text-amber-600",
  },
  {
    key: "timing",
    label: "Adjust Timing",
    icon: Clock,
    color: "text-violet-600",
  },
];

export function LessonAIBar({
  lessonId,
  onFullGenerate,
  onReview,
  onAlignCurriculum,
  onAdjustTiming,
  onToggleChat,
  chatOpen,
  isGenerating,
  generatingAction,
}: Props) {
  const handlers: Record<string, () => void> = {
    full_plan: onFullGenerate,
    review: onReview,
    align: onAlignCurriculum,
    timing: onAdjustTiming,
  };

  return (
    <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border bg-surface/80 backdrop-blur-sm">
      <Sparkles size={16} className="text-primary shrink-0" />
      <span className="text-xs font-semibold text-muted uppercase tracking-wider mr-1">AI</span>

      <div className="flex gap-1.5 flex-1 flex-wrap">
        {ACTIONS.map((action) => {
          const Icon = action.icon;
          const isActive = generatingAction === action.key;

          return (
            <button
              key={action.key}
              onClick={() => handlers[action.key]?.()}
              disabled={isGenerating}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full border transition-all",
                isActive
                  ? "bg-primary/10 border-primary/30 text-primary"
                  : "border-border hover:border-primary/30 hover:bg-primary/5 text-foreground",
                isGenerating && !isActive && "opacity-50 cursor-not-allowed"
              )}
            >
              {isActive ? (
                <Loader2 size={12} className="animate-spin" />
              ) : (
                <Icon size={12} className={action.color} />
              )}
              {action.label}
            </button>
          );
        })}
      </div>

      <button
        onClick={onToggleChat}
        className={cn(
          "flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full border transition-all",
          chatOpen
            ? "bg-primary text-white border-primary"
            : "border-border hover:border-primary/30 hover:bg-primary/5"
        )}
      >
        <MessageSquare size={12} />
        Chat
      </button>
    </div>
  );
}
