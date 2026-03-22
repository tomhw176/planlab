import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const COURSE_COLORS = [
  "#6366f1", // indigo
  "#f59e0b", // amber
  "#10b981", // emerald
  "#ef4444", // red
  "#8b5cf6", // violet
  "#06b6d4", // cyan
  "#f97316", // orange
  "#ec4899", // pink
  "#14b8a6", // teal
  "#84cc16", // lime
];

export const STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  confirmed: "Confirmed",
};

export const RESOURCE_TYPES = [
  { value: "slides", label: "Slide Deck" },
  { value: "worksheet", label: "Worksheet" },
  { value: "rubric", label: "Rubric" },
  { value: "reading", label: "Reading" },
  { value: "assessment", label: "Assessment" },
];

export const TAG_CATEGORIES = [
  { value: "bigIdea", label: "Big Idea" },
  { value: "competency", label: "Curricular Competency" },
  { value: "skill", label: "Skill" },
  { value: "content", label: "Content" },
];
