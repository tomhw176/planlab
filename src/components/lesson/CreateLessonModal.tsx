"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { ChoosePathStep } from "./creation/ChoosePathStep";
import { TemplateSelectStep } from "./creation/TemplateSelectStep";
import { ConfigureStep } from "./creation/ConfigureStep";
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

type Step = "choose" | "template" | "configure" | "generate" | "resources";

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

  const handleSelectTemplate = (template: LessonTemplate) => {
    setSelectedTemplate(template);
    setStep("configure");
  };

  const handleGenerate = () => {
    setStep("generate");
  };

  const handleLessonCreated = (lessonId: string) => {
    setCreatedLessonId(lessonId);
    onCreated(lessonId);
    // If a template is selected, go to resources step; otherwise go straight to lesson
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
    template: "Choose Template",
    configure: "Configure",
    generate: "Preview & Iterate",
    resources: "Generate Resources",
  };

  const steps: Step[] = ["choose", "template", "configure", "generate", "resources"];
  const currentIndex = steps.indexOf(step);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-surface rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden border border-border">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-bold">{stepLabels[step]}</h2>
            {/* Step indicator */}
            {step !== "choose" && (
              <div className="flex items-center gap-1.5">
                {steps.slice(1).map((s, i) => (
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
              onTemplate={() => setStep("template")}
            />
          )}

          {step === "template" && (
            <TemplateSelectStep
              templates={templates}
              onSelect={handleSelectTemplate}
              onBack={() => setStep("choose")}
            />
          )}

          {step === "configure" && selectedTemplate && (
            <ConfigureStep
              template={selectedTemplate}
              title={title}
              onTitleChange={setTitle}
              courseGradeLevel={courseGradeLevel}
              courseDefaults={courseDefaults}
              onGenerate={handleGenerate}
              onBack={() => setStep("template")}
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
              onBack={() => setStep("configure")}
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
