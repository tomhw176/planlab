"use client";

import { ArrowLeft, ArrowRight, Lightbulb } from "lucide-react";
import type { LessonPurpose } from "@/lib/template-types";

interface Props {
  title: string;
  onTitleChange: (title: string) => void;
  purpose: LessonPurpose;
  onChange: (purpose: LessonPurpose) => void;
  onNext: () => void;
  onBack: () => void;
}

export function LessonPurposeStep({ title, onTitleChange, purpose, onChange, onNext, onBack }: Props) {
  return (
    <div className="space-y-5">
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm text-muted hover:text-primary transition-colors"
      >
        <ArrowLeft size={14} />
        Back
      </button>

      <div className="text-center mb-2">
        <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center mx-auto mb-3">
          <Lightbulb size={22} className="text-amber-600" />
        </div>
        <h3 className="text-lg font-bold">What Are You Teaching?</h3>
        <p className="text-sm text-muted mt-1">
          Share as much or as little as you want. More detail = better results.
        </p>
      </div>

      {/* Title */}
      <div>
        <label className="block text-sm font-semibold mb-1.5">
          Lesson Title
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder="e.g. The Causes of World War I"
          className="w-full px-3 py-2.5 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 bg-background"
          autoFocus
        />
      </div>

      {/* Topic */}
      <div>
        <label className="block text-sm font-semibold mb-1.5">
          Topic
          <span className="text-xs text-muted font-normal ml-1">(optional)</span>
        </label>
        <input
          type="text"
          value={purpose.topic}
          onChange={(e) => onChange({ ...purpose, topic: e.target.value })}
          placeholder="e.g. Rise of totalitarianism in interwar Europe"
          className="w-full px-3 py-2.5 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 bg-background"
        />
      </div>

      {/* Learning Objective */}
      <div>
        <label className="block text-sm font-semibold mb-1.5">
          Learning Objective
          <span className="text-xs text-muted font-normal ml-1">(optional)</span>
        </label>
        <input
          type="text"
          value={purpose.learningObjective}
          onChange={(e) => onChange({ ...purpose, learningObjective: e.target.value })}
          placeholder="e.g. Students will analyze how propaganda was used to gain mass support"
          className="w-full px-3 py-2.5 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 bg-background"
        />
      </div>

      {/* Purpose / Vision / Notes */}
      <div>
        <label className="block text-sm font-semibold mb-1.5">
          Vision &amp; Notes
          <span className="text-xs text-muted font-normal ml-1">(optional)</span>
        </label>
        <textarea
          value={purpose.notes}
          onChange={(e) => onChange({ ...purpose, notes: e.target.value })}
          placeholder="Any other context — what you want students to walk away with, connections to prior lessons, skills to emphasize, etc."
          rows={3}
          className="w-full px-3 py-2.5 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 bg-background resize-none"
        />
      </div>

      <button
        onClick={onNext}
        className="w-full flex items-center justify-center gap-2 py-3 bg-primary text-white font-semibold rounded-xl hover:bg-primary-dark transition-colors"
      >
        Choose Template
        <ArrowRight size={16} />
      </button>
    </div>
  );
}
