"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Sparkles, LayoutGrid } from "lucide-react";

interface RequiredField {
  field: string;
  label: string;
  type: string;
  required?: boolean;
  default?: number | string;
  useDefault?: string;
  options?: string[];
  placeholder?: string;
}

interface LessonTemplate {
  id: string;
  name: string;
  description: string;
  structure: {
    icon?: string;
    color?: string;
    sections: string[];
  };
  requiredFields: RequiredField[];
  promptTemplate: string;
}

interface CourseDefaults {
  numStudents?: number;
  lessonDuration?: number;
}

interface Props {
  template: LessonTemplate;
  title: string;
  onTitleChange: (title: string) => void;
  courseGradeLevel?: string;
  courseDefaults?: CourseDefaults;
  onGenerate: () => void;
  onBack: () => void;
}

// Store config globally so GenerateStep can access it
export let lastConfig: Record<string, string> = {};
export let lastMode: "auto" | "options" = "auto";

export function ConfigureStep({
  template,
  title,
  onTitleChange,
  courseGradeLevel,
  courseDefaults,
  onGenerate,
  onBack,
}: Props) {
  const [config, setConfig] = useState<Record<string, string>>({});

  // Initialize defaults
  useEffect(() => {
    const defaults: Record<string, string> = {};
    for (const field of template.requiredFields) {
      if (field.useDefault === "gradeLevel" && courseGradeLevel) {
        defaults[field.field] = courseGradeLevel;
      } else if (field.useDefault === "numStudents" && courseDefaults?.numStudents) {
        defaults[field.field] = String(courseDefaults.numStudents);
      } else if (field.useDefault === "lessonDuration" && courseDefaults?.lessonDuration) {
        defaults[field.field] = String(courseDefaults.lessonDuration);
      } else if (field.default !== undefined) {
        defaults[field.field] = String(field.default);
      }
    }
    setConfig(defaults);
  }, [template, courseGradeLevel, courseDefaults]);

  const updateField = (field: string, value: string) => {
    setConfig((prev) => ({ ...prev, [field]: value }));
  };

  const isValid = () => {
    for (const field of template.requiredFields) {
      if (field.required !== false && !config[field.field]?.trim()) {
        return false;
      }
    }
    return true;
  };

  const handleGenerate = (mode: "auto" | "options") => {
    lastConfig = { ...config };
    lastMode = mode;
    onGenerate();
  };

  const color = template.structure?.color || "#6366f1";

  return (
    <div className="space-y-5">
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm text-muted hover:text-primary transition-colors"
      >
        <ArrowLeft size={14} />
        Back to templates
      </button>

      {/* Template header */}
      <div className="flex items-center gap-3 p-4 rounded-xl border border-border bg-background">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
          style={{ backgroundColor: color + "20" }}
        >
          <Sparkles size={18} style={{ color }} />
        </div>
        <div>
          <h3 className="font-bold text-sm">{template.name}</h3>
          <p className="text-xs text-muted">{template.description}</p>
        </div>
      </div>

      {/* Title (if not yet set) */}
      {!title.trim() && (
        <div>
          <label className="block text-sm font-semibold mb-1.5">Lesson Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            placeholder="e.g. The Causes of World War I"
            className="w-full px-3 py-2.5 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 bg-background"
          />
        </div>
      )}

      {/* Required fields */}
      <div className="space-y-4">
        {template.requiredFields.map((field) => (
          <div key={field.field}>
            <label className="block text-sm font-semibold mb-1.5">
              {field.label}
              {field.required === false && (
                <span className="text-xs text-muted font-normal ml-1">(optional)</span>
              )}
            </label>

            {field.type === "text" && (
              <input
                type="text"
                value={config[field.field] || ""}
                onChange={(e) => updateField(field.field, e.target.value)}
                placeholder={field.placeholder || ""}
                className="w-full px-3 py-2.5 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 bg-background"
              />
            )}

            {field.type === "textarea" && (
              <textarea
                value={config[field.field] || ""}
                onChange={(e) => updateField(field.field, e.target.value)}
                placeholder={field.placeholder || ""}
                rows={3}
                className="w-full px-3 py-2.5 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 bg-background resize-none"
              />
            )}

            {field.type === "number" && (
              <input
                type="number"
                value={config[field.field] || ""}
                onChange={(e) => updateField(field.field, e.target.value)}
                className="w-32 px-3 py-2.5 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 bg-background"
              />
            )}

            {field.type === "select" && field.options && (
              <select
                value={config[field.field] || ""}
                onChange={(e) => updateField(field.field, e.target.value)}
                className="w-full px-3 py-2.5 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 bg-background"
              >
                <option value="">Select...</option>
                {field.options.map((opt) => (
                  <option key={opt} value={opt}>
                    {field.field === "grade" ? `Grade ${opt}` : opt}
                  </option>
                ))}
              </select>
            )}
          </div>
        ))}
      </div>

      {/* Action buttons */}
      <div className="flex gap-3 pt-2">
        <button
          onClick={() => handleGenerate("auto")}
          disabled={!isValid()}
          className="flex-1 flex items-center justify-center gap-2 py-3 bg-primary text-white font-semibold rounded-xl hover:bg-primary-dark transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Sparkles size={16} />
          Generate Automatically
        </button>
        <button
          onClick={() => handleGenerate("options")}
          disabled={!isValid()}
          className="flex-1 flex items-center justify-center gap-2 py-3 border-2 border-primary text-primary font-semibold rounded-xl hover:bg-primary/5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <LayoutGrid size={16} />
          Give Me Options
        </button>
      </div>
    </div>
  );
}
