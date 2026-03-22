"use client";

import { useState, useRef, useEffect } from "react";
import { Sparkles, Loader2, Check, X, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

interface AIAction {
  label: string;
  action: string;
}

// Per-section AI actions
export const SECTION_AI_ACTIONS: Record<string, AIAction[]> = {
  curriculumConnection: [
    { label: "Align to BC Curriculum", action: "align_curriculum" },
    { label: "Suggest Big Ideas", action: "suggest_big_ideas" },
  ],
  learningTarget: [
    { label: "Write Student-Facing Target", action: "write_target" },
    { label: "Simplify Language", action: "simplify_target" },
  ],
  lessonPurpose: [
    { label: "Explain Unit Connection", action: "explain_connection" },
  ],
  materialsNeeded: [
    { label: "Generate Materials List", action: "generate_materials" },
  ],
  hook: [
    { label: "Debatable Question", action: "debatable_question" },
    { label: "Story Hook", action: "story_hook" },
    { label: "Current Event Hook", action: "current_event_hook" },
  ],
  activities: [
    { label: "Generate Activity Sequence", action: "generate_activities" },
    { label: "Add Think-Pair-Share", action: "add_tps" },
  ],
  closure: [
    { label: "Exit Ticket", action: "exit_ticket" },
    { label: "Reflection Prompt", action: "reflection_prompt" },
    { label: "3-2-1 Summary", action: "three_two_one" },
  ],
  assessment: [
    { label: "Quick Check Questions", action: "quick_check" },
    { label: "Formative Assessment Ideas", action: "formative_ideas" },
  ],
  scaffolds: [
    { label: "Scaffolding Strategies", action: "scaffolding_strategies" },
    { label: "Sentence Starters", action: "sentence_starters" },
  ],
  extension: [
    { label: "Challenge Questions", action: "challenge_questions" },
    { label: "Extension Activity", action: "extension_activity" },
  ],
};

interface SectionAIMenuProps {
  sectionKey: string;
  isGenerating: boolean;
  aiPreview: string | null;
  onGenerate: (section: string, action: string) => void;
  onAccept: () => void;
  onReject: () => void;
  onRegenerate: () => void;
  lastAction?: { section: string; action: string } | null;
}

export function SectionAIMenu({
  sectionKey,
  isGenerating,
  aiPreview,
  onGenerate,
  onAccept,
  onReject,
  onRegenerate,
  lastAction,
}: SectionAIMenuProps) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const actions = SECTION_AI_ACTIONS[sectionKey] || [];

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (actions.length === 0) return null;

  // Show accept/reject buttons when there's a preview
  if (aiPreview !== null) {
    return (
      <div className="flex items-center gap-1">
        <button
          onClick={onAccept}
          className="p-1 rounded text-success hover:bg-success/10 transition-colors"
          title="Accept suggestion"
        >
          <Check size={14} />
        </button>
        <button
          onClick={onReject}
          className="p-1 rounded text-danger hover:bg-danger/10 transition-colors"
          title="Reject suggestion"
        >
          <X size={14} />
        </button>
        <button
          onClick={onRegenerate}
          disabled={isGenerating}
          className="p-1 rounded text-muted hover:bg-surface-hover transition-colors"
          title="Regenerate"
        >
          {isGenerating ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <RefreshCw size={14} />
          )}
        </button>
      </div>
    );
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen(!open)}
        disabled={isGenerating}
        className={cn(
          "p-1 rounded transition-colors",
          isGenerating
            ? "text-primary animate-pulse"
            : "text-muted hover:text-primary hover:bg-primary/10"
        )}
        title="AI Generate"
      >
        {isGenerating ? (
          <Loader2 size={14} className="animate-spin" />
        ) : (
          <Sparkles size={14} />
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 z-50 bg-surface border border-border rounded-lg shadow-lg py-1 min-w-[200px]">
          {actions.map((action) => (
            <button
              key={action.action}
              onClick={() => {
                onGenerate(sectionKey, action.action);
                setOpen(false);
              }}
              className="w-full text-left px-3 py-2 text-sm hover:bg-surface-hover transition-colors flex items-center gap-2"
            >
              <Sparkles size={12} className="text-primary shrink-0" />
              {action.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
