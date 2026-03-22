"use client";

import { useState } from "react";
import { LessonCard } from "./LessonCard";
import { Plus, Trash2, GripVertical, Clock } from "lucide-react";

interface Activity {
  name: string;
  duration: string;
  description: string;
}

interface Props {
  lessonId: string;
  value: Activity[];
  onUpdate: (value: Activity[]) => Promise<void>;
}

export function LessonSequenceCard({ lessonId, value, onUpdate }: Props) {
  const activities = Array.isArray(value) ? value : [];
  const [draft, setDraft] = useState<Activity[]>(activities);

  const totalMinutes = activities.reduce((sum, act) => {
    const num = parseInt(act.duration);
    return sum + (isNaN(num) ? 0 : num);
  }, 0);

  const addActivity = () => {
    setDraft([...draft, { name: "", duration: "", description: "" }]);
  };

  const updateActivity = (index: number, field: keyof Activity, val: string) => {
    const updated = [...draft];
    updated[index] = { ...updated[index], [field]: val };
    setDraft(updated);
  };

  const removeActivity = (index: number) => {
    setDraft(draft.filter((_, i) => i !== index));
  };

  return (
    <LessonCard
      title="Lesson Sequence"
      sectionKey="activities"
      accent="amber"
      lessonId={lessonId}
      isEmpty={activities.length === 0}
      span="full"
      onSave={() => onUpdate(draft)}
      onCancel={() => setDraft(activities)}
      onAIAccept={(content) => {
        try {
          const parsed = JSON.parse(content);
          if (Array.isArray(parsed)) {
            setDraft(parsed);
            onUpdate(parsed);
          }
        } catch {
          // If not JSON, create a single activity from the text
          const newAct = { name: content, duration: "", description: "" };
          const updated = [...draft, newAct];
          setDraft(updated);
          onUpdate(updated);
        }
      }}
    >
      {({ editing }) =>
        editing ? (
          <div className="space-y-3">
            {draft.map((act, i) => (
              <div key={i} className="flex gap-2 items-start p-3 bg-background rounded-lg border border-border/50">
                <GripVertical size={14} className="text-muted mt-2 shrink-0 cursor-grab" />
                <div className="flex-1 space-y-2">
                  <div className="flex gap-2">
                    <input
                      value={act.name}
                      onChange={(e) => updateActivity(i, "name", e.target.value)}
                      placeholder="Activity name"
                      className="flex-1 px-2 py-1.5 text-sm font-medium border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                    <div className="flex items-center gap-1 shrink-0">
                      <Clock size={12} className="text-muted" />
                      <input
                        value={act.duration}
                        onChange={(e) => updateActivity(i, "duration", e.target.value)}
                        placeholder="min"
                        className="w-16 px-2 py-1.5 text-sm border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 text-center"
                      />
                    </div>
                  </div>
                  <textarea
                    value={act.description}
                    onChange={(e) => updateActivity(i, "description", e.target.value)}
                    placeholder="Describe the activity..."
                    rows={2}
                    className="w-full px-2 py-1.5 text-sm border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                  />
                </div>
                <button
                  onClick={() => removeActivity(i)}
                  className="text-muted hover:text-danger transition-colors mt-2"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
            <button
              onClick={addActivity}
              className="w-full py-2 border-2 border-dashed border-border rounded-lg text-sm text-muted hover:text-primary hover:border-primary/50 transition-colors flex items-center justify-center gap-1"
            >
              <Plus size={14} /> Add Activity
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {activities.map((act, i) => (
              <div key={i} className="flex gap-3 items-start p-3 bg-background rounded-lg">
                <span className="text-xs font-bold text-amber-600 bg-amber-50 rounded-full w-6 h-6 flex items-center justify-center shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{act.name}</span>
                    {act.duration && (
                      <span className="text-xs text-muted bg-amber-50 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                        <Clock size={10} />
                        {act.duration} min
                      </span>
                    )}
                  </div>
                  {act.description && (
                    <p className="text-xs text-muted mt-1">{act.description}</p>
                  )}
                </div>
              </div>
            ))}
            {totalMinutes > 0 && (
              <div className="text-right text-xs text-muted pt-1 border-t border-border/50">
                Total: {totalMinutes} minutes
              </div>
            )}
          </div>
        )
      }
    </LessonCard>
  );
}
