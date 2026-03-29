"use client";

import { useState, useMemo } from "react";
import { LessonCard, AccentColor } from "./LessonCard";

interface Props {
  title: string;
  sectionKey: string;
  accent: AccentColor;
  lessonId: string;
  value: string;
  onUpdate: (value: string) => Promise<void>;
  placeholder?: string;
  rows?: number;
  span?: "full" | "half";
}

// Detect if a string looks like raw JSON and convert to readable text
function formatDisplayValue(val: string): string {
  if (!val || typeof val !== "string") return val || "";
  const trimmed = val.trim();
  // Only try to parse if it starts with { or [
  if ((trimmed.startsWith("{") && trimmed.endsWith("}")) || (trimmed.startsWith("[") && trimmed.endsWith("]"))) {
    try {
      const parsed = JSON.parse(trimmed);
      if (typeof parsed === "object" && parsed !== null) {
        return jsonToReadableText(parsed);
      }
    } catch {
      // Not valid JSON, display as-is
    }
  }
  return val;
}

function jsonToReadableText(obj: unknown, indent = ""): string {
  if (obj == null || obj === "") return "";
  if (typeof obj === "string") return obj;
  if (typeof obj === "number" || typeof obj === "boolean") return String(obj);
  if (Array.isArray(obj)) {
    if (obj.length === 0) return "";
    if (typeof obj[0] === "string") {
      return obj.map((item) => `${indent}• ${item}`).join("\n");
    }
    return obj.map((item) => jsonToReadableText(item, indent)).join("\n\n");
  }
  if (typeof obj === "object") {
    const parts: string[] = [];
    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      if (value == null || value === "") continue;
      const label = key.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase()).trim();
      if (typeof value === "string") {
        parts.push(`${indent}${label}: ${value}`);
      } else if (Array.isArray(value)) {
        parts.push(`${indent}${label}:`);
        parts.push(jsonToReadableText(value, indent + "  "));
      } else if (typeof value === "object") {
        parts.push(`${indent}${label}:`);
        parts.push(jsonToReadableText(value, indent + "  "));
      } else {
        parts.push(`${indent}${label}: ${String(value)}`);
      }
    }
    return parts.join("\n");
  }
  return String(obj);
}

export function TextCard({
  title,
  sectionKey,
  accent,
  lessonId,
  value,
  onUpdate,
  placeholder,
  rows = 3,
  span = "half",
}: Props) {
  const [draft, setDraft] = useState(value);
  const displayValue = useMemo(() => formatDisplayValue(value), [value]);

  return (
    <LessonCard
      title={title}
      sectionKey={sectionKey}
      accent={accent}
      lessonId={lessonId}
      isEmpty={!value}
      span={span}
      onSave={() => onUpdate(draft)}
      onCancel={() => setDraft(value)}
      onAIAccept={(content) => {
        setDraft(content);
        onUpdate(content);
      }}
    >
      {({ editing }) =>
        editing ? (
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={rows}
            className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
            placeholder={placeholder || `Enter ${title.toLowerCase()}...`}
          />
        ) : (
          <p className="text-sm whitespace-pre-wrap">{displayValue}</p>
        )
      }
    </LessonCard>
  );
}
