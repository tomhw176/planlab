"use client";

import { ArrowLeft, ArrowRight, Users, Clock, GraduationCap } from "lucide-react";
import type { ClassInfo } from "@/lib/template-types";

interface Props {
  classInfo: ClassInfo;
  onChange: (info: ClassInfo) => void;
  onNext: () => void;
  onBack: () => void;
}

const GRADES = ["6", "7", "8", "9", "10", "11", "12"];

export function ClassInfoStep({ classInfo, onChange, onNext, onBack }: Props) {
  return (
    <div className="space-y-6">
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm text-muted hover:text-primary transition-colors"
      >
        <ArrowLeft size={14} />
        Back
      </button>

      <div className="text-center mb-2">
        <h3 className="text-lg font-bold">Class Information</h3>
        <p className="text-sm text-muted mt-1">
          These defaults come from your course settings. Adjust if needed for this lesson.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {/* Grade */}
        <div className="space-y-2">
          <label className="flex items-center gap-1.5 text-sm font-semibold">
            <GraduationCap size={14} className="text-primary" />
            Grade
          </label>
          <select
            value={classInfo.grade}
            onChange={(e) => onChange({ ...classInfo, grade: e.target.value })}
            className="w-full px-3 py-2.5 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 bg-background"
          >
            <option value="">Select...</option>
            {GRADES.map((g) => (
              <option key={g} value={g}>Grade {g}</option>
            ))}
          </select>
        </div>

        {/* Number of Students */}
        <div className="space-y-2">
          <label className="flex items-center gap-1.5 text-sm font-semibold">
            <Users size={14} className="text-primary" />
            Students
          </label>
          <input
            type="number"
            value={classInfo.students || ""}
            onChange={(e) => onChange({ ...classInfo, students: parseInt(e.target.value) || 0 })}
            min={1}
            max={50}
            className="w-full px-3 py-2.5 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 bg-background"
          />
        </div>

        {/* Duration */}
        <div className="space-y-2">
          <label className="flex items-center gap-1.5 text-sm font-semibold">
            <Clock size={14} className="text-primary" />
            Time (min)
          </label>
          <input
            type="number"
            value={classInfo.duration || ""}
            onChange={(e) => onChange({ ...classInfo, duration: parseInt(e.target.value) || 0 })}
            min={15}
            max={180}
            step={5}
            className="w-full px-3 py-2.5 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 bg-background"
          />
        </div>
      </div>

      <button
        onClick={onNext}
        className="w-full flex items-center justify-center gap-2 py-3 bg-primary text-white font-semibold rounded-xl hover:bg-primary-dark transition-colors"
      >
        Next
        <ArrowRight size={16} />
      </button>
    </div>
  );
}
