"use client";

import { useState } from "react";
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
          <p className="text-sm whitespace-pre-wrap">{value}</p>
        )
      }
    </LessonCard>
  );
}
