"use client";

import { useState } from "react";
import { LessonCard } from "./LessonCard";

interface CurriculumConnection {
  bigIdea: string;
  competencyFocus: string;
  contentConnection: string;
}

interface Props {
  lessonId: string;
  value: CurriculumConnection;
  onUpdate: (value: CurriculumConnection) => Promise<void>;
}

export function CurriculumConnectionCard({ lessonId, value, onUpdate }: Props) {
  const [draft, setDraft] = useState<CurriculumConnection>(value);
  const isEmpty = !value.bigIdea && !value.competencyFocus && !value.contentConnection;

  return (
    <LessonCard
      title="Connection to Curriculum"
      sectionKey="curriculumConnection"
      accent="indigo"
      lessonId={lessonId}
      isEmpty={isEmpty}
      span="full"
      onSave={() => onUpdate(draft)}
      onCancel={() => setDraft(value)}
      onAIAccept={(content) => {
        try {
          const parsed = JSON.parse(content);
          const updated = {
            bigIdea: parsed.bigIdea || content,
            competencyFocus: parsed.competencyFocus || "",
            contentConnection: parsed.contentConnection || "",
          };
          setDraft(updated);
          onUpdate(updated);
        } catch {
          setDraft({ ...draft, bigIdea: content });
          onUpdate({ ...draft, bigIdea: content });
        }
      }}
    >
      {({ editing }) =>
        editing ? (
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-muted block mb-1">Big Idea</label>
              <textarea
                value={draft.bigIdea}
                onChange={(e) => setDraft({ ...draft, bigIdea: e.target.value })}
                rows={2}
                className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                placeholder="Enter the big idea..."
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted block mb-1">Curricular Competency Focus</label>
              <textarea
                value={draft.competencyFocus}
                onChange={(e) => setDraft({ ...draft, competencyFocus: e.target.value })}
                rows={2}
                className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                placeholder="Enter competency focus..."
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted block mb-1">Content Connection</label>
              <textarea
                value={draft.contentConnection}
                onChange={(e) => setDraft({ ...draft, contentConnection: e.target.value })}
                rows={2}
                className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                placeholder="Enter content connection..."
              />
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {value.bigIdea && (
              <div>
                <span className="text-xs font-medium text-primary">Big Idea: </span>
                <span className="text-sm">{value.bigIdea}</span>
              </div>
            )}
            {value.competencyFocus && (
              <div>
                <span className="text-xs font-medium text-primary">Competency Focus: </span>
                <span className="text-sm">{value.competencyFocus}</span>
              </div>
            )}
            {value.contentConnection && (
              <div>
                <span className="text-xs font-medium text-primary">Content: </span>
                <span className="text-sm">{value.contentConnection}</span>
              </div>
            )}
          </div>
        )
      }
    </LessonCard>
  );
}
