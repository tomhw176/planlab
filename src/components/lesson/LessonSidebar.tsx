"use client";

import { useState } from "react";
import { ArrowLeft, Clock, BookOpen, FileText, Check, Pencil, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { StatusBadge } from "../StatusBadge";
import { cn } from "@/lib/utils";
import type { ViewState } from "@/app/page";

interface LessonMeta {
  id: string;
  title: string;
  status: string;
  duration: number;
  templateId: string | null;
  creationMode: string;
  notes: string;
  unit?: {
    id: string;
    title: string;
    courseId: string | null;
    course?: { id: string; title: string };
  };
}

interface Props {
  lesson: LessonMeta;
  filledSections: number;
  totalSections: number;
  collapsed: boolean;
  onToggleCollapse: () => void;
  onNavigate: (view: ViewState) => void;
  onUpdateField: (field: string, value: unknown) => Promise<void>;
}

export function LessonSidebar({
  lesson,
  filledSections,
  totalSections,
  collapsed,
  onToggleCollapse,
  onNavigate,
  onUpdateField,
}: Props) {
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState(lesson.title);
  const [editingDuration, setEditingDuration] = useState(false);
  const [durationDraft, setDurationDraft] = useState(lesson.duration);
  const [editingNotes, setEditingNotes] = useState(false);
  const [notesDraft, setNotesDraft] = useState(lesson.notes);

  const handleBack = () => {
    if (lesson.unit?.courseId) {
      onNavigate({ type: "course", courseId: lesson.unit.courseId });
    } else {
      onNavigate({ type: "home" });
    }
  };

  // Collapsed: narrow strip with icons only
  if (collapsed) {
    return (
      <div className="w-12 border-r border-border bg-surface flex flex-col items-center h-full shrink-0 py-3 gap-3">
        <button
          onClick={onToggleCollapse}
          className="p-1.5 text-muted hover:text-primary hover:bg-surface-hover rounded-lg transition-colors"
          title="Expand sidebar"
        >
          <PanelLeftOpen size={16} />
        </button>
        <button
          onClick={handleBack}
          className="p-1.5 text-muted hover:text-primary hover:bg-surface-hover rounded-lg transition-colors"
          title={lesson.unit?.course?.title || "Back"}
        >
          <ArrowLeft size={16} />
        </button>
        <div className="w-6 h-px bg-border" />
        <div className="flex flex-col items-center gap-1" title={`${lesson.duration} min`}>
          <Clock size={14} className="text-muted" />
          <span className="text-[10px] text-muted">{lesson.duration}</span>
        </div>
        <StatusBadge
          status={lesson.status}
          size="sm"
          onClick={() =>
            onUpdateField(
              "status",
              lesson.status === "confirmed" ? "draft" : "confirmed"
            )
          }
        />
        <div className="w-6 h-px bg-border" />
        <div className="relative w-6 h-6" title={`${filledSections}/${totalSections} sections`}>
          <svg viewBox="0 0 24 24" className="w-6 h-6 -rotate-90">
            <circle cx="12" cy="12" r="10" fill="none" stroke="var(--color-border)" strokeWidth="2" />
            <circle
              cx="12" cy="12" r="10" fill="none" stroke="var(--color-primary)" strokeWidth="2"
              strokeDasharray={`${(filledSections / totalSections) * 62.8} 62.8`}
              strokeLinecap="round"
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-[8px] font-bold text-muted">
            {filledSections}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-64 border-r border-border bg-surface flex flex-col h-full shrink-0">
      {/* Back button + breadcrumb */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={handleBack}
            className="flex items-center gap-1.5 text-sm text-muted hover:text-primary transition-colors"
          >
            <ArrowLeft size={14} />
            {lesson.unit?.course?.title || "Back"}
          </button>
          <button
            onClick={onToggleCollapse}
            className="p-1 text-muted hover:text-primary hover:bg-surface-hover rounded-lg transition-colors"
            title="Collapse sidebar"
          >
            <PanelLeftClose size={14} />
          </button>
        </div>

        {lesson.unit && (
          <div className="text-xs text-muted flex items-center gap-1.5 mb-3">
            <BookOpen size={12} />
            <span className="truncate">{lesson.unit.title}</span>
          </div>
        )}

        {/* Title */}
        {editingTitle ? (
          <div className="flex gap-1">
            <input
              value={titleDraft}
              onChange={(e) => setTitleDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  onUpdateField("title", titleDraft);
                  setEditingTitle(false);
                }
                if (e.key === "Escape") {
                  setTitleDraft(lesson.title);
                  setEditingTitle(false);
                }
              }}
              className="flex-1 text-base font-bold px-1 py-0.5 border border-border rounded focus:outline-none focus:ring-2 focus:ring-primary/50"
              autoFocus
            />
            <button
              onClick={() => {
                onUpdateField("title", titleDraft);
                setEditingTitle(false);
              }}
              className="p-1 text-success hover:bg-success/10 rounded"
            >
              <Check size={12} />
            </button>
          </div>
        ) : (
          <h2
            onClick={() => setEditingTitle(true)}
            className="text-base font-bold cursor-pointer hover:text-primary transition-colors group flex items-center gap-1"
          >
            {lesson.title}
            <Pencil size={10} className="opacity-0 group-hover:opacity-50" />
          </h2>
        )}
      </div>

      {/* Metadata */}
      <div className="p-4 space-y-4 flex-1 overflow-y-auto">
        {/* Template badge */}
        {lesson.creationMode === "template" && lesson.templateId && (
          <div className="flex items-center gap-1.5 text-xs text-muted">
            <FileText size={12} />
            <span>From template</span>
          </div>
        )}

        {/* Duration */}
        <div>
          <label className="text-xs font-medium text-muted block mb-1">Duration</label>
          {editingDuration ? (
            <div className="flex items-center gap-1">
              <input
                type="number"
                value={durationDraft}
                onChange={(e) => setDurationDraft(parseInt(e.target.value) || 0)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    onUpdateField("duration", durationDraft);
                    setEditingDuration(false);
                  }
                  if (e.key === "Escape") {
                    setDurationDraft(lesson.duration);
                    setEditingDuration(false);
                  }
                }}
                className="w-16 px-2 py-1 text-sm border border-border rounded focus:outline-none focus:ring-2 focus:ring-primary/50 text-center"
                autoFocus
              />
              <span className="text-sm text-muted">min</span>
              <button
                onClick={() => {
                  onUpdateField("duration", durationDraft);
                  setEditingDuration(false);
                }}
                className="p-0.5 text-success hover:bg-success/10 rounded"
              >
                <Check size={12} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setEditingDuration(true)}
              className="flex items-center gap-1.5 text-sm hover:text-primary transition-colors"
            >
              <Clock size={14} className="text-muted" />
              {lesson.duration} min
            </button>
          )}
        </div>

        {/* Status */}
        <div>
          <label className="text-xs font-medium text-muted block mb-1">Status</label>
          <StatusBadge
            status={lesson.status}
            onClick={() =>
              onUpdateField(
                "status",
                lesson.status === "confirmed" ? "draft" : "confirmed"
              )
            }
          />
        </div>

        {/* Completeness */}
        <div>
          <label className="text-xs font-medium text-muted block mb-1">Completeness</label>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-border rounded-full h-2 overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all"
                style={{ width: `${(filledSections / totalSections) * 100}%` }}
              />
            </div>
            <span className="text-xs text-muted">
              {filledSections}/{totalSections}
            </span>
          </div>
        </div>

        {/* Publish / Revert */}
        {lesson.status === "draft" ? (
          <button
            onClick={() => onUpdateField("status", "confirmed")}
            className="w-full py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-dark transition-colors"
          >
            Publish Lesson
          </button>
        ) : (
          <button
            onClick={() => onUpdateField("status", "draft")}
            className="w-full py-1.5 border border-border text-sm text-muted rounded-lg hover:bg-surface-hover transition-colors"
          >
            Revert to Draft
          </button>
        )}

        {/* Notes */}
        <div>
          <label className="text-xs font-medium text-muted block mb-1">Teacher Notes</label>
          {editingNotes ? (
            <div className="space-y-1">
              <textarea
                value={notesDraft}
                onChange={(e) => setNotesDraft(e.target.value)}
                rows={4}
                className="w-full px-2 py-1.5 text-xs border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                placeholder="Personal notes..."
                autoFocus
              />
              <div className="flex gap-1 justify-end">
                <button
                  onClick={() => {
                    onUpdateField("notes", notesDraft);
                    setEditingNotes(false);
                  }}
                  className="px-2 py-0.5 text-xs bg-primary text-white rounded hover:bg-primary-dark"
                >
                  Save
                </button>
                <button
                  onClick={() => {
                    setNotesDraft(lesson.notes);
                    setEditingNotes(false);
                  }}
                  className="px-2 py-0.5 text-xs border border-border rounded hover:bg-surface-hover"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setEditingNotes(true)}
              className="w-full text-left text-xs text-muted hover:text-foreground transition-colors p-2 rounded border border-dashed border-border hover:border-primary/50 min-h-[40px]"
            >
              {lesson.notes || "Click to add notes..."}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
