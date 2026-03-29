"use client";

import { useState, useEffect, useRef } from "react";
import { ArrowLeft, Scale, KeyRound, ArrowRightLeft, Presentation, MessagesSquare, FileSearch, Sparkles, LayoutGrid, Loader2, Star, type LucideIcon } from "lucide-react";
import type { LessonConfig, SliderValues, ConstraintValues } from "./ConfigureStep";

interface SliderDefaults {
  prepDemand: number;
  teacherDirection: number;
  collaboration: number;
  assessmentEvidence: number;
  managementComplexity: number;
}

interface LessonTemplate {
  id: string;
  name: string;
  description: string;
  structure: {
    icon?: string;
    color?: string;
    sections: string[];
    defaultSliders?: SliderDefaults;
    bestUseCases?: string[];
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

interface Recommendation {
  templateId: string;
  templateName: string;
  reason: string;
}

interface Props {
  templates: LessonTemplate[];
  config: LessonConfig;
  sliders: SliderValues;
  constraints: ConstraintValues;
  onSelect: (template: LessonTemplate, mode: "auto" | "options") => void;
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

const SLIDER_LABELS: { key: keyof SliderDefaults; label: string }[] = [
  { key: "prepDemand", label: "Prep" },
  { key: "teacherDirection", label: "Direction" },
  { key: "collaboration", label: "Collab" },
  { key: "assessmentEvidence", label: "Evidence" },
  { key: "managementComplexity", label: "Mgmt" },
];

function SliderBar({ value, color }: { value: number; color: string }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className="h-1.5 w-3 rounded-sm transition-colors"
          style={{
            backgroundColor: i <= value ? color + "90" : color + "18",
          }}
        />
      ))}
    </div>
  );
}

function TemplateCard({
  template,
  recommended,
  reason,
  rank,
  selected,
  onClick,
}: {
  template: LessonTemplate;
  recommended?: boolean;
  reason?: string;
  rank?: number;
  selected: boolean;
  onClick: () => void;
}) {
  const iconName = template.structure?.icon || "FileSearch";
  const Icon = ICON_MAP[iconName] || FileSearch;
  const color = template.structure?.color || "#6366f1";
  const sliders = template.structure?.defaultSliders;
  const useCases = template.structure?.bestUseCases;

  return (
    <button
      onClick={onClick}
      className={`group text-left p-5 rounded-xl border-2 transition-all ${
        selected
          ? "ring-2 ring-primary shadow-md"
          : "hover:shadow-md"
      } ${recommended ? "border-primary/30 bg-primary/5" : "border-border"}`}
      style={{
        borderColor: selected ? color : undefined,
      }}
      onMouseEnter={(e) => {
        if (!selected) {
          e.currentTarget.style.borderColor = color + "80";
          e.currentTarget.style.backgroundColor = color + "08";
        }
      }}
      onMouseLeave={(e) => {
        if (!selected) {
          e.currentTarget.style.borderColor = recommended ? "" : "";
          e.currentTarget.style.backgroundColor = recommended ? "" : "";
        }
      }}
    >
      <div className="flex items-center gap-3 mb-2">
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: color + "20" }}
        >
          <Icon size={18} style={{ color }} />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-sm">{template.name}</h3>
            {rank && (
              <span
                className="text-[10px] px-1.5 py-0.5 rounded-full font-bold text-white"
                style={{ backgroundColor: color }}
              >
                #{rank}
              </span>
            )}
          </div>
        </div>
      </div>
      <p className="text-xs text-muted leading-relaxed">
        {template.description}
      </p>

      {/* AI Recommendation reason */}
      {reason && (
        <div className="mt-2 flex items-start gap-1.5 text-xs text-primary bg-primary/5 rounded-lg px-2.5 py-1.5">
          <Star size={12} className="shrink-0 mt-0.5" />
          <span>{reason}</span>
        </div>
      )}

      {/* Best Use Cases */}
      {useCases && useCases.length > 0 && (
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {useCases.map((useCase, i) => (
            <span
              key={i}
              className="text-[10px] px-2 py-0.5 rounded-full border"
              style={{ borderColor: color + "30", color: color + "cc" }}
            >
              {useCase}
            </span>
          ))}
        </div>
      )}

      {/* Slider Profile */}
      {sliders && (
        <div className="mt-3 pt-3 border-t border-border/50">
          <div className="grid grid-cols-5 gap-2">
            {SLIDER_LABELS.map(({ key, label }) => (
              <div key={key} className="text-center">
                <span className="text-[9px] text-muted font-medium block mb-1">{label}</span>
                <SliderBar value={sliders[key]} color={color} />
              </div>
            ))}
          </div>
        </div>
      )}
    </button>
  );
}

export function TemplateSelectStep({ templates, config, sliders, constraints, onSelect, onBack }: Props) {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loadingRecs, setLoadingRecs] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<LessonTemplate | null>(null);
  const hasFetched = useRef(false);
  const confirmRef = useRef<HTMLDivElement>(null);

  // Fetch recommendations on mount
  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;

    fetch("/api/templates/recommend", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        topic: config.topic,
        grade: config.grade,
        duration: config.duration,
        students: config.students,
        classCharacteristics: config.classCharacteristics,
        learningObjective: config.learningObjective,
        purposeNotes: config.purposeNotes,
        sliders,
        constraints,
      }),
    })
      .then((r) => r.json())
      .then((data) => setRecommendations(data.recommendations || []))
      .catch(console.error)
      .finally(() => setLoadingRecs(false));
  }, [config, sliders, constraints]);

  // Scroll to confirmation when template selected
  useEffect(() => {
    if (selectedTemplate && confirmRef.current) {
      confirmRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [selectedTemplate]);

  const handleSelectTemplate = (template: LessonTemplate) => {
    setSelectedTemplate(template);
  };

  const handleGenerate = (mode: "auto" | "options") => {
    if (selectedTemplate) {
      onSelect(selectedTemplate, mode);
    }
  };

  // Split templates into recommended and others
  const recIds = new Set(recommendations.map((r) => r.templateId));
  const recommendedTemplates = recommendations
    .map((rec) => ({
      template: templates.find((t) => t.id === rec.templateId),
      reason: rec.reason,
    }))
    .filter((r) => r.template) as Array<{ template: LessonTemplate; reason: string }>;
  const otherTemplates = templates.filter((t) => !recIds.has(t.id));

  const selectedColor = selectedTemplate?.structure?.color || "#6366f1";

  return (
    <div className="space-y-4">
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm text-muted hover:text-primary transition-colors mb-2"
      >
        <ArrowLeft size={14} />
        Back to lesson details
      </button>

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted">
          Choose a lesson format based on your topic: <span className="font-medium text-foreground">{config.topic}</span>
        </p>
      </div>

      {/* Recommended Templates */}
      {loadingRecs ? (
        <div className="space-y-2">
          <h4 className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles size={12} />
            Recommended for You
          </h4>
          <div className="flex items-center gap-3 p-6 rounded-xl border border-primary/20 bg-primary/5">
            <Loader2 size={18} className="animate-spin text-primary" />
            <span className="text-sm text-muted">Analyzing your lesson to find the best templates...</span>
          </div>
        </div>
      ) : recommendedTemplates.length > 0 ? (
        <div className="space-y-2">
          <h4 className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles size={12} />
            Recommended for You
          </h4>
          <div className="grid grid-cols-1 gap-3">
            {recommendedTemplates.map(({ template, reason }, i) => (
              <TemplateCard
                key={template.id}
                template={template}
                recommended
                reason={reason}
                rank={i + 1}
                selected={selectedTemplate?.id === template.id}
                onClick={() => handleSelectTemplate(template)}
              />
            ))}
          </div>
        </div>
      ) : null}

      {/* All Templates */}
      <div className="space-y-2">
        <h4 className="text-xs font-bold text-muted uppercase tracking-wider">
          {recommendedTemplates.length > 0 ? "All Templates" : "Choose a Template"}
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {(recommendedTemplates.length > 0 ? otherTemplates : templates).map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              selected={selectedTemplate?.id === template.id}
              onClick={() => handleSelectTemplate(template)}
            />
          ))}
        </div>
      </div>

      {/* Confirmation bar when template selected */}
      {selectedTemplate && (
        <div
          ref={confirmRef}
          className="sticky bottom-0 p-4 rounded-xl border-2 bg-surface shadow-lg space-y-3"
          style={{ borderColor: selectedColor + "60" }}
        >
          <div className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: selectedColor + "20" }}
            >
              <Sparkles size={14} style={{ color: selectedColor }} />
            </div>
            <span className="font-bold text-sm">{selectedTemplate.name}</span>
            <button
              onClick={() => setSelectedTemplate(null)}
              className="ml-auto text-xs text-muted hover:text-foreground"
            >
              Change
            </button>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => handleGenerate("auto")}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-primary text-white font-semibold rounded-xl hover:bg-primary-dark transition-colors text-sm"
            >
              <Sparkles size={14} />
              Generate Automatically
            </button>
            <button
              onClick={() => handleGenerate("options")}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 border-2 border-primary text-primary font-semibold rounded-xl hover:bg-primary/5 transition-colors text-sm"
            >
              <LayoutGrid size={14} />
              Give Me Options
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
