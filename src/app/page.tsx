"use client";

import { useEffect, useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { CourseView } from "@/components/CourseView";
import { LessonPage } from "@/components/lesson/LessonPage";
import { ChatPanel } from "@/components/ChatPanel";
import { ToolsPage } from "@/components/tools/ToolsPage";
import { SourceFindingList } from "@/components/tools/SourceFindingList";
import { SourceFindingForm } from "@/components/tools/SourceFindingForm";
import { SourceBankResults } from "@/components/tools/SourceBankResults";
import { PanelRightOpen, PanelRightClose } from "lucide-react";

export type ViewState =
  | { type: "home" }
  | { type: "course"; courseId: string }
  | { type: "lesson"; lessonId: string }
  | { type: "tools" }
  | { type: "source-finding" }
  | { type: "source-finding-new"; lessonId?: string }
  | { type: "source-bank"; sourceBankId: string };

export interface Course {
  id: string;
  title: string;
  subject: string;
  gradeLevel: string;
  description: string;
  color: string;
  _count?: { units: number };
  units?: Unit[];
}

export interface Unit {
  id: string;
  title: string;
  description: string;
  bigIdea: string;
  order: number;
  status: string;
  monthStart: number | null;
  weekStart: number | null;
  monthEnd: number | null;
  weekEnd: number | null;
  courseId: string | null;
  lessons?: Lesson[];
  tags?: Tag[];
}

export interface CurriculumConnection {
  bigIdea: string;
  competencyFocus: string;
  contentConnection: string;
}

export interface Lesson {
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
  hook: string;
  learningObjectives: string;
  materialsNeeded: string;
  activities: Activity[];
  closure: string;
  assessment: string;
  scaffolds: string;
  extension: string;
  keyVocabulary: string;
  transferableConcepts: string;
  differentiation: string;
  notes: string;
  unitId: string | null;
  resources?: Resource[];
  tags?: Tag[];
}

export interface Activity {
  name: string;
  duration: string;
  description: string;
}

export interface Resource {
  id: string;
  title: string;
  type: string;
  content: Record<string, unknown>;
  status: string;
  lessonId: string | null;
}

export interface Tag {
  id: string;
  category: string;
  value: string;
}

export default function Home() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [view, setView] = useState<ViewState>({ type: "home" });
  const [chatOpen, setChatOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = () => setRefreshKey((k) => k + 1);

  useEffect(() => {
    fetch("/api/courses")
      .then((r) => r.json())
      .then(setCourses)
      .catch(console.error);
  }, [refreshKey]);

  // After Google OAuth redirect, navigate back to the lesson that initiated the export
  useEffect(() => {
    try {
      const pending = localStorage.getItem("planlab_pending_google_export");
      if (pending) {
        const { lessonId } = JSON.parse(pending);
        if (lessonId) {
          // Don't remove from localStorage yet — ResourcesPanel will handle that
          setView({ type: "lesson", lessonId });
        }
      }
    } catch {
      // ignore
    }
  }, []);

  const chatContext =
    view.type === "course"
      ? { courseId: view.courseId }
      : view.type === "lesson"
        ? { lessonId: view.lessonId }
        : {};

  return (
    <div className="flex h-full">
      <Sidebar
        courses={courses}
        view={view}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        onNavigate={setView}
        onRefresh={refresh}
      />

      <main className="flex-1 flex overflow-hidden">
        <div className="flex-1 overflow-y-auto">
          {view.type === "home" && (
            <div className="p-8 max-w-4xl mx-auto">
              <h1 className="text-3xl font-bold mb-2">Welcome to PlanLab</h1>
              <p className="text-muted mb-8">
                Your curriculum planning workspace. Select a course from the
                sidebar or create a new one to get started.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {courses.map((course) => (
                  <button
                    key={course.id}
                    onClick={() =>
                      setView({ type: "course", courseId: course.id })
                    }
                    className="text-left p-5 rounded-xl border border-border bg-surface hover:shadow-md transition-all group"
                  >
                    <div
                      className="w-3 h-3 rounded-full mb-3"
                      style={{ backgroundColor: course.color }}
                    />
                    <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">
                      {course.title}
                    </h3>
                    <p className="text-sm text-muted mt-1">
                      {course.subject}{" "}
                      {course.gradeLevel && `· ${course.gradeLevel}`}
                    </p>
                    <p className="text-xs text-muted mt-2">
                      {course._count?.units ?? 0} unit
                      {(course._count?.units ?? 0) !== 1 ? "s" : ""}
                    </p>
                  </button>
                ))}
              </div>

              {courses.length === 0 && (
                <div className="text-center py-16 text-muted">
                  <p className="text-lg mb-2">No courses yet</p>
                  <p className="text-sm">
                    Click &quot;New Course&quot; in the sidebar to create your
                    first course.
                  </p>
                </div>
              )}
            </div>
          )}

          {view.type === "course" && (
            <CourseView
              courseId={view.courseId}
              onNavigate={setView}
              onRefresh={refresh}
              key={view.courseId}
            />
          )}

          {view.type === "lesson" && (
            <LessonPage
              lessonId={view.lessonId}
              onNavigate={setView}
              onRefresh={refresh}
              key={view.lessonId}
            />
          )}

          {view.type === "tools" && (
            <ToolsPage onNavigate={setView} />
          )}

          {view.type === "source-finding" && (
            <SourceFindingList onNavigate={setView} />
          )}

          {view.type === "source-finding-new" && (
            <SourceFindingForm
              onNavigate={setView}
              lessonId={view.lessonId}
            />
          )}

          {view.type === "source-bank" && (
            <SourceBankResults
              sourceBankId={view.sourceBankId}
              onNavigate={setView}
            />
          )}
        </div>

        {view.type === "course" && (
          <>
            <button
              onClick={() => setChatOpen(!chatOpen)}
              className="fixed bottom-6 right-6 z-50 bg-primary text-white p-3 rounded-full shadow-lg hover:bg-primary-dark transition-colors"
              title={chatOpen ? "Close AI Chat" : "Open AI Chat"}
            >
              {chatOpen ? (
                <PanelRightClose size={20} />
              ) : (
                <PanelRightOpen size={20} />
              )}
            </button>

            {chatOpen && (
              <ChatPanel context={chatContext} onRefresh={refresh} />
            )}
          </>
        )}
      </main>
    </div>
  );
}
