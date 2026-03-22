"use client";

import { CurriculumConnectionCard } from "./cards/CurriculumConnectionCard";
import { TextCard } from "./cards/TextCard";
import { MaterialsCard } from "./cards/MaterialsCard";
import { LessonSequenceCard } from "./cards/LessonSequenceCard";

interface CurriculumConnection {
  bigIdea: string;
  competencyFocus: string;
  contentConnection: string;
}

interface Activity {
  name: string;
  duration: string;
  description: string;
}

interface LessonData {
  id: string;
  curriculumConnection: CurriculumConnection;
  learningTarget: string;
  lessonPurpose: string;
  learningObjectives: string;
  materialsNeeded: string;
  hook: string;
  activities: Activity[];
  closure: string;
  assessment: string;
  scaffolds: string;
  extension: string;
}

interface Props {
  lesson: LessonData;
  onUpdateField: (field: string, value: unknown) => Promise<void>;
}

export function LessonCardGrid({ lesson, onUpdateField }: Props) {
  return (
    <div className="space-y-8">
      {/* ── INTENT ── */}
      <section>
        <h2 className="text-sm font-bold text-primary uppercase tracking-wider mb-3 flex items-center gap-2">
          <span className="w-3 h-0.5 bg-primary rounded-full" />
          Intent
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <CurriculumConnectionCard
            lessonId={lesson.id}
            value={lesson.curriculumConnection}
            onUpdate={(v) => onUpdateField("curriculumConnection", v)}
          />
          <TextCard
            title="Learning Target"
            sectionKey="learningTarget"
            accent="indigo"
            lessonId={lesson.id}
            value={lesson.learningTarget}
            onUpdate={(v) => onUpdateField("learningTarget", v)}
            placeholder="What will students be able to do? (student-facing)"
            rows={2}
          />
          <TextCard
            title="Lesson Purpose"
            sectionKey="lessonPurpose"
            accent="indigo"
            lessonId={lesson.id}
            value={lesson.lessonPurpose}
            onUpdate={(v) => onUpdateField("lessonPurpose", v)}
            placeholder="Why does this lesson exist in the unit?"
            rows={2}
          />
          <MaterialsCard
            lessonId={lesson.id}
            value={lesson.materialsNeeded}
            onUpdate={(v) => onUpdateField("materialsNeeded", v)}
          />
        </div>
      </section>

      {/* ── FLOW ── */}
      <section>
        <h2 className="text-sm font-bold text-amber-600 uppercase tracking-wider mb-3 flex items-center gap-2">
          <span className="w-3 h-0.5 bg-amber-500 rounded-full" />
          Flow
        </h2>
        <div className="grid grid-cols-1 gap-4">
          <TextCard
            title="Hook / Opener"
            sectionKey="hook"
            accent="amber"
            lessonId={lesson.id}
            value={lesson.hook}
            onUpdate={(v) => onUpdateField("hook", v)}
            placeholder="How will you grab students' attention?"
            rows={3}
            span="full"
          />
          <LessonSequenceCard
            lessonId={lesson.id}
            value={lesson.activities}
            onUpdate={(v) => onUpdateField("activities", v)}
          />
          <TextCard
            title="Closure"
            sectionKey="closure"
            accent="amber"
            lessonId={lesson.id}
            value={lesson.closure}
            onUpdate={(v) => onUpdateField("closure", v)}
            placeholder="How will the lesson wrap up?"
            rows={2}
            span="full"
          />
        </div>
      </section>

      {/* ── SUPPORT ── */}
      <section>
        <h2 className="text-sm font-bold text-emerald-600 uppercase tracking-wider mb-3 flex items-center gap-2">
          <span className="w-3 h-0.5 bg-emerald-500 rounded-full" />
          Support
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <TextCard
            title="Assessment / Check for Understanding"
            sectionKey="assessment"
            accent="emerald"
            lessonId={lesson.id}
            value={lesson.assessment}
            onUpdate={(v) => onUpdateField("assessment", v)}
            placeholder="How will you check understanding?"
            rows={3}
          />
          <TextCard
            title="Scaffolds / Supports"
            sectionKey="scaffolds"
            accent="emerald"
            lessonId={lesson.id}
            value={lesson.scaffolds}
            onUpdate={(v) => onUpdateField("scaffolds", v)}
            placeholder="What supports will struggling learners need?"
            rows={3}
          />
          <TextCard
            title="Extension / Challenge"
            sectionKey="extension"
            accent="emerald"
            lessonId={lesson.id}
            value={lesson.extension}
            onUpdate={(v) => onUpdateField("extension", v)}
            placeholder="What will advanced learners do?"
            rows={3}
          />
        </div>
      </section>
    </div>
  );
}
