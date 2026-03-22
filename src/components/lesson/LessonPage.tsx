"use client";

import { useEffect, useState, useCallback } from "react";
import type { ViewState } from "@/app/page";
import { LessonSidebar } from "./LessonSidebar";
import { LessonCardGrid } from "./LessonCardGrid";
import { LessonAIBar } from "./LessonAIBar";
import { ResourcesPanel } from "./ResourcesPanel";
import { ChatPanel } from "../ChatPanel";

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

interface LessonFull {
  id: string;
  title: string;
  order: number;
  status: string;
  templateId: string | null;
  creationMode: string;
  duration: number;
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
  notes: string;
  keyVocabulary: string;
  transferableConcepts: string;
  differentiation: string;
  unitId: string | null;
  unit?: {
    id: string;
    title: string;
    courseId: string | null;
    course?: { id: string; title: string };
  };
  resources?: Array<{
    id: string;
    title: string;
    type: string;
    status: string;
  }>;
  tags?: Array<{ id: string; category: string; value: string }>;
}

interface LessonPageProps {
  lessonId: string;
  onNavigate: (view: ViewState) => void;
  onRefresh: () => void;
}

// Fields to count for completeness
const SECTION_FIELDS = [
  "curriculumConnection",
  "learningTarget",
  "lessonPurpose",
  "materialsNeeded",
  "hook",
  "activities",
  "closure",
  "assessment",
  "scaffolds",
  "extension",
] as const;

function countFilledSections(lesson: LessonFull): number {
  let count = 0;
  for (const field of SECTION_FIELDS) {
    const val = lesson[field];
    if (field === "curriculumConnection") {
      const cc = val as CurriculumConnection;
      if (cc.bigIdea || cc.competencyFocus || cc.contentConnection) count++;
    } else if (field === "activities") {
      if (Array.isArray(val) && val.length > 0) count++;
    } else {
      if (val && typeof val === "string" && val.trim()) count++;
    }
  }
  return count;
}

export function LessonPage({ lessonId, onNavigate, onRefresh }: LessonPageProps) {
  const [lesson, setLesson] = useState<LessonFull | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatingAction, setGeneratingAction] = useState<string | null>(null);

  const loadLesson = useCallback(() => {
    fetch(`/api/lessons/${lessonId}`)
      .then((r) => r.json())
      .then((data) => {
        // Ensure curriculumConnection is properly parsed
        if (typeof data.curriculumConnection === "string") {
          try {
            data.curriculumConnection = JSON.parse(data.curriculumConnection);
          } catch {
            data.curriculumConnection = {
              bigIdea: data.curriculumConnection,
              competencyFocus: "",
              contentConnection: "",
            };
          }
        }
        if (!data.curriculumConnection || typeof data.curriculumConnection !== "object") {
          data.curriculumConnection = {
            bigIdea: "",
            competencyFocus: "",
            contentConnection: "",
          };
        }
        setLesson(data);
      })
      .catch(console.error);
  }, [lessonId]);

  useEffect(() => {
    loadLesson();
  }, [loadLesson]);

  const updateField = useCallback(
    async (field: string, value: unknown) => {
      if (!lesson) return;

      // Optimistic update
      setLesson((prev) => (prev ? { ...prev, [field]: value } : prev));

      await fetch(`/api/lessons/${lessonId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: value }),
      });

      onRefresh();
    },
    [lesson, lessonId, onRefresh]
  );

  const handleFullGenerate = useCallback(async () => {
    if (!lesson) return;
    setIsGenerating(true);
    setGeneratingAction("full_plan");

    try {
      const res = await fetch(`/api/lessons/${lessonId}/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ section: "all", action: "full_plan" }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.content) {
          try {
            const parsed = JSON.parse(data.content);
            // Apply all generated fields
            const updates: Record<string, unknown> = {};
            if (parsed.hook) updates.hook = parsed.hook;
            if (parsed.learningTarget) updates.learningTarget = parsed.learningTarget;
            if (parsed.lessonPurpose) updates.lessonPurpose = parsed.lessonPurpose;
            if (parsed.materialsNeeded) updates.materialsNeeded = parsed.materialsNeeded;
            if (parsed.activities) updates.activities = parsed.activities;
            if (parsed.closure) updates.closure = parsed.closure;
            if (parsed.assessment) updates.assessment = parsed.assessment;
            if (parsed.scaffolds) updates.scaffolds = parsed.scaffolds;
            if (parsed.extension) updates.extension = parsed.extension;
            if (parsed.curriculumConnection) updates.curriculumConnection = parsed.curriculumConnection;

            await fetch(`/api/lessons/${lessonId}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(updates),
            });

            loadLesson();
            onRefresh();
          } catch {
            console.error("Failed to parse full plan response");
          }
        }
      }
    } catch (err) {
      console.error("Failed to generate full plan:", err);
    } finally {
      setIsGenerating(false);
      setGeneratingAction(null);
    }
  }, [lesson, lessonId, loadLesson, onRefresh]);

  const handleAIAction = useCallback(
    async (action: string) => {
      setIsGenerating(true);
      setGeneratingAction(action);
      try {
        const res = await fetch(`/api/lessons/${lessonId}/generate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ section: "all", action }),
        });
        if (res.ok) {
          loadLesson();
          onRefresh();
        }
      } catch (err) {
        console.error(`Failed AI action ${action}:`, err);
      } finally {
        setIsGenerating(false);
        setGeneratingAction(null);
      }
    },
    [lessonId, loadLesson, onRefresh]
  );

  if (!lesson) {
    return (
      <div className="flex items-center justify-center h-full text-muted">
        <div className="animate-pulse text-sm">Loading lesson...</div>
      </div>
    );
  }

  const filledSections = countFilledSections(lesson);

  return (
    <div className="flex h-full">
      {/* Sticky Left Sidebar */}
      <LessonSidebar
        lesson={lesson}
        filledSections={filledSections}
        totalSections={SECTION_FIELDS.length}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        onNavigate={onNavigate}
        onUpdateField={updateField}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Top AI Bar */}
        <LessonAIBar
          lessonId={lesson.id}
          onFullGenerate={handleFullGenerate}
          onReview={() => handleAIAction("review")}
          onAlignCurriculum={() => handleAIAction("align")}
          onAdjustTiming={() => handleAIAction("timing")}
          onToggleChat={() => setChatOpen(!chatOpen)}
          chatOpen={chatOpen}
          isGenerating={isGenerating}
          generatingAction={generatingAction}
        />

        {/* Card Grid + Optional Chat */}
        <div className="flex-1 flex overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6">
            <LessonCardGrid lesson={lesson} onUpdateField={updateField} />

            {/* Resources section — available for all lessons */}
            <div className="mt-8 mb-4">
              <h4 className="text-xs font-bold text-violet-600 uppercase tracking-wider flex items-center gap-1.5 mb-4">
                <span className="w-2.5 h-0.5 bg-violet-500 rounded-full" />
                Resources
              </h4>
              <ResourcesPanel
                lessonId={lesson.id}
                existingResources={lesson.resources?.map((r) => ({
                  id: r.id,
                  title: r.title,
                  type: r.type,
                })) || []}
              />
            </div>
          </div>

          {/* Slide-over Chat */}
          {chatOpen && (
            <ChatPanel
              context={{ lessonId: lesson.id }}
              onRefresh={() => {
                loadLesson();
                onRefresh();
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
