"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import type { ViewState, Course } from "@/app/page";
import {
  BookOpen,
  Plus,
  Home,
  ChevronDown,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
  Wrench,
} from "lucide-react";
import { COURSE_COLORS } from "@/lib/utils";

interface SidebarProps {
  courses: Course[];
  view: ViewState;
  collapsed: boolean;
  onToggleCollapse: () => void;
  onNavigate: (view: ViewState) => void;
  onRefresh: () => void;
}

export function Sidebar({ courses, view, collapsed, onToggleCollapse, onNavigate, onRefresh }: SidebarProps) {
  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [expandedCourses, setExpandedCourses] = useState<Set<string>>(new Set());

  const toggleExpand = (courseId: string) => {
    setExpandedCourses((prev) => {
      const next = new Set(prev);
      if (next.has(courseId)) next.delete(courseId);
      else next.add(courseId);
      return next;
    });
  };

  const createCourse = async () => {
    if (!newTitle.trim()) return;
    const color = COURSE_COLORS[courses.length % COURSE_COLORS.length];
    await fetch("/api/courses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: newTitle.trim(), color }),
    });
    setNewTitle("");
    setCreating(false);
    onRefresh();
  };

  if (collapsed) {
    return (
      <aside className="w-12 bg-surface border-r border-border flex flex-col items-center h-full shrink-0 py-3 gap-2">
        <button
          onClick={onToggleCollapse}
          className="p-1.5 text-muted hover:text-primary hover:bg-surface-hover rounded-lg transition-colors mb-1"
          title="Expand sidebar"
        >
          <PanelLeftOpen size={18} />
        </button>

        <button
          onClick={() => onNavigate({ type: "home" })}
          className={cn(
            "p-1.5 rounded-lg transition-colors",
            view.type === "home"
              ? "bg-primary/10 text-primary"
              : "text-muted hover:text-primary hover:bg-surface-hover"
          )}
          title="Dashboard"
        >
          <Home size={18} />
        </button>

        <button
          onClick={() => onNavigate({ type: "tools" })}
          className={cn(
            "p-1.5 rounded-lg transition-colors",
            view.type === "tools" || view.type === "source-finding" || view.type === "source-finding-new" || view.type === "source-bank"
              ? "bg-primary/10 text-primary"
              : "text-muted hover:text-primary hover:bg-surface-hover"
          )}
          title="Tools"
        >
          <Wrench size={18} />
        </button>

        <div className="w-6 h-px bg-border my-1" />

        {courses.map((course) => {
          const isActive = view.type === "course" && view.courseId === course.id;
          return (
            <button
              key={course.id}
              onClick={() => onNavigate({ type: "course", courseId: course.id })}
              className={cn(
                "p-1.5 rounded-lg transition-colors",
                isActive
                  ? "bg-primary/10"
                  : "hover:bg-surface-hover"
              )}
              title={course.title}
            >
              <div
                className="w-5 h-5 rounded-md"
                style={{ backgroundColor: course.color }}
              />
            </button>
          );
        })}

        <button
          onClick={() => setCreating(true)}
          className="p-1.5 text-muted hover:text-primary hover:bg-surface-hover rounded-lg transition-colors mt-1"
          title="New Course"
        >
          <Plus size={16} />
        </button>

        <div className="flex-1" />

        <div className="text-[10px] text-muted font-medium">{courses.length}</div>
        <BookOpen size={14} className="text-muted" />
      </aside>
    );
  }

  return (
    <aside className="w-64 bg-surface border-r border-border flex flex-col h-full shrink-0">
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-primary">PlanLab</h1>
          <p className="text-xs text-muted mt-0.5">Curriculum Workspace</p>
        </div>
        <button
          onClick={onToggleCollapse}
          className="p-1 text-muted hover:text-primary hover:bg-surface-hover rounded-lg transition-colors"
          title="Collapse sidebar"
        >
          <PanelLeftClose size={16} />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto p-2">
        <button
          onClick={() => onNavigate({ type: "home" })}
          className={cn(
            "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors",
            view.type === "home"
              ? "bg-primary/10 text-primary font-medium"
              : "hover:bg-surface-hover text-foreground"
          )}
        >
          <Home size={16} />
          Dashboard
        </button>

        <button
          onClick={() => onNavigate({ type: "tools" })}
          className={cn(
            "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors",
            view.type === "tools" || view.type === "source-finding" || view.type === "source-finding-new" || view.type === "source-bank"
              ? "bg-primary/10 text-primary font-medium"
              : "hover:bg-surface-hover text-foreground"
          )}
        >
          <Wrench size={16} />
          Tools
        </button>

        <div className="mt-4">
          <div className="flex items-center justify-between px-3 mb-1">
            <span className="text-xs font-semibold text-muted uppercase tracking-wider">
              Courses
            </span>
            <button
              onClick={() => setCreating(true)}
              className="text-muted hover:text-primary transition-colors"
              title="New Course"
            >
              <Plus size={14} />
            </button>
          </div>

          {creating && (
            <div className="px-2 mb-2">
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") createCourse();
                  if (e.key === "Escape") setCreating(false);
                }}
                placeholder="Course name..."
                className="w-full px-2 py-1.5 text-sm border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
                autoFocus
              />
            </div>
          )}

          {courses.map((course) => {
            const isActive =
              view.type === "course" && view.courseId === course.id;
            const isExpanded = expandedCourses.has(course.id);

            return (
              <div key={course.id}>
                <button
                  onClick={() => {
                    onNavigate({ type: "course", courseId: course.id });
                    if (!isExpanded) toggleExpand(course.id);
                  }}
                  className={cn(
                    "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors",
                    isActive
                      ? "bg-primary/10 text-primary font-medium"
                      : "hover:bg-surface-hover text-foreground"
                  )}
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleExpand(course.id);
                    }}
                    className="shrink-0"
                  >
                    {isExpanded ? (
                      <ChevronDown size={14} />
                    ) : (
                      <ChevronRight size={14} />
                    )}
                  </button>
                  <div
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: course.color }}
                  />
                  <span className="truncate">{course.title}</span>
                  <span className="text-xs text-muted ml-auto">
                    {course._count?.units ?? 0}
                  </span>
                </button>

                {isExpanded && course.units && (
                  <div className="ml-7 border-l border-border pl-2 mb-1">
                    {course.units.map((unit) => (
                      <div key={unit.id} className="text-xs text-muted py-1 px-2 truncate">
                        {unit.title}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {courses.length === 0 && !creating && (
            <p className="text-xs text-muted px-3 py-2">
              No courses yet. Click + to create one.
            </p>
          )}
        </div>
      </nav>

      <div className="p-3 border-t border-border">
        <div className="flex items-center gap-2 text-xs text-muted">
          <BookOpen size={14} />
          <span>{courses.length} course{courses.length !== 1 ? "s" : ""}</span>
        </div>
      </div>
    </aside>
  );
}
