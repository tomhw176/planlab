"use client";

import type { ViewState } from "@/app/page";
import { Search, BookOpenCheck, FileText, Lightbulb } from "lucide-react";

interface ToolsPageProps {
  onNavigate: (view: ViewState) => void;
}

const tools = [
  {
    id: "source-finding",
    title: "Source Finding",
    description: "Find and curate historical sources for DBQs, History Labs, SACs, and more. AI acts as a historical source curator for your inquiry lessons.",
    icon: Search,
    color: "#0ea5e9",
    ready: true,
  },
  {
    id: "rubric-builder",
    title: "Rubric Builder",
    description: "Create assessment rubrics aligned to BC curriculum competencies and your lesson objectives.",
    icon: BookOpenCheck,
    color: "#10b981",
    ready: false,
  },
  {
    id: "unit-planner",
    title: "Unit Plan Generator",
    description: "Generate a full unit plan with lesson sequence, pacing, and curriculum alignment.",
    icon: FileText,
    color: "#8b5cf6",
    ready: false,
  },
  {
    id: "essential-questions",
    title: "Essential Questions",
    description: "Generate compelling essential questions and inquiry prompts for any topic or unit.",
    icon: Lightbulb,
    color: "#f59e0b",
    ready: false,
  },
];

export function ToolsPage({ onNavigate }: ToolsPageProps) {
  return (
    <div className="p-8 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold mb-2">Tools</h1>
      <p className="text-muted mb-8">
        Extra features to support your curriculum planning. More tools coming soon.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {tools.map((tool) => {
          const Icon = tool.icon;
          return (
            <button
              key={tool.id}
              onClick={() => {
                if (tool.id === "source-finding" && tool.ready) {
                  onNavigate({ type: "source-finding" });
                }
              }}
              disabled={!tool.ready}
              className={`text-left p-6 rounded-xl border transition-all group ${
                tool.ready
                  ? "border-border bg-surface hover:shadow-lg hover:border-primary/30 cursor-pointer"
                  : "border-border/50 bg-surface/50 opacity-60 cursor-not-allowed"
              }`}
            >
              <div className="flex items-start gap-4">
                <div
                  className="p-3 rounded-xl shrink-0"
                  style={{ backgroundColor: `${tool.color}15` }}
                >
                  <Icon size={24} style={{ color: tool.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className={`font-semibold text-lg ${tool.ready ? "group-hover:text-primary" : ""} transition-colors`}>
                      {tool.title}
                    </h3>
                    {!tool.ready && (
                      <span className="text-[10px] font-medium uppercase tracking-wider bg-muted/20 text-muted px-2 py-0.5 rounded-full">
                        Coming Soon
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted leading-relaxed">
                    {tool.description}
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
