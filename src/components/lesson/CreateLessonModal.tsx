"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { ChoosePathStep } from "./creation/ChoosePathStep";
import { ConfigureStep, setLastMode, updateSlidersFromTemplate } from "./creation/ConfigureStep";
import type { LessonConfig, SliderValues, ConstraintValues } from "./creation/ConfigureStep";
import { TemplateSelectStep } from "./creation/TemplateSelectStep";
import { GenerateStep } from "./creation/GenerateStep";
import { ResourcesPanel } from "./ResourcesPanel";
import type { ViewState } from "@/app/page";

interface LessonTemplate {
  id: string;
  name: string;
  description: string;
  structure: {
    icon?: string;
    color?: string;
    sections: string[];
    defaultSliders?: SliderValues;
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

interface CourseDefaults {
  numStudents?: number;
  lessonDuration?: number;
}

interface CreateLessonModalProps {
  unitId?: string;
  courseId?: string;
  courseGradeLevel?: string;
  courseDefaults?: CourseDefaults;
  onClose: () => void;
  onCreated: (lessonId: string) => void;
  onNavigate: (view: ViewState) => void;
}

type Step = "choose" | "configure" | "template" | "generate" | "resources";

export function CreateLessonModal({
  unitId,
  courseId,
  courseGradeLevel,
  courseDefaults,
  onClose,
  onCreated,
  onNavigate,
}: CreateLessonModalProps) {
  const [step, setStep] = useState<Step>("choose");
  const [title, setTitle] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<LessonTemplate | null>(null);
  const [templates, setTemplates] = useState<LessonTemplate[]>([]);
  const [createdLessonId, setCreatedLessonId] = useState<string | null>(null);

  // Store config/sliders/constraints from ConfigureStep for TemplateSelectStep
  const [lessonConfig, setLessonConfig] = useState<LessonConfig | null>(null);
  const [lessonSliders, setLessonSliders] = useState<SliderValues>({
    prepDemand: 3, teacherDirection: 3, collaboration: 3, assessmentEvidence: 3, managementComplexity: 3,
  });
  const [lessonConstraints, setLessonConstraints] = useState<ConstraintValues>({
    noTechRequired: false, chromebooksAvailable: false, phonesAvailable: false,
  });

  useEffect(() => {
    fetch("/api/templates")
      .then((r) => r.json())
      .then(setTemplates)
      .catch(console.error);
  }, []);

  const handleScratch = async () => {
    if (!title.trim()) return;
    const res = await fetch("/api/lessons", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: title.trim(),
        unitId: unitId || null,
        creationMode: "scratch",
      }),
    });
    if (res.ok) {
      const lesson = await res.json();
      onCreated(lesson.id);
      onNavigate({ type: "lesson", lessonId: lesson.id });
      onClose();
    }
  };

  const handleConfigure = (config: LessonConfig, sliders: SliderValues, constraints: ConstraintValues) => {
    setLessonConfig(config);
    setLessonSliders(sliders);
    setLessonConstraints(constraints);
    setStep("template");
  };

  const handleSelectTemplate = (template: LessonTemplate, mode: "auto" | "options") => {
    setSelectedTemplate(template);
    setLastMode(mode);
    // Update sliders to template defaults if user hasn't customized
    if (template.structure?.defaultSliders) {
      updateSlidersFromTemplate(template.structure.defaultSliders);
    }
    setStep("generate");
  };

  const handleLessonCreated = (lessonId: string) => {
    setCreatedLessonId(lessonId);
    onCreated(lessonId);
    if (selectedTemplate) {
      setStep("resources");
    } else {
      onNavigate({ type: "lesson", lessonId });
      onClose();
    }
  };

  const handleResourcesDone = () => {
    if (createdLessonId) {
      onNavigate({ type: "lesson", lessonId: createdLessonId });
    }
    onClose();
  };

  const stepLabels: Record<Step, string> = {
    choose: "Create Lesson",
    configure: "Lesson Details",
    template: "Choose Template",
    generate: "Preview & Iterate",
    resources: "Generate Resources",
  };

  const steps: Step[] = ["choose", "configure", "template", "generate", "resources"];
  const currentIndex = steps.indexOf(step);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-surface rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden border border-border">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-bold">{stepLabels[step]}</h2>
            {step !== "choose" && (
              <div className="flex items-center gap-1.5">
                {steps.slice(1).map((s) => (
                  <div
                    key={s}
                    className={`w-2 h-2 rounded-full transition-all ${
                      steps.indexOf(s) <= currentIndex
                        ? "bg-primary scale-110"
                        : "bg-border"
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted hover:text-foreground hover:bg-surface-hover transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {step === "choose" && (
            <ChoosePathStep
              title={title}
              onTitleChange={setTitle}
              onScratch={handleScratch}
              onTemplate={() => setStep("configure")}
            />
          )}

          {step === "configure" && (
            <ConfigureStep
              title={title}
              onTitleChange={setTitle}
              courseGradeLevel={courseGradeLevel}
              courseDefaults={courseDefaults}
              onContinue={handleConfigure}
              onBack={() => setStep("choose")}
            />
          )}

          {step === "template" && lessonConfig && (
            <TemplateSelectStep
              templates={templates}
              config={lessonConfig}
              sliders={lessonSliders}
              constraints={lessonConstraints}
              onSelect={handleSelectTemplate}
              onBack={() => setStep("configure")}
            />
          )}

          {step === "generate" && selectedTemplate && (
            <GenerateStep
              template={selectedTemplate}
              title={title}
              unitId={unitId}
              courseId={courseId}
              courseGradeLevel={courseGradeLevel}
              onCreated={handleLessonCreated}
              onBack={() => setStep("template")}
            />
          )}

          {step === "resources" && createdLessonId && (
            <ResourcesPanel
              lessonId={createdLessonId}
              templateName={selectedTemplate?.name}
              onDone={handleResourcesDone}
            />
          )}
        </div>
      </div>
    </div>
  );
}
