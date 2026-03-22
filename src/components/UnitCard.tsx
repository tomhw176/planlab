"use client";

import { useState } from "react";
import type { ViewState, Unit, Lesson } from "@/app/page";
import {
  ChevronDown,
  ChevronRight,
  Plus,
  Pencil,
  Trash2,
  Check,
  X,
  GripVertical,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { StatusBadge } from "./StatusBadge";
import { CreateLessonModal } from "./lesson/CreateLessonModal";

interface UnitCardProps {
  unit: Unit;
  courseId: string;
  courseColor: string;
  courseGradeLevel?: string;
  courseDefaults?: { numStudents?: number; lessonDuration?: number };
  onNavigate: (view: ViewState) => void;
  onRefresh: () => void;
}

export function UnitCard({
  unit,
  courseId,
  courseColor,
  courseGradeLevel,
  courseDefaults,
  onNavigate,
  onRefresh,
}: UnitCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    title: unit.title,
    description: unit.description,
    bigIdea: unit.bigIdea,
  });
  const [showCreateModal, setShowCreateModal] = useState(false);

  const lessons = (unit.lessons ?? []).sort((a, b) => a.order - b.order);

  const saveUnit = async () => {
    await fetch(`/api/units/${unit.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editForm),
    });
    setEditing(false);
    onRefresh();
  };

  const deleteUnit = async () => {
    if (!confirm("Delete this unit and all its lessons?")) return;
    await fetch(`/api/units/${unit.id}`, { method: "DELETE" });
    onRefresh();
  };

  const toggleStatus = async () => {
    await fetch(`/api/units/${unit.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: unit.status === "confirmed" ? "draft" : "confirmed",
      }),
    });
    onRefresh();
  };

  return (
    <>
      <div className="border border-border rounded-xl bg-surface overflow-hidden">
        {/* Unit Header */}
        <div className="flex items-center gap-2 p-4">
          <GripVertical size={16} className="text-muted cursor-grab shrink-0" />
          <button
            onClick={() => setExpanded(!expanded)}
            className="shrink-0 text-muted hover:text-foreground"
          >
            {expanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
          </button>

          <div
            className="w-1.5 h-8 rounded-full shrink-0"
            style={{ backgroundColor: courseColor }}
          />

          {editing ? (
            <div className="flex-1 space-y-2">
              <input
                type="text"
                value={editForm.title}
                onChange={(e) =>
                  setEditForm({ ...editForm, title: e.target.value })
                }
                className="w-full px-2 py-1 text-sm font-semibold border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
                autoFocus
              />
              <input
                type="text"
                value={editForm.bigIdea}
                onChange={(e) =>
                  setEditForm({ ...editForm, bigIdea: e.target.value })
                }
                placeholder="Big Idea..."
                className="w-full px-2 py-1 text-xs border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
              <textarea
                value={editForm.description}
                onChange={(e) =>
                  setEditForm({ ...editForm, description: e.target.value })
                }
                placeholder="Description..."
                rows={2}
                className="w-full px-2 py-1 text-xs border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
              <div className="flex gap-2">
                <button
                  onClick={saveUnit}
                  className="flex items-center gap-1 px-2 py-1 text-xs bg-primary text-white rounded-md hover:bg-primary-dark"
                >
                  <Check size={12} /> Save
                </button>
                <button
                  onClick={() => setEditing(false)}
                  className="flex items-center gap-1 px-2 py-1 text-xs border border-border rounded-md hover:bg-surface-hover"
                >
                  <X size={12} /> Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted font-mono">
                    U{unit.order + 1}
                  </span>
                  <h3 className="font-semibold truncate">{unit.title}</h3>
                  <StatusBadge
                    status={unit.status}
                    onClick={toggleStatus}
                  />
                </div>
                {unit.bigIdea && (
                  <p className="text-xs text-muted mt-0.5 truncate">
                    Big Idea: {unit.bigIdea}
                  </p>
                )}
              </div>

              <span className="text-xs text-muted shrink-0">
                {lessons.length} lesson{lessons.length !== 1 ? "s" : ""}
              </span>

              <button
                onClick={() => setEditing(true)}
                className="text-muted hover:text-primary transition-colors shrink-0"
              >
                <Pencil size={14} />
              </button>
              <button
                onClick={deleteUnit}
                className="text-muted hover:text-danger transition-colors shrink-0"
              >
                <Trash2 size={14} />
              </button>
            </>
          )}
        </div>

        {/* Lessons List */}
        {expanded && (
          <div className="border-t border-border bg-background/50">
            {lessons.length === 0 && (
              <p className="text-xs text-muted text-center py-4">
                No lessons yet
              </p>
            )}

            {lessons.map((lesson) => (
              <LessonRow
                key={lesson.id}
                lesson={lesson}
                onNavigate={onNavigate}
                onRefresh={onRefresh}
              />
            ))}

            <button
              onClick={() => setShowCreateModal(true)}
              className="w-full flex items-center justify-center gap-1 py-2.5 text-xs text-muted hover:text-primary hover:bg-surface-hover transition-colors"
            >
              <Plus size={14} />
              Add Lesson
            </button>
          </div>
        )}
      </div>

      {/* Create Lesson Modal */}
      {showCreateModal && (
        <CreateLessonModal
          unitId={unit.id}
          courseId={courseId}
          courseGradeLevel={courseGradeLevel}
          courseDefaults={courseDefaults}
          onClose={() => setShowCreateModal(false)}
          onCreated={() => onRefresh()}
          onNavigate={onNavigate}
        />
      )}
    </>
  );
}

function LessonRow({
  lesson,
  onNavigate,
  onRefresh,
}: {
  lesson: Lesson;
  onNavigate: (view: ViewState) => void;
  onRefresh: () => void;
}) {
  const deleteLesson = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Delete this lesson?")) return;
    await fetch(`/api/lessons/${lesson.id}`, { method: "DELETE" });
    onRefresh();
  };

  return (
    <button
      onClick={() => onNavigate({ type: "lesson", lessonId: lesson.id })}
      className="w-full flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-surface-hover transition-colors text-left border-b border-border last:border-b-0 group"
    >
      <GripVertical
        size={14}
        className="text-muted/50 cursor-grab shrink-0"
      />
      <span className="text-xs text-muted font-mono shrink-0">
        L{lesson.order + 1}
      </span>
      <span className="flex-1 truncate">{lesson.title}</span>
      <StatusBadge status={lesson.status} size="sm" />
      <span
        onClick={deleteLesson}
        className="text-muted hover:text-danger opacity-0 group-hover:opacity-100 transition-all shrink-0"
      >
        <Trash2 size={12} />
      </span>
    </button>
  );
}
