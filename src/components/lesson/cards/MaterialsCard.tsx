"use client";

import { useState } from "react";
import { LessonCard } from "./LessonCard";
import { Plus, X } from "lucide-react";

interface Props {
  lessonId: string;
  value: string;
  onUpdate: (value: string) => Promise<void>;
}

export function MaterialsCard({ lessonId, value, onUpdate }: Props) {
  const [draft, setDraft] = useState(value);
  const [newItem, setNewItem] = useState("");

  const items = draft.split("\n").filter((line) => line.trim());

  const addItem = () => {
    if (!newItem.trim()) return;
    const updated = draft ? `${draft}\n${newItem.trim()}` : newItem.trim();
    setDraft(updated);
    setNewItem("");
  };

  const removeItem = (index: number) => {
    const updated = items.filter((_, i) => i !== index).join("\n");
    setDraft(updated);
  };

  return (
    <LessonCard
      title="Materials"
      sectionKey="materialsNeeded"
      accent="indigo"
      lessonId={lessonId}
      isEmpty={!value}
      onSave={() => onUpdate(draft)}
      onCancel={() => setDraft(value)}
      onAIAccept={(content) => {
        setDraft(content);
        onUpdate(content);
      }}
    >
      {({ editing }) =>
        editing ? (
          <div className="space-y-2">
            {items.map((item, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-primary/30 shrink-0" />
                <span className="text-sm flex-1">{item}</span>
                <button
                  onClick={() => removeItem(i)}
                  className="text-muted hover:text-danger transition-colors"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
            <div className="flex gap-2">
              <input
                value={newItem}
                onChange={(e) => setNewItem(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addItem();
                  }
                }}
                placeholder="Add material..."
                className="flex-1 px-2 py-1 text-sm border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
              <button
                onClick={addItem}
                className="p-1 text-primary hover:bg-primary/10 rounded transition-colors"
              >
                <Plus size={14} />
              </button>
            </div>
          </div>
        ) : (
          <ul className="space-y-1">
            {items.map((item, i) => (
              <li key={i} className="flex items-center gap-2 text-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-primary/40 shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        )
      }
    </LessonCard>
  );
}
