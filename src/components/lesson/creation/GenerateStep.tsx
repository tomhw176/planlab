"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { ArrowLeft, Loader2, Check, RefreshCw, Send, Sparkles } from "lucide-react";
import { lastConfig, lastMode } from "./ConfigureStep";

interface LessonTemplate {
  id: string;
  name: string;
  promptTemplate: string;
  structure: {
    icon?: string;
    color?: string;
    sections: string[];
  };
  requiredFields: Array<{
    field: string;
    label: string;
    type: string;
  }>;
}

interface GeneratedLesson {
  hook: string;
  learningTarget: string;
  lessonPurpose: string;
  materialsNeeded: string;
  activities: Array<{ name: string; duration: string; description: string }>;
  closure: string;
  assessment: string;
  scaffolds: string;
  extension: string;
  notes: string;
  curriculumConnection: {
    bigIdea: string;
    competencyFocus: string;
    contentConnection: string;
  };
}

interface LessonSummary {
  title: string;
  approach: string;
  hookPreview: string;
  keyActivities: string[];
  assessmentStyle: string;
}

interface Props {
  template: LessonTemplate;
  title: string;
  unitId?: string;
  courseId?: string;
  courseGradeLevel?: string;
  onCreated: (lessonId: string) => void;
  onBack: () => void;
}

const EMPTY_LESSON: GeneratedLesson = {
  hook: "",
  learningTarget: "",
  lessonPurpose: "",
  materialsNeeded: "",
  activities: [],
  closure: "",
  assessment: "",
  scaffolds: "",
  extension: "",
  notes: "",
  curriculumConnection: { bigIdea: "", competencyFocus: "", contentConnection: "" },
};

export function GenerateStep({
  template,
  title,
  unitId,
  courseId,
  courseGradeLevel,
  onCreated,
  onBack,
}: Props) {
  const [streaming, setStreaming] = useState(false);
  const [mode] = useState<"auto" | "options">(lastMode);

  // Options mode state
  const [loadingSummaries, setLoadingSummaries] = useState(false);
  const [summaries, setSummaries] = useState<LessonSummary[]>([]);
  const [selectedSummary, setSelectedSummary] = useState<LessonSummary | null>(null);

  // Shared state
  const [selected, setSelected] = useState<GeneratedLesson | null>(null);
  const [streamingLesson, setStreamingLesson] = useState<Partial<GeneratedLesson>>(EMPTY_LESSON);
  const [fieldsReady, setFieldsReady] = useState(0);
  const [iterationInput, setIterationInput] = useState("");
  const [iterating, setIterating] = useState(false);
  const [creating, setCreating] = useState(false);
  const [iterationHistory, setIterationHistory] = useState<Array<{ role: string; content: string }>>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const hasFetched = useRef(false);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [iterationHistory]);

  // Read SSE stream and update lesson progressively
  const readStream = useCallback(async (res: Response) => {
    if (!res.body) throw new Error("No response body");

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        const dataLine = line.trim();
        if (!dataLine.startsWith("data: ")) continue;
        const data = dataLine.slice(6);
        if (data === "[DONE]") { setStreaming(false); continue; }

        try {
          const parsed = JSON.parse(data);

          if (parsed.type === "partial" && parsed.lesson) {
            setStreamingLesson((prev) => {
              const merged = { ...prev };
              const l = parsed.lesson;
              if (l.hook) merged.hook = l.hook;
              if (l.learningTarget) merged.learningTarget = l.learningTarget;
              if (l.lessonPurpose) merged.lessonPurpose = l.lessonPurpose;
              if (l.materialsNeeded) merged.materialsNeeded = l.materialsNeeded;
              if (l.closure) merged.closure = l.closure;
              if (l.assessment) merged.assessment = l.assessment;
              if (l.scaffolds) merged.scaffolds = l.scaffolds;
              if (l.extension) merged.extension = l.extension;
              if (l.notes) merged.notes = l.notes;
              if (l.activities?.length) merged.activities = l.activities;
              if (l.curriculumConnection) merged.curriculumConnection = l.curriculumConnection;
              let count = 0;
              for (const k of ["hook", "learningTarget", "lessonPurpose", "materialsNeeded", "closure", "assessment", "scaffolds", "extension"]) {
                if ((merged as Record<string, unknown>)[k]) count++;
              }
              if (merged.activities?.length) count++;
              if (merged.curriculumConnection?.bigIdea) count++;
              setFieldsReady(count);
              return merged;
            });
          }

          if (parsed.type === "complete" && parsed.lesson) {
            setSelected(parsed.lesson);
            setStreamingLesson(parsed.lesson);
            setFieldsReady(10);
            setStreaming(false);
          }

          if (parsed.type === "error") {
            console.error("Stream error:", parsed.error);
            setStreaming(false);
          }
        } catch { /* skip */ }
      }
    }
  }, []);

  // AUTO mode — generate full lesson with streaming
  const generateAuto = useCallback(async () => {
    setStreaming(true);
    setStreamingLesson(EMPTY_LESSON);
    setFieldsReady(0);
    setSelected(null);

    try {
      const res = await fetch("/api/lessons/generate-from-template", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateId: template.id,
          config: lastConfig,
          mode: "auto",
          title,
          unitId,
          courseId,
          courseGradeLevel,
        }),
      });
      if (!res.ok) throw new Error("Failed to generate");
      await readStream(res);
    } catch (err) {
      console.error("Generation failed:", err);
      setStreaming(false);
    }
  }, [template.id, title, unitId, courseId, courseGradeLevel, readStream]);

  // OPTIONS mode — fetch lightweight summaries
  const fetchSummaries = useCallback(async () => {
    setLoadingSummaries(true);
    setSummaries([]);
    setSelectedSummary(null);
    setSelected(null);

    try {
      const res = await fetch("/api/lessons/generate-from-template", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateId: template.id,
          config: lastConfig,
          mode: "options",
          title,
          unitId,
          courseId,
          courseGradeLevel,
        }),
      });
      if (!res.ok) throw new Error("Failed to generate");
      const data = await res.json();
      setSummaries(data.summaries || []);
    } catch (err) {
      console.error("Summaries failed:", err);
    } finally {
      setLoadingSummaries(false);
    }
  }, [template.id, title, unitId, courseId, courseGradeLevel]);

  // BUILD mode — take a selected summary and build the full lesson (streaming)
  const buildFromSummary = useCallback(async (summary: LessonSummary) => {
    setSelectedSummary(summary);
    setStreaming(true);
    setStreamingLesson(EMPTY_LESSON);
    setFieldsReady(0);
    setSelected(null);

    try {
      const res = await fetch("/api/lessons/generate-from-template", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateId: template.id,
          config: lastConfig,
          mode: "build",
          title,
          unitId,
          courseId,
          courseGradeLevel,
          summary,
        }),
      });
      if (!res.ok) throw new Error("Failed to build");
      await readStream(res);
    } catch (err) {
      console.error("Build failed:", err);
      setStreaming(false);
    }
  }, [template.id, title, unitId, courseId, courseGradeLevel, readStream]);

  // Generate on mount
  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;
    if (mode === "auto") {
      generateAuto();
    } else {
      fetchSummaries();
    }
  }, [mode, generateAuto, fetchSummaries]);

  const handleIterate = async () => {
    if (!iterationInput.trim() || !selected) return;
    const userMsg = iterationInput.trim();
    setIterationInput("");
    setIterating(true);
    setIterationHistory((prev) => [...prev, { role: "user", content: userMsg }]);

    try {
      const res = await fetch("/api/lessons/generate-from-template", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateId: template.id,
          config: lastConfig,
          mode: "iterate",
          title,
          unitId,
          courseId,
          courseGradeLevel,
          currentLesson: selected,
          feedback: userMsg,
        }),
      });
      if (!res.ok) throw new Error("Failed to iterate");
      const data = await res.json();
      setSelected(data.lesson);
      setStreamingLesson(data.lesson);
      setIterationHistory((prev) => [
        ...prev,
        { role: "assistant", content: "Updated the lesson based on your feedback." },
      ]);
    } catch {
      setIterationHistory((prev) => [
        ...prev,
        { role: "assistant", content: "Sorry, something went wrong. Try again." },
      ]);
    } finally {
      setIterating(false);
    }
  };

  const handleAccept = async () => {
    const lessonToSave = selected || (streamingLesson as GeneratedLesson);
    if (!lessonToSave?.hook && !lessonToSave?.learningTarget) return;
    setCreating(true);

    try {
      const res = await fetch("/api/lessons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title || `${template.name} Lesson`,
          unitId: unitId || null,
          templateId: template.id,
          creationMode: "template",
          duration: parseInt(lastConfig.duration) || 60,
          hook: lessonToSave.hook,
          learningTarget: lessonToSave.learningTarget,
          lessonPurpose: lessonToSave.lessonPurpose,
          materialsNeeded: lessonToSave.materialsNeeded,
          activities: lessonToSave.activities,
          closure: lessonToSave.closure,
          assessment: lessonToSave.assessment,
          scaffolds: lessonToSave.scaffolds,
          extension: lessonToSave.extension,
          notes: lessonToSave.notes || "",
          curriculumConnection: lessonToSave.curriculumConnection,
          status: "draft",
        }),
      });
      if (res.ok) {
        const lesson = await res.json();
        onCreated(lesson.id);
      }
    } catch (err) {
      console.error("Failed to create lesson:", err);
    } finally {
      setCreating(false);
    }
  };

  const handleRegenerate = () => {
    hasFetched.current = false;
    setIterationHistory([]);
    if (mode === "auto") {
      generateAuto();
    } else if (selectedSummary) {
      buildFromSummary(selectedSummary);
    } else {
      fetchSummaries();
    }
  };

  // ── OPTIONS: Loading summaries ──
  if (mode === "options" && loadingSummaries) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <Loader2 size={32} className="animate-spin text-primary" />
        <p className="text-sm text-muted">Generating 3 approaches for you...</p>
        <p className="text-xs text-muted">This should only take a few seconds</p>
      </div>
    );
  }

  // ── OPTIONS: Show summaries for selection ──
  if (mode === "options" && !selectedSummary && summaries.length > 0) {
    return (
      <div className="space-y-4">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm text-muted hover:text-primary transition-colors"
        >
          <ArrowLeft size={14} />
          Back to configure
        </button>

        <p className="text-sm text-muted">
          Here are 3 different approaches. Pick the one you like and we&apos;ll build the full lesson.
        </p>

        <div className="space-y-3">
          {summaries.map((summary, i) => {
            const colors = ["#6366f1", "#f59e0b", "#10b981"];
            const color = colors[i % colors.length];

            return (
              <button
                key={i}
                onClick={() => buildFromSummary(summary)}
                className="w-full text-left p-5 rounded-xl border-2 border-border hover:shadow-md transition-all group"
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = color + "80";
                  e.currentTarget.style.backgroundColor = color + "08";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "";
                  e.currentTarget.style.backgroundColor = "";
                }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className="text-xs font-bold px-2.5 py-0.5 rounded-full text-white"
                    style={{ backgroundColor: color }}
                  >
                    Option {i + 1}
                  </span>
                  <h4 className="font-bold text-sm">{summary.title}</h4>
                </div>

                <p className="text-sm text-muted mb-3">{summary.approach}</p>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-muted font-semibold">Hook Preview</span>
                    <p className="mt-0.5">{summary.hookPreview}</p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-muted font-semibold">Assessment</span>
                    <p className="mt-0.5">{summary.assessmentStyle}</p>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-1.5">
                  {summary.keyActivities?.map((a, j) => (
                    <span
                      key={j}
                      className="text-[10px] px-2 py-0.5 rounded-full border"
                      style={{ borderColor: color + "40", color }}
                    >
                      {a}
                    </span>
                  ))}
                </div>

                <div className="mt-3 flex items-center gap-1.5 text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity" style={{ color }}>
                  <Sparkles size={12} />
                  Click to build this lesson
                </div>
              </button>
            );
          })}
        </div>

        <button
          onClick={() => { hasFetched.current = false; fetchSummaries(); }}
          className="w-full flex items-center justify-center gap-2 py-2.5 border border-border rounded-xl text-sm text-muted hover:text-primary hover:border-primary/50 transition-colors"
        >
          <RefreshCw size={14} />
          Regenerate Options
        </button>
      </div>
    );
  }

  // ── Streaming preview (auto mode OR building from summary) ──
  const showStreamingPreview = streaming || selected || fieldsReady > 0;
  const previewLesson = selected || (streamingLesson as GeneratedLesson);

  if (showStreamingPreview) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <button
            onClick={() => {
              if (mode === "options" && selectedSummary) {
                setSelectedSummary(null);
                setSelected(null);
                setStreamingLesson(EMPTY_LESSON);
                setFieldsReady(0);
              } else {
                onBack();
              }
            }}
            className="flex items-center gap-1.5 text-sm text-muted hover:text-primary transition-colors"
          >
            <ArrowLeft size={14} />
            {mode === "options" && selectedSummary ? "Back to options" : "Back to configure"}
          </button>

          <div className="flex items-center gap-2">
            {streaming && (
              <div className="flex items-center gap-1.5 text-xs text-primary">
                <Loader2 size={12} className="animate-spin" />
                <span>Building lesson... {fieldsReady}/10</span>
              </div>
            )}
            <button
              onClick={handleRegenerate}
              disabled={iterating || streaming}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-border rounded-lg hover:border-primary/50 text-muted hover:text-primary transition-colors disabled:opacity-40"
            >
              <RefreshCw size={12} />
              Regenerate
            </button>
            <button
              onClick={handleAccept}
              disabled={creating || streaming}
              className="flex items-center gap-1.5 px-4 py-1.5 text-sm font-semibold bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50"
            >
              {creating ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Check size={14} />
              )}
              Accept & Create Lesson
            </button>
          </div>
        </div>

        {/* Progress bar */}
        {streaming && (
          <div className="w-full bg-border rounded-full h-1.5 overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
              style={{ width: `${(fieldsReady / 10) * 100}%` }}
            />
          </div>
        )}

        {/* Lesson Preview Cards */}
        <div className="space-y-4 max-h-[40vh] overflow-y-auto pr-1">
          {/* Intent */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2.5 h-0.5 bg-primary rounded-full" />
              Intent
            </h4>
            <div className="grid grid-cols-2 gap-2">
              <PreviewCard label="Learning Target" content={previewLesson.learningTarget} streaming={streaming && !previewLesson.learningTarget} />
              <PreviewCard label="Lesson Purpose" content={previewLesson.lessonPurpose} streaming={streaming && !previewLesson.lessonPurpose} />
              <PreviewCard label="Curriculum Connection" content={
                previewLesson.curriculumConnection?.bigIdea
                  ? `Big Idea: ${previewLesson.curriculumConnection.bigIdea}\nCompetency: ${previewLesson.curriculumConnection.competencyFocus || "..."}\nContent: ${previewLesson.curriculumConnection.contentConnection || "..."}`
                  : ""
              } streaming={streaming && !previewLesson.curriculumConnection?.bigIdea} />
              <PreviewCard label="Materials" content={previewLesson.materialsNeeded} streaming={streaming && !previewLesson.materialsNeeded} />
            </div>
          </div>

          {/* Flow */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-amber-600 uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2.5 h-0.5 bg-amber-500 rounded-full" />
              Flow
            </h4>
            <PreviewCard label="Hook / Opener" content={previewLesson.hook} streaming={streaming && !previewLesson.hook} />
            {(previewLesson.activities?.length > 0) ? (
              <div className="bg-surface rounded-lg border border-border p-3">
                <span className="text-[10px] uppercase tracking-wider text-muted font-semibold">Lesson Sequence</span>
                <div className="mt-1.5 space-y-1.5">
                  {previewLesson.activities.map((a, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm">
                      <span className="text-xs text-amber-600 font-mono shrink-0 mt-0.5">{a.duration}m</span>
                      <div>
                        <span className="font-medium">{a.name}</span>
                        <p className="text-xs text-muted">{a.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : streaming ? (
              <StreamingPlaceholder label="Lesson Sequence" />
            ) : null}
            <PreviewCard label="Closure" content={previewLesson.closure} streaming={streaming && !previewLesson.closure} />
          </div>

          {/* Support */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-emerald-600 uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2.5 h-0.5 bg-emerald-500 rounded-full" />
              Support
            </h4>
            <div className="grid grid-cols-2 gap-2">
              <PreviewCard label="Assessment" content={previewLesson.assessment} streaming={streaming && !previewLesson.assessment} />
              <PreviewCard label="Scaffolds" content={previewLesson.scaffolds} streaming={streaming && !previewLesson.scaffolds} />
              <PreviewCard label="Extension" content={previewLesson.extension} className="col-span-2" streaming={streaming && !previewLesson.extension} />
            </div>
          </div>
        </div>

        {/* Iteration Chat — only show when not streaming */}
        {!streaming && (
          <div className="border-t border-border pt-3 space-y-2">
            {iterationHistory.length > 0 && (
              <div className="max-h-32 overflow-y-auto space-y-2 mb-2">
                {iterationHistory.map((msg, i) => (
                  <div key={i} className={`text-xs px-3 py-2 rounded-lg ${msg.role === "user" ? "bg-primary/10 text-primary ml-8" : "bg-surface border border-border mr-8"}`}>
                    {msg.content}
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>
            )}
            <div className="flex gap-2">
              <input
                type="text"
                value={iterationInput}
                onChange={(e) => setIterationInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleIterate(); } }}
                placeholder="Ask for changes... (e.g. 'Make the hook more engaging' or 'Add a group activity')"
                className="flex-1 px-3 py-2.5 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 bg-background"
                disabled={iterating}
              />
              <button
                onClick={handleIterate}
                disabled={iterating || !iterationInput.trim()}
                className="px-3 py-2.5 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-40"
              >
                {iterating ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              </button>
            </div>
            <p className="text-[10px] text-muted text-center">
              Iterate on the lesson before creating it. Changes will be reflected in the preview above.
            </p>
          </div>
        )}
      </div>
    );
  }

  // Fallback
  return (
    <div className="text-center py-8">
      <p className="text-muted text-sm">Something went wrong.</p>
      <button onClick={onBack} className="text-primary text-sm mt-2 hover:underline">Go back</button>
    </div>
  );
}

function PreviewCard({ label, content, className = "", streaming = false }: { label: string; content: string; className?: string; streaming?: boolean }) {
  if (streaming && !content) return <StreamingPlaceholder label={label} className={className} />;
  return (
    <div className={`bg-surface rounded-lg border border-border p-3 transition-all ${content ? "opacity-100" : "opacity-50"} ${className}`}>
      <span className="text-[10px] uppercase tracking-wider text-muted font-semibold">{label}</span>
      <p className="text-sm mt-0.5 whitespace-pre-wrap line-clamp-4">{content || "—"}</p>
    </div>
  );
}

function StreamingPlaceholder({ label, className = "" }: { label: string; className?: string }) {
  return (
    <div className={`bg-surface rounded-lg border border-border p-3 opacity-50 ${className}`}>
      <span className="text-[10px] uppercase tracking-wider text-muted font-semibold">{label}</span>
      <div className="mt-1.5 space-y-1.5">
        <div className="h-3 bg-border/50 rounded animate-pulse w-3/4" />
        <div className="h-3 bg-border/50 rounded animate-pulse w-1/2" />
      </div>
    </div>
  );
}
