"use client";

import { useState } from "react";
import { ArrowLeft, ArrowRight, ChevronDown, ChevronUp, SlidersHorizontal } from "lucide-react";

export interface SliderValues {
  prepDemand: number;
  teacherDirection: number;
  collaboration: number;
  assessmentEvidence: number;
  managementComplexity: number;
}

export interface ConstraintValues {
  noTechRequired: boolean;
  chromebooksAvailable: boolean;
  phonesAvailable: boolean;
}

export interface LessonConfig {
  topic: string;
  grade: string;
  students: string;
  duration: string;
  classCharacteristics: string;
  learningObjective: string;
  purposeNotes: string;
}

interface CourseDefaults {
  numStudents?: number;
  lessonDuration?: number;
}

interface Props {
  title: string;
  onTitleChange: (title: string) => void;
  courseGradeLevel?: string;
  courseDefaults?: CourseDefaults;
  onContinue: (config: LessonConfig, sliders: SliderValues, constraints: ConstraintValues) => void;
  onBack: () => void;
}

// Store config globally so GenerateStep can access it
export let lastConfig: Record<string, string> = {};
export let lastMode: "auto" | "options" = "auto";
export let lastSliders: SliderValues = {
  prepDemand: 3,
  teacherDirection: 3,
  collaboration: 3,
  assessmentEvidence: 3,
  managementComplexity: 3,
};
export let lastConstraints: ConstraintValues = {
  noTechRequired: false,
  chromebooksAvailable: false,
  phonesAvailable: false,
};

export function setLastMode(mode: "auto" | "options") {
  lastMode = mode;
}

export function updateSlidersFromTemplate(templateSliders: SliderValues) {
  lastSliders = { ...templateSliders };
}

const SLIDER_CONFIG: {
  key: keyof SliderValues;
  label: string;
  low: string;
  high: string;
}[] = [
  { key: "prepDemand", label: "Prep Demand", low: "Low", high: "High" },
  { key: "teacherDirection", label: "Teacher Direction", low: "Student-led", high: "Teacher-led" },
  { key: "collaboration", label: "Collaboration", low: "Individual", high: "Collaborative" },
  { key: "assessmentEvidence", label: "Assessment Evidence", low: "Low", high: "High" },
  { key: "managementComplexity", label: "Management Complexity", low: "Simple", high: "Complex" },
];

export function ConfigureStep({
  title,
  onTitleChange,
  courseGradeLevel,
  courseDefaults,
  onContinue,
  onBack,
}: Props) {
  // Class Info
  const [grade, setGrade] = useState(courseGradeLevel || "");
  const [numStudents, setNumStudents] = useState(String(courseDefaults?.numStudents || 30));
  const [duration, setDuration] = useState(String(courseDefaults?.lessonDuration || 60));
  const [classCharacteristics, setClassCharacteristics] = useState("");

  // Lesson Purpose
  const [topic, setTopic] = useState("");
  const [learningObjective, setLearningObjective] = useState("");
  const [purposeNotes, setPurposeNotes] = useState("");

  // Customize
  const [customizeOpen, setCustomizeOpen] = useState(false);
  const [sliders, setSliders] = useState<SliderValues>({
    prepDemand: 3,
    teacherDirection: 3,
    collaboration: 3,
    assessmentEvidence: 3,
    managementComplexity: 3,
  });
  const [constraints, setConstraints] = useState<ConstraintValues>({
    noTechRequired: false,
    chromebooksAvailable: false,
    phonesAvailable: false,
  });

  const updateSlider = (key: keyof SliderValues, value: number) => {
    setSliders((prev) => ({ ...prev, [key]: value }));
  };

  const isValid = () => {
    return topic.trim().length > 0 && grade.trim().length > 0;
  };

  const handleContinue = () => {
    const config: LessonConfig = {
      topic,
      grade,
      students: numStudents,
      duration,
      classCharacteristics,
      learningObjective,
      purposeNotes,
    };
    // Store globally for GenerateStep access
    lastConfig = { ...config };
    lastSliders = { ...sliders };
    lastConstraints = { ...constraints };
    onContinue(config, sliders, constraints);
  };

  const slidersModified = Object.values(sliders).some((v) => v !== 3);
  const constraintsActive = constraints.noTechRequired || constraints.chromebooksAvailable || constraints.phonesAvailable;

  return (
    <div className="space-y-5">
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm text-muted hover:text-primary transition-colors"
      >
        <ArrowLeft size={14} />
        Back
      </button>

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

      {/* Section A: Class Info */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold text-muted uppercase tracking-wider">Class Info</h4>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-medium mb-1">Grade</label>
            <select
              value={grade}
              onChange={(e) => setGrade(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 bg-background"
            >
              <option value="">Select...</option>
              {["6", "7", "8", "9", "10", "11", "12"].map((g) => (
                <option key={g} value={g}>Grade {g}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Students</label>
            <input
              type="number"
              value={numStudents}
              onChange={(e) => setNumStudents(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 bg-background"
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Duration (min)</label>
            <input
              type="number"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 bg-background"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium mb-1">
            Class Characteristics / Student Preferences
            <span className="text-muted font-normal ml-1">(optional)</span>
          </label>
          <textarea
            value={classCharacteristics}
            onChange={(e) => setClassCharacteristics(e.target.value)}
            placeholder="e.g. Strong verbal skills but reluctant writers, mixed reading levels, high energy class..."
            rows={2}
            className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 bg-background resize-none"
          />
        </div>
      </div>

      {/* Section B: Lesson Purpose */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold text-muted uppercase tracking-wider">Lesson Purpose</h4>
        <div>
          <label className="block text-xs font-medium mb-1">Topic</label>
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g. The French Revolution, Causes of WWI, Treaty of Versailles..."
            className="w-full px-3 py-2.5 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 bg-background"
          />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1">
            Learning Objective
            <span className="text-muted font-normal ml-1">(optional)</span>
          </label>
          <textarea
            value={learningObjective}
            onChange={(e) => setLearningObjective(e.target.value)}
            placeholder="e.g. Students will evaluate the causes of the revolution and assess the role of social inequality..."
            rows={2}
            className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 bg-background resize-none"
          />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1">
            Purpose / Vision / Notes
            <span className="text-muted font-normal ml-1">(optional)</span>
          </label>
          <textarea
            value={purposeNotes}
            onChange={(e) => setPurposeNotes(e.target.value)}
            placeholder="Any other context: specific skills to emphasize, connections to previous lessons, student interests..."
            rows={2}
            className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 bg-background resize-none"
          />
        </div>
      </div>

      {/* Section C: Customize (expandable) */}
      <div className="border border-border rounded-xl overflow-hidden">
        <button
          onClick={() => setCustomizeOpen(!customizeOpen)}
          className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold hover:bg-surface-hover transition-colors"
        >
          <div className="flex items-center gap-2">
            <SlidersHorizontal size={14} className="text-muted" />
            <span>Customize</span>
            {(slidersModified || constraintsActive) && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                Modified
              </span>
            )}
          </div>
          {customizeOpen ? <ChevronUp size={14} className="text-muted" /> : <ChevronDown size={14} className="text-muted" />}
        </button>

        {customizeOpen && (
          <div className="px-4 pb-4 space-y-5 border-t border-border">
            {/* Sliders */}
            <div className="pt-3 space-y-4">
              <h5 className="text-xs font-bold text-muted uppercase tracking-wider">Lesson Style</h5>
              {SLIDER_CONFIG.map(({ key, label, low, high }) => (
                <div key={key}>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-medium">{label}</label>
                    <span className="text-[10px] text-muted">
                      {sliders[key] <= 2 ? low : sliders[key] >= 4 ? high : "Balanced"}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] text-muted w-16 text-right shrink-0">{low}</span>
                    <input
                      type="range"
                      min={1}
                      max={5}
                      value={sliders[key]}
                      onChange={(e) => updateSlider(key, parseInt(e.target.value))}
                      className="flex-1 h-1.5 appearance-none bg-border rounded-full cursor-pointer"
                      style={{ accentColor: "#6366f1" }}
                    />
                    <span className="text-[10px] text-muted w-16 shrink-0">{high}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Constraints */}
            <div className="space-y-3">
              <h5 className="text-xs font-bold text-muted uppercase tracking-wider">Constraints</h5>
              <label className="flex items-center gap-2.5 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={constraints.noTechRequired}
                  onChange={(e) => setConstraints((prev) => ({ ...prev, noTechRequired: e.target.checked }))}
                  className="rounded border-border"
                  style={{ accentColor: "#6366f1" }}
                />
                <span>No tech required for teacher</span>
              </label>
              <label className="flex items-center gap-2.5 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={constraints.chromebooksAvailable}
                  onChange={(e) => setConstraints((prev) => ({ ...prev, chromebooksAvailable: e.target.checked }))}
                  className="rounded border-border"
                  style={{ accentColor: "#6366f1" }}
                />
                <span>1-to-1 Chromebooks available</span>
              </label>
              <label className="flex items-center gap-2.5 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={constraints.phonesAvailable}
                  onChange={(e) => setConstraints((prev) => ({ ...prev, phonesAvailable: e.target.checked }))}
                  className="rounded border-border"
                  style={{ accentColor: "#6366f1" }}
                />
                <span>Student phones / tablets available</span>
              </label>
            </div>
          </div>
        )}
      </div>

      {/* Continue button */}
      <div className="pt-2">
        <button
          onClick={handleContinue}
          disabled={!isValid()}
          className="w-full flex items-center justify-center gap-2 py-3 bg-primary text-white font-semibold rounded-xl hover:bg-primary-dark transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Continue
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}
