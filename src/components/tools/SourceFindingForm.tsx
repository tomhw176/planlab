"use client";

import { useState, useEffect } from "react";
import type { ViewState } from "@/app/page";
import { ArrowLeft, Sparkles, Loader2, X, Plus, Link2 } from "lucide-react";

interface SourceFindingFormProps {
  onNavigate: (view: ViewState) => void;
  lessonId?: string;
}

const DEFAULT_PERSPECTIVES = [
  "Government / elite perspective",
  "Ordinary people perspective",
  "Outsider perspective",
  "Retrospective historian perspective",
  "Visual or statistical evidence",
  "Counterevidence or complication",
];

export function SourceFindingForm({ onNavigate, lessonId }: SourceFindingFormProps) {
  const [topic, setTopic] = useState("");
  const [grade, setGrade] = useState("");
  const [inquiryQuestion, setInquiryQuestion] = useState("");
  const [perspectives, setPerspectives] = useState<string[]>([...DEFAULT_PERSPECTIVES]);
  const [newPerspective, setNewPerspective] = useState("");
  const [historicalThinkingSkills, setHistoricalThinkingSkills] = useState("");
  const [numSources, setNumSources] = useState(7);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [generatingQuestions, setGeneratingQuestions] = useState(false);
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([]);
  const [linkedLesson, setLinkedLesson] = useState<{ id: string; title: string } | null>(null);

  // Pre-fill from linked lesson
  useEffect(() => {
    if (!lessonId) return;
    fetch(`/api/lessons/${lessonId}`)
      .then((r) => r.json())
      .then((data) => {
        setLinkedLesson({ id: data.id, title: data.title });
        if (data.title && !topic) setTopic(data.title);
      })
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lessonId]);

  const generateQuestions = async () => {
    if (!topic.trim()) return;
    setGeneratingQuestions(true);
    setSuggestedQuestions([]);
    try {
      const res = await fetch("/api/source-banks/generate-questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, grade }),
      });
      const data = await res.json();
      setSuggestedQuestions(data.questions || []);
    } catch {
      // ignore
    }
    setGeneratingQuestions(false);
  };

  const removePerspective = (index: number) => {
    setPerspectives((prev) => prev.filter((_, i) => i !== index));
  };

  const addPerspective = () => {
    if (newPerspective.trim() && !perspectives.includes(newPerspective.trim())) {
      setPerspectives((prev) => [...prev, newPerspective.trim()]);
      setNewPerspective("");
    }
  };

  const handleSubmit = async () => {
    if (!topic.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/source-banks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: topic.trim(),
          grade,
          inquiryQuestion: inquiryQuestion.trim(),
          perspectives,
          historicalThinkingSkills: historicalThinkingSkills.trim(),
          numSourcesRequested: numSources,
          notes: notes.trim(),
          lessonId: lessonId || null,
        }),
      });
      const data = await res.json();

      // Trigger generation
      fetch(`/api/source-banks/${data.id}/generate`, { method: "POST" });

      // Navigate to results
      onNavigate({ type: "source-bank", sourceBankId: data.id });
    } catch {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => onNavigate({ type: "source-finding" })}
          className="p-1.5 rounded-lg hover:bg-surface-hover text-muted hover:text-foreground transition-colors"
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-2xl font-bold">New Source Search</h1>
          <p className="text-sm text-muted">Fill in what you can — the AI will make reasonable assumptions for anything left blank.</p>
          {linkedLesson && (
            <div className="mt-2 flex items-center gap-1.5 text-xs text-primary bg-primary/10 px-2.5 py-1 rounded-full w-fit">
              <Link2 size={10} />
              Linked to: {linkedLesson.title}
            </div>
          )}
        </div>
      </div>

      <div className="space-y-6">
        {/* Topic */}
        <div>
          <label className="block text-sm font-semibold mb-1.5">
            Topic <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g. Causes of the French Revolution, Residential Schools in Canada"
            className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 bg-surface text-sm"
          />
        </div>

        {/* Grade */}
        <div>
          <label className="block text-sm font-semibold mb-1.5">Grade</label>
          <select
            value={grade}
            onChange={(e) => setGrade(e.target.value)}
            className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 bg-surface text-sm"
          >
            <option value="">Select grade (optional)</option>
            {["6", "7", "8", "9", "10", "11", "12"].map((g) => (
              <option key={g} value={g}>Grade {g}</option>
            ))}
          </select>
        </div>

        {/* Inquiry Question */}
        <div>
          <label className="block text-sm font-semibold mb-1.5">Inquiry Question</label>
          <div className="relative">
            <textarea
              value={inquiryQuestion}
              onChange={(e) => setInquiryQuestion(e.target.value)}
              placeholder="e.g. To what extent was the French Revolution inevitable?"
              rows={2}
              className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 bg-surface text-sm resize-none"
            />
          </div>
          <button
            onClick={generateQuestions}
            disabled={!topic.trim() || generatingQuestions}
            className="mt-2 flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary-dark disabled:text-muted disabled:cursor-not-allowed transition-colors"
          >
            {generatingQuestions ? (
              <Loader2 size={12} className="animate-spin" />
            ) : (
              <Sparkles size={12} />
            )}
            Generate ideas for me based on the topic
          </button>

          {suggestedQuestions.length > 0 && (
            <div className="mt-3 space-y-1.5">
              <p className="text-xs font-medium text-muted">Suggested questions — click to use:</p>
              {suggestedQuestions.map((q, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setInquiryQuestion(q);
                    setSuggestedQuestions([]);
                  }}
                  className="w-full text-left text-sm px-3 py-2 rounded-lg border border-border hover:border-primary/40 hover:bg-primary/5 transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Perspective Requirements */}
        <div>
          <label className="block text-sm font-semibold mb-1.5">Perspective Requirements</label>
          <p className="text-xs text-muted mb-3">Sources should represent a diversity of perspectives. Edit as needed.</p>
          <div className="flex flex-wrap gap-2 mb-3">
            {perspectives.map((p, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-surface-hover rounded-full text-sm border border-border"
              >
                {p}
                <button
                  onClick={() => removePerspective(i)}
                  className="text-muted hover:text-red-500 transition-colors"
                >
                  <X size={12} />
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={newPerspective}
              onChange={(e) => setNewPerspective(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addPerspective()}
              placeholder="Add a perspective..."
              className="flex-1 px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 bg-surface"
            />
            <button
              onClick={addPerspective}
              disabled={!newPerspective.trim()}
              className="px-3 py-2 text-sm font-medium text-primary hover:bg-primary/10 rounded-lg transition-colors disabled:text-muted disabled:cursor-not-allowed"
            >
              <Plus size={16} />
            </button>
          </div>
        </div>

        {/* Historical Thinking Skills */}
        <div>
          <label className="block text-sm font-semibold mb-1.5">
            Historical / Critical Thinking Skill Focus
          </label>
          <input
            type="text"
            value={historicalThinkingSkills}
            onChange={(e) => setHistoricalThinkingSkills(e.target.value)}
            placeholder="e.g. Cause and consequence, perspective, ethical judgment (optional)"
            className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 bg-surface text-sm"
          />
        </div>

        {/* Number of Sources */}
        <div>
          <label className="block text-sm font-semibold mb-1.5">
            Number of Sources in Final Set
          </label>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min={3}
              max={10}
              value={numSources}
              onChange={(e) => setNumSources(Number(e.target.value))}
              className="flex-1"
            />
            <span className="text-sm font-medium w-8 text-center">{numSources}</span>
          </div>
          <p className="text-xs text-muted mt-1">The AI will find 15–20 candidates and recommend the best {numSources}.</p>
        </div>

        {/* Additional Notes */}
        <div>
          <label className="block text-sm font-semibold mb-1.5">Anything Else to Note?</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Focus on Canadian perspectives, avoid sources longer than 1 page, students have low reading levels..."
            rows={3}
            className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 bg-surface text-sm resize-none"
          />
        </div>

        {/* Submit */}
        <div className="pt-4 border-t border-border">
          <button
            onClick={handleSubmit}
            disabled={!topic.trim() || submitting}
            className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-primary text-white rounded-xl hover:bg-primary-dark transition-colors font-semibold text-base disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Creating Source Search...
              </>
            ) : (
              <>
                <Sparkles size={18} />
                Find Sources
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
