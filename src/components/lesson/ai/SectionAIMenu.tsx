"use client";

import { useState, useRef, useEffect } from "react";
import { Sparkles, Loader2, Check, X, RefreshCw, Wrench, Shuffle } from "lucide-react";
import { cn } from "@/lib/utils";

interface AIAction {
  label: string;
  action: string;
}

// Sections with the new Adapt / Other Types pattern
const ADAPT_ACTIONS: Record<string, AIAction[]> = {
  hook: [
    { label: "More engaging", action: "adapt_more_engaging" },
    { label: "More relevant to students", action: "adapt_more_relevant" },
    { label: "Shorter", action: "adapt_shorter" },
    { label: "Less prep", action: "adapt_less_prep" },
    { label: "More discussion-based", action: "adapt_more_discussion" },
    { label: "Clearer connection to lesson", action: "adapt_clearer_connection" },
  ],
  activities: [
    { label: "More engaging", action: "adapt_more_engaging" },
    { label: "Shorter / tighter timing", action: "adapt_shorter" },
    { label: "More collaborative", action: "adapt_more_collaborative" },
    { label: "More scaffolded", action: "adapt_more_scaffolded" },
    { label: "Clearer transitions", action: "adapt_clearer_transitions" },
    { label: "More student choice", action: "adapt_more_choice" },
  ],
  assessment: [
    { label: "Faster version", action: "adapt_faster" },
    { label: "More diagnostic", action: "adapt_more_diagnostic" },
    { label: "More aligned to objective", action: "adapt_more_aligned" },
    { label: "More discussion-based", action: "adapt_more_discussion" },
    { label: "Individual accountability", action: "adapt_individual" },
    { label: "Easier to assess quickly", action: "adapt_easier_assess" },
    { label: "Better for reluctant students", action: "adapt_reluctant" },
    { label: "Lower reading demand", action: "adapt_lower_reading" },
    { label: "Better for whole-class snapshot", action: "adapt_whole_class" },
  ],
  closure: [
    { label: "More reflective", action: "adapt_more_reflective" },
    { label: "More summary-focused", action: "adapt_more_summary" },
    { label: "More discussion-based", action: "adapt_more_discussion" },
    { label: "Faster version", action: "adapt_faster" },
    { label: "Stronger connection to objective", action: "adapt_stronger_connection" },
    { label: "Better transition to next lesson", action: "adapt_better_transition" },
    { label: "More student voice", action: "adapt_more_voice" },
    { label: "More metacognitive", action: "adapt_more_metacognitive" },
  ],
};

const OTHER_TYPES_ACTIONS: Record<string, AIAction[]> = {
  hook: [
    { label: "Prediction", action: "other_prediction" },
    { label: "Problem / Mystery", action: "other_problem_mystery" },
    { label: "Connection to Today", action: "other_connection_today" },
    { label: "Surprise Framing", action: "other_surprise" },
    { label: "Continuum / Barometer", action: "other_continuum" },
    { label: "Image Hook", action: "other_image" },
    { label: "Mini Demonstration", action: "other_mini_demo" },
    { label: "Student-Relevant Analogy", action: "other_analogy" },
    { label: "Ranking / Prioritization", action: "other_ranking" },
    { label: "Quote / Voice Hook", action: "other_quote" },
    { label: "Error Analysis / Misconception", action: "other_error_analysis" },
  ],
  activities: [
    { label: "Jigsaw", action: "other_jigsaw" },
    { label: "Station Rotation", action: "other_station_rotation" },
    { label: "Gallery Walk", action: "other_gallery_walk" },
    { label: "Card Sort", action: "other_card_sort" },
    { label: "Ranking Task", action: "other_ranking_task" },
    { label: "Source Analysis", action: "other_source_analysis" },
    { label: "Structured Debate", action: "other_structured_debate" },
    { label: "Silent Discussion", action: "other_silent_discussion" },
    { label: "Role-Play / Simulation", action: "other_roleplay" },
    { label: "Case Study", action: "other_case_study" },
    { label: "Teacher Modeling + Guided Practice", action: "other_modeling" },
    { label: "Partner Analysis", action: "other_partner_analysis" },
    { label: "Independent Inquiry", action: "other_independent_inquiry" },
    { label: "Graphic Organizer Analysis", action: "other_graphic_organizer" },
    { label: "Problem-Solving Task", action: "other_problem_solving" },
  ],
  assessment: [
    { label: "Exit Slip", action: "other_exit_slip" },
    { label: "Mini Whiteboard Check", action: "other_whiteboard" },
    { label: "Poll / Vote", action: "other_poll" },
    { label: "Quickwrite", action: "other_quickwrite" },
    { label: "Turn-and-Explain", action: "other_turn_explain" },
    { label: "Retrieval Questions", action: "other_retrieval" },
    { label: "Misconception Check", action: "other_misconception" },
    { label: "One-Sentence Summary", action: "other_one_sentence" },
    { label: "Ranking / Justification", action: "other_ranking" },
    { label: "Cold-Call Discussion Prompts", action: "other_cold_call" },
    { label: "Graphic Response", action: "other_graphic" },
    { label: "Self-Assessment Scale", action: "other_self_assessment" },
  ],
  closure: [
    { label: "Exit Ticket", action: "other_exit_ticket" },
    { label: "One-Sentence Takeaway", action: "other_one_sentence" },
    { label: "Turn-and-Talk Synthesis", action: "other_turn_talk" },
    { label: "Revisit the Opener", action: "other_revisit_opener" },
    { label: "Revisit Continuum Statement", action: "other_revisit_continuum" },
    { label: "Reflection Prompt", action: "other_reflection" },
    { label: "Quick Debate Revisit", action: "other_debate_revisit" },
    { label: "What Changed in Your Thinking?", action: "other_thinking_change" },
    { label: "Self-Assessment", action: "other_self_assessment" },
    { label: "Prediction Revisit", action: "other_prediction_revisit" },
    { label: "Summary Sketch / Visual Synthesis", action: "other_summary_sketch" },
  ],
};

// Legacy actions for sections that don't use Adapt/Other Types
const LEGACY_AI_ACTIONS: Record<string, AIAction[]> = {
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
  scaffolds: [
    { label: "Scaffolding Strategies", action: "scaffolding_strategies" },
    { label: "Sentence Starters", action: "sentence_starters" },
  ],
  extension: [
    { label: "Challenge Questions", action: "challenge_questions" },
    { label: "Extension Activity", action: "extension_activity" },
  ],
};

// Check if a section uses the new Adapt/Other Types pattern
function hasAdaptPattern(sectionKey: string): boolean {
  return sectionKey in ADAPT_ACTIONS && sectionKey in OTHER_TYPES_ACTIONS;
}

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
  const [menuMode, setMenuMode] = useState<"closed" | "adapt" | "other" | "legacy">("closed");
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuMode("closed");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const isAdaptSection = hasAdaptPattern(sectionKey);
  const legacyActions = LEGACY_AI_ACTIONS[sectionKey] || [];

  // Nothing to show for sections without any AI actions
  if (!isAdaptSection && legacyActions.length === 0) return null;

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

  // Sections with Adapt / Other Types pattern
  if (isAdaptSection) {
    const adaptActions = ADAPT_ACTIONS[sectionKey];
    const otherActions = OTHER_TYPES_ACTIONS[sectionKey];

    return (
      <div className="relative" ref={menuRef}>
        {/* Two primary buttons */}
        <div className="flex items-center gap-1">
          {isGenerating ? (
            <Loader2 size={14} className="animate-spin text-primary" />
          ) : (
            <>
              <button
                onClick={() => setMenuMode(menuMode === "adapt" ? "closed" : "adapt")}
                className={cn(
                  "flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors",
                  menuMode === "adapt"
                    ? "bg-primary/10 text-primary"
                    : "text-muted hover:text-primary hover:bg-primary/10"
                )}
                title="Adapt this section"
              >
                <Wrench size={12} />
                Adapt
              </button>
              <button
                onClick={() => setMenuMode(menuMode === "other" ? "closed" : "other")}
                className={cn(
                  "flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors",
                  menuMode === "other"
                    ? "bg-amber-500/10 text-amber-600"
                    : "text-muted hover:text-amber-600 hover:bg-amber-500/10"
                )}
                title="Try a different type"
              >
                <Shuffle size={12} />
                Other Types
              </button>
            </>
          )}
        </div>

        {/* Adapt submenu */}
        {menuMode === "adapt" && (
          <div className="absolute right-0 top-full mt-1 z-50 bg-surface border border-border rounded-lg shadow-lg py-1 min-w-[220px] max-h-[300px] overflow-y-auto">
            <div className="px-3 py-1.5 text-[10px] font-bold text-muted uppercase tracking-wider">
              Adapt current version
            </div>
            {adaptActions.map((action) => (
              <button
                key={action.action}
                onClick={() => {
                  onGenerate(sectionKey, action.action);
                  setMenuMode("closed");
                }}
                className="w-full text-left px-3 py-2 text-sm hover:bg-surface-hover transition-colors flex items-center gap-2"
              >
                <Wrench size={12} className="text-primary shrink-0" />
                {action.label}
              </button>
            ))}
          </div>
        )}

        {/* Other Types submenu */}
        {menuMode === "other" && (
          <div className="absolute right-0 top-full mt-1 z-50 bg-surface border border-border rounded-lg shadow-lg py-1 min-w-[240px] max-h-[300px] overflow-y-auto">
            <div className="px-3 py-1.5 text-[10px] font-bold text-muted uppercase tracking-wider">
              Replace with a different type
            </div>
            {otherActions.map((action) => (
              <button
                key={action.action}
                onClick={() => {
                  onGenerate(sectionKey, action.action);
                  setMenuMode("closed");
                }}
                className="w-full text-left px-3 py-2 text-sm hover:bg-surface-hover transition-colors flex items-center gap-2"
              >
                <Shuffle size={12} className="text-amber-600 shrink-0" />
                {action.label}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Legacy sections — keep original dropdown pattern
  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setMenuMode(menuMode === "legacy" ? "closed" : "legacy")}
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

      {menuMode === "legacy" && (
        <div className="absolute right-0 top-full mt-1 z-50 bg-surface border border-border rounded-lg shadow-lg py-1 min-w-[200px]">
          {legacyActions.map((action) => (
            <button
              key={action.action}
              onClick={() => {
                onGenerate(sectionKey, action.action);
                setMenuMode("closed");
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
