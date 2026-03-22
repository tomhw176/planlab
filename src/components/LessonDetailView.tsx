"use client";

import { useEffect, useState } from "react";
import type { ViewState, Lesson, Activity } from "@/app/page";
import { StatusBadge } from "./StatusBadge";
import { RESOURCE_TYPES } from "@/lib/utils";
import {
  ArrowLeft,
  Pencil,
  Check,
  X,
  Plus,
  Trash2,
  FileText,
  Download,
} from "lucide-react";

interface LessonDetailViewProps {
  lessonId: string;
  onNavigate: (view: ViewState) => void;
  onRefresh: () => void;
}

interface LessonWithRelations extends Lesson {
  unit?: { id: string; title: string; courseId: string | null; course?: { id: string; title: string } };
}

export function LessonDetailView({
  lessonId,
  onNavigate,
  onRefresh,
}: LessonDetailViewProps) {
  const [lesson, setLesson] = useState<LessonWithRelations | null>(null);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Lesson>>({});

  const loadLesson = () => {
    fetch(`/api/lessons/${lessonId}`)
      .then((r) => r.json())
      .then((data) => {
        setLesson(data);
        setEditForm(data);
      })
      .catch(console.error);
  };

  useEffect(() => {
    loadLesson();
  }, [lessonId]);

  const saveLesson = async () => {
    await fetch(`/api/lessons/${lessonId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editForm),
    });
    setEditing(false);
    loadLesson();
    onRefresh();
  };

  const toggleStatus = async () => {
    if (!lesson) return;
    await fetch(`/api/lessons/${lessonId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: lesson.status === "confirmed" ? "draft" : "confirmed",
      }),
    });
    loadLesson();
    onRefresh();
  };

  if (!lesson) {
    return (
      <div className="flex items-center justify-center h-64 text-muted">
        Loading...
      </div>
    );
  }

  const breadcrumb = [];
  if (lesson.unit?.course) {
    breadcrumb.push({
      label: lesson.unit.course.title,
      onClick: () =>
        onNavigate({ type: "course", courseId: lesson.unit!.course!.id }),
    });
  }
  if (lesson.unit) {
    breadcrumb.push({
      label: lesson.unit.title,
      onClick: () => {
        if (lesson.unit?.courseId)
          onNavigate({ type: "course", courseId: lesson.unit.courseId });
      },
    });
  }

  const sections: {
    key: keyof Lesson;
    label: string;
    type: "text" | "textarea" | "activities";
  }[] = [
    { key: "hook", label: "Hook / Opener", type: "textarea" },
    { key: "learningObjectives", label: "Learning Objectives", type: "textarea" },
    { key: "curriculumConnection", label: "Connection to Curriculum", type: "textarea" },
    { key: "keyVocabulary", label: "Key Vocabulary", type: "textarea" },
    { key: "transferableConcepts", label: "Transferable Concepts", type: "textarea" },
    { key: "activities", label: "Activities", type: "activities" },
    { key: "materialsNeeded", label: "Materials Needed", type: "textarea" },
    { key: "differentiation", label: "Differentiation Notes", type: "textarea" },
    { key: "assessment", label: "Assessment / Check for Understanding", type: "textarea" },
    { key: "closure", label: "Closure", type: "textarea" },
  ];

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted mb-4">
        <button
          onClick={() => {
            if (lesson.unit?.courseId)
              onNavigate({ type: "course", courseId: lesson.unit.courseId });
            else onNavigate({ type: "home" });
          }}
          className="hover:text-primary transition-colors"
        >
          <ArrowLeft size={16} />
        </button>
        {breadcrumb.map((b, i) => (
          <span key={i} className="flex items-center gap-2">
            <button
              onClick={b.onClick}
              className="hover:text-primary transition-colors"
            >
              {b.label}
            </button>
            <span>/</span>
          </span>
        ))}
        <span className="text-foreground font-medium">{lesson.title}</span>
      </div>

      {/* Lesson Header */}
      <div className="flex items-center gap-3 mb-6">
        {editing ? (
          <input
            type="text"
            value={editForm.title ?? ""}
            onChange={(e) =>
              setEditForm({ ...editForm, title: e.target.value })
            }
            className="text-2xl font-bold flex-1 px-2 py-1 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        ) : (
          <h1 className="text-2xl font-bold flex-1">{lesson.title}</h1>
        )}
        <StatusBadge status={lesson.status} onClick={toggleStatus} />
        {editing ? (
          <div className="flex gap-2">
            <button
              onClick={saveLesson}
              className="flex items-center gap-1 px-3 py-1.5 text-sm bg-primary text-white rounded-md hover:bg-primary-dark"
            >
              <Check size={14} /> Save
            </button>
            <button
              onClick={() => {
                setEditing(false);
                setEditForm(lesson);
              }}
              className="flex items-center gap-1 px-3 py-1.5 text-sm border border-border rounded-md hover:bg-surface-hover"
            >
              <X size={14} /> Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setEditing(true)}
            className="flex items-center gap-1 px-3 py-1.5 text-sm border border-border rounded-md hover:bg-surface-hover"
          >
            <Pencil size={14} /> Edit
          </button>
        )}
      </div>

      {/* Lesson Sections */}
      <div className="space-y-4">
        {sections.map((section) => (
          <LessonSection
            key={section.key}
            label={section.label}
            value={lesson[section.key] as string | Activity[]}
            editValue={editForm[section.key] as string | Activity[]}
            type={section.type}
            editing={editing}
            onChange={(val) =>
              setEditForm({ ...editForm, [section.key]: val })
            }
          />
        ))}
      </div>

      {/* Resources */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <FileText size={18} />
          Resources
        </h2>
        <div className="space-y-2">
          {(lesson.resources ?? []).map((resource) => (
            <div
              key={resource.id}
              className="flex items-center gap-3 p-3 border border-border rounded-lg bg-surface"
            >
              <span className="text-xs font-medium px-2 py-0.5 bg-primary/10 text-primary rounded-full">
                {RESOURCE_TYPES.find((t) => t.value === resource.type)
                  ?.label ?? resource.type}
              </span>
              <span className="flex-1 text-sm">{resource.title}</span>
              <StatusBadge status={resource.status} size="sm" />
            </div>
          ))}
          {(lesson.resources ?? []).length === 0 && (
            <p className="text-sm text-muted text-center py-4">
              No resources yet. Use the AI chat to generate resources for this
              lesson.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function LessonSection({
  label,
  value,
  editValue,
  type,
  editing,
  onChange,
}: {
  label: string;
  value: string | Activity[];
  editValue: string | Activity[] | undefined;
  type: "text" | "textarea" | "activities";
  editing: boolean;
  onChange: (val: string | Activity[]) => void;
}) {
  if (type === "activities") {
    const activities = (editing ? editValue : value) as Activity[] | undefined;
    const actList = Array.isArray(activities) ? activities : [];

    return (
      <div className="border border-border rounded-lg p-4 bg-surface">
        <h3 className="text-sm font-semibold text-muted uppercase tracking-wider mb-3">
          {label}
        </h3>
        {actList.length === 0 && !editing && (
          <p className="text-sm text-muted italic">No activities defined</p>
        )}
        <div className="space-y-2">
          {actList.map((act, i) => (
            <div key={i} className="flex gap-2 items-start">
              {editing ? (
                <>
                  <input
                    type="text"
                    value={act.name}
                    onChange={(e) => {
                      const updated = [...actList];
                      updated[i] = { ...act, name: e.target.value };
                      onChange(updated);
                    }}
                    placeholder="Activity name"
                    className="flex-1 px-2 py-1 text-sm border border-border rounded-md"
                  />
                  <input
                    type="text"
                    value={act.duration}
                    onChange={(e) => {
                      const updated = [...actList];
                      updated[i] = { ...act, duration: e.target.value };
                      onChange(updated);
                    }}
                    placeholder="Duration"
                    className="w-24 px-2 py-1 text-sm border border-border rounded-md"
                  />
                  <button
                    onClick={() => {
                      onChange(actList.filter((_, j) => j !== i));
                    }}
                    className="text-muted hover:text-danger"
                  >
                    <Trash2 size={14} />
                  </button>
                </>
              ) : (
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{act.name}</span>
                    {act.duration && (
                      <span className="text-xs text-muted bg-background px-1.5 py-0.5 rounded">
                        {act.duration}
                      </span>
                    )}
                  </div>
                  {act.description && (
                    <p className="text-xs text-muted mt-0.5">
                      {act.description}
                    </p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
        {editing && (
          <button
            onClick={() =>
              onChange([
                ...actList,
                { name: "", duration: "", description: "" },
              ])
            }
            className="mt-2 flex items-center gap-1 text-xs text-primary hover:text-primary-dark"
          >
            <Plus size={12} /> Add Activity
          </button>
        )}
      </div>
    );
  }

  const textVal = (editing ? editValue : value) as string | undefined;
  const displayVal = textVal ?? "";

  if (!editing && !displayVal) return null;

  return (
    <div className="border border-border rounded-lg p-4 bg-surface">
      <h3 className="text-sm font-semibold text-muted uppercase tracking-wider mb-2">
        {label}
      </h3>
      {editing ? (
        <textarea
          value={displayVal}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
          className="w-full px-2 py-1 text-sm border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
      ) : (
        <p className="text-sm whitespace-pre-wrap">{displayVal}</p>
      )}
    </div>
  );
}
