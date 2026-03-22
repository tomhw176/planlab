"use client";

import { useEffect, useState } from "react";
import type { ViewState, Course, Unit } from "@/app/page";
import { UnitCard } from "./UnitCard";
import { ScopeSequenceGrid } from "./ScopeSequenceGrid";
import { CalendarPacingView } from "./CalendarPacingView";
import {
  Plus,
  List,
  Grid3X3,
  Calendar,
  Pencil,
  Trash2,
  Check,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { COURSE_COLORS } from "@/lib/utils";

type TabView = "outline" | "scope" | "calendar";

interface CourseViewProps {
  courseId: string;
  onNavigate: (view: ViewState) => void;
  onRefresh: () => void;
}

export function CourseView({ courseId, onNavigate, onRefresh }: CourseViewProps) {
  const [course, setCourse] = useState<Course | null>(null);
  const [tab, setTab] = useState<TabView>("outline");
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ title: "", description: "", gradeLevel: "", color: "" });
  const [addingUnit, setAddingUnit] = useState(false);
  const [newUnitTitle, setNewUnitTitle] = useState("");

  const loadCourse = () => {
    fetch(`/api/courses/${courseId}`)
      .then((r) => r.json())
      .then((data) => {
        setCourse(data);
        setEditForm({
          title: data.title,
          description: data.description,
          gradeLevel: data.gradeLevel,
          color: data.color,
        });
      })
      .catch(console.error);
  };

  useEffect(() => {
    loadCourse();
  }, [courseId]);

  const saveCourse = async () => {
    await fetch(`/api/courses/${courseId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editForm),
    });
    setEditing(false);
    loadCourse();
    onRefresh();
  };

  const deleteCourse = async () => {
    if (!confirm("Delete this course and all its units/lessons?")) return;
    await fetch(`/api/courses/${courseId}`, { method: "DELETE" });
    onNavigate({ type: "home" });
    onRefresh();
  };

  const addUnit = async () => {
    if (!newUnitTitle.trim()) return;
    await fetch("/api/units", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: newUnitTitle.trim(), courseId }),
    });
    setNewUnitTitle("");
    setAddingUnit(false);
    loadCourse();
    onRefresh();
  };

  if (!course) {
    return (
      <div className="flex items-center justify-center h-64 text-muted">
        Loading...
      </div>
    );
  }

  const units = (course.units ?? []).sort((a, b) => a.order - b.order);

  const tabs: { key: TabView; label: string; icon: React.ReactNode }[] = [
    { key: "outline", label: "Outline", icon: <List size={16} /> },
    { key: "scope", label: "Scope & Sequence", icon: <Grid3X3 size={16} /> },
    { key: "calendar", label: "Calendar", icon: <Calendar size={16} /> },
  ];

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Course Header */}
      <div className="mb-6">
        {editing ? (
          <div className="space-y-3">
            <input
              type="text"
              value={editForm.title}
              onChange={(e) =>
                setEditForm({ ...editForm, title: e.target.value })
              }
              className="text-2xl font-bold w-full px-2 py-1 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            <div className="flex gap-3">
              <input
                type="text"
                value={editForm.gradeLevel}
                onChange={(e) =>
                  setEditForm({ ...editForm, gradeLevel: e.target.value })
                }
                placeholder="Grade level (e.g., Grade 8)"
                className="px-2 py-1 text-sm border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
              <div className="flex gap-1">
                {COURSE_COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setEditForm({ ...editForm, color: c })}
                    className={cn(
                      "w-6 h-6 rounded-full border-2 transition-all",
                      editForm.color === c
                        ? "border-foreground scale-110"
                        : "border-transparent"
                    )}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
            <textarea
              value={editForm.description}
              onChange={(e) =>
                setEditForm({ ...editForm, description: e.target.value })
              }
              placeholder="Course description..."
              rows={2}
              className="w-full px-2 py-1 text-sm border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            <div className="flex gap-2">
              <button
                onClick={saveCourse}
                className="flex items-center gap-1 px-3 py-1.5 text-sm bg-primary text-white rounded-md hover:bg-primary-dark"
              >
                <Check size={14} /> Save
              </button>
              <button
                onClick={() => setEditing(false)}
                className="flex items-center gap-1 px-3 py-1.5 text-sm border border-border rounded-md hover:bg-surface-hover"
              >
                <X size={14} /> Cancel
              </button>
            </div>
          </div>
        ) : (
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: course.color }}
              />
              <h1 className="text-2xl font-bold">{course.title}</h1>
              <button
                onClick={() => setEditing(true)}
                className="text-muted hover:text-primary transition-colors"
              >
                <Pencil size={16} />
              </button>
              <button
                onClick={deleteCourse}
                className="text-muted hover:text-danger transition-colors"
              >
                <Trash2 size={16} />
              </button>
            </div>
            <p className="text-sm text-muted">
              {course.subject}
              {course.gradeLevel && ` · ${course.gradeLevel}`}
              {` · ${units.length} unit${units.length !== 1 ? "s" : ""}`}
            </p>
            {course.description && (
              <p className="text-sm text-muted mt-1">{course.description}</p>
            )}
          </div>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 border-b border-border mb-6">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              "flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px",
              tab === t.key
                ? "border-primary text-primary"
                : "border-transparent text-muted hover:text-foreground"
            )}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {tab === "outline" && (
        <div>
          <div className="space-y-4">
            {units.map((unit) => (
              <UnitCard
                key={unit.id}
                unit={unit}
                courseId={course.id}
                courseColor={course.color}
                courseGradeLevel={course.gradeLevel}
                courseDefaults={(course as any).courseDefaults}
                onNavigate={onNavigate}
                onRefresh={() => {
                  loadCourse();
                  onRefresh();
                }}
              />
            ))}
          </div>

          {addingUnit ? (
            <div className="mt-4 flex gap-2">
              <input
                type="text"
                value={newUnitTitle}
                onChange={(e) => setNewUnitTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") addUnit();
                  if (e.key === "Escape") setAddingUnit(false);
                }}
                placeholder="Unit title..."
                className="flex-1 px-3 py-2 text-sm border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
                autoFocus
              />
              <button
                onClick={addUnit}
                className="px-4 py-2 text-sm bg-primary text-white rounded-md hover:bg-primary-dark"
              >
                Add
              </button>
              <button
                onClick={() => setAddingUnit(false)}
                className="px-4 py-2 text-sm border border-border rounded-md hover:bg-surface-hover"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setAddingUnit(true)}
              className="mt-4 flex items-center gap-2 px-4 py-2.5 text-sm text-muted hover:text-primary border border-dashed border-border rounded-lg hover:border-primary transition-colors w-full justify-center"
            >
              <Plus size={16} />
              Add Unit
            </button>
          )}
        </div>
      )}

      {tab === "scope" && (
        <ScopeSequenceGrid units={units} courseColor={course.color} />
      )}

      {tab === "calendar" && (
        <CalendarPacingView
          units={units}
          courseColor={course.color}
          onRefresh={() => {
            loadCourse();
            onRefresh();
          }}
        />
      )}
    </div>
  );
}
