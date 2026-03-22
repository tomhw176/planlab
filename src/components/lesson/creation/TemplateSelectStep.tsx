"use client";

import { ArrowLeft, Scale, KeyRound, ArrowRightLeft, Presentation, MessagesSquare, FileSearch, type LucideIcon } from "lucide-react";

interface LessonTemplate {
  id: string;
  name: string;
  description: string;
  structure: {
    icon?: string;
    color?: string;
    sections: string[];
  };
  requiredFields: Array<{
    field: string;
    label: string;
    type: string;
    required?: boolean;
    default?: number | string;
    useDefault?: string;
    options?: string[];
    placeholder?: string;
  }>;
  promptTemplate: string;
}

interface Props {
  templates: LessonTemplate[];
  onSelect: (template: LessonTemplate) => void;
  onBack: () => void;
}

const ICON_MAP: Record<string, LucideIcon> = {
  Scale,
  KeyRound,
  ArrowRightLeft,
  Presentation,
  MessagesSquare,
  FileSearch,
};

export function TemplateSelectStep({ templates, onSelect, onBack }: Props) {
  return (
    <div className="space-y-4">
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm text-muted hover:text-primary transition-colors mb-2"
      >
        <ArrowLeft size={14} />
        Back
      </button>

      <p className="text-sm text-muted">
        Choose a lesson format. Each template has a specific structure that AI will use to generate your lesson.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {templates.map((template) => {
          const iconName = template.structure?.icon || "FileSearch";
          const Icon = ICON_MAP[iconName] || FileSearch;
          const color = template.structure?.color || "#6366f1";

          return (
            <button
              key={template.id}
              onClick={() => onSelect(template)}
              className="group text-left p-5 rounded-xl border-2 border-border hover:shadow-md transition-all"
              style={{
                borderColor: undefined,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = color + "80";
                e.currentTarget.style.backgroundColor = color + "08";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "";
                e.currentTarget.style.backgroundColor = "";
              }}
            >
              <div className="flex items-center gap-3 mb-2">
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: color + "20" }}
                >
                  <Icon size={18} style={{ color }} />
                </div>
                <h3 className="font-bold text-sm">{template.name}</h3>
              </div>
              <p className="text-xs text-muted leading-relaxed">
                {template.description}
              </p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {template.structure.sections.slice(0, 3).map((s, i) => (
                  <span
                    key={i}
                    className="text-[10px] px-2 py-0.5 rounded-full bg-background border border-border text-muted"
                  >
                    {s.split("—")[0].trim()}
                  </span>
                ))}
                {template.structure.sections.length > 3 && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-background border border-border text-muted">
                    +{template.structure.sections.length - 3} more
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
