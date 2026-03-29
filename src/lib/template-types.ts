// Shared types for lesson templates across the app

export interface SliderProfile {
  prepDemand: number;           // 1=low, 5=high
  teacherDirection: number;     // 1=student-led, 5=teacher-led
  collaboration: number;        // 1=individual, 5=collaborative
  assessmentEvidence: number;   // 1=low, 5=high
  managementComplexity: number; // 1=simple, 5=complex
}

export interface SliderRange {
  min: number;
  max: number;
}

export interface SliderRanges {
  prepDemand: SliderRange;
  teacherDirection: SliderRange;
  collaboration: SliderRange;
  assessmentEvidence: SliderRange;
  managementComplexity: SliderRange;
}

export interface TemplateStructure {
  icon: string;
  color: string;
  sections: string[];
  bestUseCases: string[];
  sliderDefaults: SliderProfile;
  sliderRanges: SliderRanges;
}

export interface RequiredField {
  field: string;
  label: string;
  type: "text" | "textarea" | "number" | "select";
  required?: boolean;
  default?: number | string;
  useDefault?: "gradeLevel" | "numStudents" | "lessonDuration";
  options?: string[];
  placeholder?: string;
}

export interface LessonTemplate {
  id: string;
  name: string;
  description: string;
  structure: TemplateStructure;
  requiredFields: RequiredField[];
  promptTemplate: string;
}

export interface ClassInfo {
  grade: string;
  students: number;
  duration: number;
}

export interface LessonPurpose {
  topic: string;
  learningObjective: string;
  purpose: string;
  notes: string;
}

export type Constraint = "no_tech" | "chromebooks" | "phones_tablets";

export const SLIDER_LABELS: Record<keyof SliderProfile, { label: string; low: string; high: string }> = {
  prepDemand: { label: "Prep Demand", low: "Low", high: "High" },
  teacherDirection: { label: "Teacher Direction", low: "Student-Led", high: "Teacher-Led" },
  collaboration: { label: "Collaboration", low: "Individual", high: "Collaborative" },
  assessmentEvidence: { label: "Assessment Evidence", low: "Low", high: "High" },
  managementComplexity: { label: "Management Complexity", low: "Simple", high: "Complex" },
};

export const CONSTRAINT_LABELS: Record<Constraint, { label: string; description: string }> = {
  no_tech: { label: "No Tech Required", description: "No laptop, screen, or audio needed" },
  chromebooks: { label: "1:1 Chromebooks", description: "Each student has a Chromebook" },
  phones_tablets: { label: "Student Phones/Tablets", description: "Students can use personal devices" },
};
