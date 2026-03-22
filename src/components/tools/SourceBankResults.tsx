"use client";

import { useEffect, useState, useCallback } from "react";
import type { ViewState } from "@/app/page";
import {
  ArrowLeft, Loader2, CheckCircle2, AlertTriangle, Star, ExternalLink,
  ChevronDown, ChevronRight, Link2, Shield, ShieldAlert, ShieldCheck,
  LinkIcon, Unlink, Search,
} from "lucide-react";

interface CandidateSource {
  id: string;
  title: string;
  summary: string;
  sourceType: string;
  perspectiveRole: string;
  bibliographicInfo: string;
  link: string;
  creator: string;
  dateCreated: string;
  significance: string;
  claimsEvidence: string;
  historicalThinkingMove: string;
  lengthDescription: string;
  excerptOptions: string;
  vocabularyBarriers: string;
  relevanceScore: number;
  readabilityScore: number;
  excerptabilityScore: number;
  historicalThinkingScore: number;
  uniquenessScore: number;
  overallScore: number;
  confidenceLevel: string;
  isRecommended: boolean;
  sequenceOrder: number | null;
  flags: string;
}

interface SourceBankData {
  id: string;
  topic: string;
  grade: string;
  inquiryQuestion: string;
  perspectives: string[];
  historicalThinkingSkills: string;
  numSourcesRequested: number;
  notes: string;
  status: string;
  recommendedSequence: string[];
  lessonId: string | null;
  lesson?: { id: string; title: string } | null;
  sources: CandidateSource[];
}

interface SourceBankResultsProps {
  sourceBankId: string;
  onNavigate: (view: ViewState) => void;
}

const confidenceIcon: Record<string, typeof ShieldCheck> = {
  high: ShieldCheck,
  medium: Shield,
  low: ShieldAlert,
};

const confidenceColor: Record<string, string> = {
  high: "text-green-600",
  medium: "text-amber-500",
  low: "text-red-500",
};

function ScoreBar({ score, label }: { score: number; label: string }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-24 text-muted">{label}</span>
      <div className="flex-1 bg-border/50 rounded-full h-1.5">
        <div
          className="h-1.5 rounded-full bg-primary transition-all"
          style={{ width: `${(score / 5) * 100}%` }}
        />
      </div>
      <span className="w-4 text-right font-medium">{score}</span>
    </div>
  );
}

function SourceCard({ source, index }: { source: CandidateSource; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const ConfIcon = confidenceIcon[source.confidenceLevel] || Shield;
  const confColor = confidenceColor[source.confidenceLevel] || "text-muted";

  return (
    <div className={`border rounded-xl transition-all ${source.isRecommended ? "border-primary/40 bg-primary/[0.02]" : "border-border"}`}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left p-4"
      >
        <div className="flex items-start gap-3">
          <div className="flex items-center gap-2 shrink-0">
            <span className="w-7 h-7 rounded-lg bg-surface-hover flex items-center justify-center text-xs font-bold text-muted">
              {source.sequenceOrder ?? index + 1}
            </span>
            {source.isRecommended && (
              <Star size={14} className="text-amber-500 fill-amber-500" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h4 className="font-semibold text-sm truncate">{source.title}</h4>
              <span className="text-[10px] uppercase tracking-wider font-medium px-2 py-0.5 rounded-full bg-surface-hover text-muted shrink-0">
                {source.sourceType}
              </span>
            </div>
            <p className="text-xs text-muted mt-1 truncate">{source.creator} · {source.dateCreated}</p>
            {source.flags && (
              <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                <AlertTriangle size={10} />
                {source.flags}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <ConfIcon size={14} className={confColor} />
            <span className="text-sm font-bold text-foreground">
              {source.overallScore.toFixed(1)}
            </span>
            {expanded ? <ChevronDown size={14} className="text-muted" /> : <ChevronRight size={14} className="text-muted" />}
          </div>
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 border-t border-border/50 pt-3 space-y-4">
          <div>
            <p className="text-sm leading-relaxed">{source.summary}</p>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <h5 className="font-semibold text-xs text-muted uppercase mb-1">Perspective Role</h5>
              <p className="text-sm">{source.perspectiveRole}</p>
            </div>
            <div>
              <h5 className="font-semibold text-xs text-muted uppercase mb-1">Historical Thinking</h5>
              <p className="text-sm">{source.historicalThinkingMove}</p>
            </div>
          </div>

          <div>
            <h5 className="font-semibold text-xs text-muted uppercase mb-1">Why It Matters</h5>
            <p className="text-sm">{source.significance}</p>
          </div>

          <div>
            <h5 className="font-semibold text-xs text-muted uppercase mb-1">Claims / Evidence Students Could Pull</h5>
            <p className="text-sm">{source.claimsEvidence}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <h5 className="font-semibold text-xs text-muted uppercase mb-1">Length & Excerpting</h5>
              <p className="text-sm">{source.lengthDescription}</p>
              {source.excerptOptions && <p className="text-xs text-muted mt-1">{source.excerptOptions}</p>}
            </div>
            <div>
              <h5 className="font-semibold text-xs text-muted uppercase mb-1">Vocabulary Barriers</h5>
              <p className="text-sm">{source.vocabularyBarriers || "None significant"}</p>
            </div>
          </div>

          <div>
            <h5 className="font-semibold text-xs text-muted uppercase mb-2">Scores (out of 5)</h5>
            <div className="space-y-1.5">
              <ScoreBar score={source.relevanceScore} label="Relevance" />
              <ScoreBar score={source.readabilityScore} label="Readability" />
              <ScoreBar score={source.excerptabilityScore} label="Excerptability" />
              <ScoreBar score={source.historicalThinkingScore} label="Hist. Thinking" />
              <ScoreBar score={source.uniquenessScore} label="Uniqueness" />
            </div>
          </div>

          <div>
            <h5 className="font-semibold text-xs text-muted uppercase mb-1">Bibliographic Info</h5>
            <p className="text-sm">{source.bibliographicInfo}</p>
          </div>

          {source.link && (
            <a
              href={source.link}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
            >
              <ExternalLink size={12} />
              View Source
            </a>
          )}
        </div>
      )}
    </div>
  );
}

interface LessonOption {
  id: string;
  title: string;
  status: string;
  unit?: { id: string; title: string } | null;
}

function LinkToLessonButton({
  currentLesson,
  sourceBankId,
  onLinked,
}: {
  currentLesson: { id: string; title: string } | null | undefined;
  sourceBankId: string;
  onLinked: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [lessons, setLessons] = useState<LessonOption[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    fetch(`/api/lessons?q=${encodeURIComponent(query)}`)
      .then((r) => r.json())
      .then((data) => {
        setLessons(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [open, query]);

  const linkLesson = async (lessonId: string | null) => {
    await fetch(`/api/source-banks/${sourceBankId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lessonId }),
    });
    setOpen(false);
    onLinked();
  };

  if (currentLesson) {
    return (
      <div className="flex items-center gap-2">
        <button
          onClick={() => linkLesson(null)}
          className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 transition-colors"
          title="Unlink from lesson"
        >
          <Unlink size={12} />
          Unlink
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80 transition-colors px-2 py-1 rounded-lg hover:bg-primary/5"
      >
        <LinkIcon size={12} />
        Link to Lesson
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 w-72 bg-white border border-border rounded-xl shadow-lg z-50 overflow-hidden">
          <div className="p-2 border-b border-border">
            <div className="flex items-center gap-2 px-2 py-1.5 bg-surface-hover rounded-lg">
              <Search size={12} className="text-muted" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search lessons..."
                className="bg-transparent text-sm flex-1 outline-none"
                autoFocus
              />
            </div>
          </div>
          <div className="max-h-48 overflow-y-auto p-1">
            {loading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 size={14} className="animate-spin text-muted" />
              </div>
            ) : lessons.length === 0 ? (
              <p className="text-xs text-muted text-center py-4">No lessons found</p>
            ) : (
              lessons.map((lesson) => (
                <button
                  key={lesson.id}
                  onClick={() => linkLesson(lesson.id)}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-surface-hover rounded-lg transition-colors"
                >
                  <span className="font-medium">{lesson.title}</span>
                  {lesson.unit && (
                    <span className="text-xs text-muted ml-2">{lesson.unit.title}</span>
                  )}
                </button>
              ))
            )}
          </div>
          <div className="p-2 border-t border-border">
            <button
              onClick={() => setOpen(false)}
              className="w-full text-xs text-muted hover:text-foreground py-1"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function SourceBankResults({ sourceBankId, onNavigate }: SourceBankResultsProps) {
  const [data, setData] = useState<SourceBankData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);

  const fetchData = useCallback(() => {
    fetch(`/api/source-banks/${sourceBankId}`)
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [sourceBankId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Poll while generating
  useEffect(() => {
    if (!data || data.status !== "generating") return;
    const interval = setInterval(fetchData, 3000);
    return () => clearInterval(interval);
  }, [data, fetchData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="animate-spin text-muted" size={24} />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-8 text-center text-muted">
        Source bank not found.
      </div>
    );
  }

  const recommended = data.sources
    .filter((s) => s.isRecommended)
    .sort((a, b) => (a.sequenceOrder ?? 99) - (b.sequenceOrder ?? 99));
  const others = data.sources.filter((s) => !s.isRecommended);

  return (
    <div className="p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-start gap-3 mb-6">
        <button
          onClick={() => onNavigate({ type: "source-finding" })}
          className="p-1.5 rounded-lg hover:bg-surface-hover text-muted hover:text-foreground transition-colors mt-1"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{data.topic}</h1>
          {data.inquiryQuestion && (
            <p className="text-sm text-muted italic mt-1">&quot;{data.inquiryQuestion}&quot;</p>
          )}
          <div className="flex items-center gap-3 mt-2 text-xs text-muted">
            {data.grade && <span>Grade {data.grade}</span>}
            <span>{data.sources.length} sources found</span>
            <span>{recommended.length} recommended</span>
            {data.lesson && (
              <button
                onClick={() => onNavigate({ type: "lesson", lessonId: data.lesson!.id })}
                className="flex items-center gap-1 bg-primary/10 text-primary px-2 py-0.5 rounded-full hover:bg-primary/20 transition-colors"
              >
                <Link2 size={10} />
                {data.lesson.title}
              </button>
            )}
            <LinkToLessonButton
              currentLesson={data.lesson}
              sourceBankId={data.id}
              onLinked={fetchData}
            />
          </div>
        </div>
      </div>

      {/* Generating state */}
      {data.status === "generating" && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 mb-6">
          <Loader2 size={18} className="animate-spin" />
          <div>
            <p className="font-medium text-sm">Finding and curating sources...</p>
            <p className="text-xs mt-0.5">This may take 1–2 minutes. Sources will appear as they&apos;re found.</p>
          </div>
        </div>
      )}

      {data.status === "completed" && recommended.length > 0 && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-green-50 border border-green-200 text-green-800 mb-6 text-sm">
          <CheckCircle2 size={16} />
          <span className="font-medium">Source curation complete.</span>
          <span>Always verify sources and links before using in class.</span>
        </div>
      )}

      {/* Recommended Sources */}
      {recommended.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-bold mb-1 flex items-center gap-2">
            <Star size={16} className="text-amber-500 fill-amber-500" />
            Recommended Sources ({recommended.length})
          </h2>
          <p className="text-xs text-muted mb-4">These sources are recommended for your final source set, in suggested sequence order.</p>
          <div className="space-y-2">
            {recommended.map((source, i) => (
              <SourceCard key={source.id} source={source} index={i} />
            ))}
          </div>
        </div>
      )}

      {/* Other Candidates */}
      {others.length > 0 && (
        <div>
          <button
            onClick={() => setShowAll(!showAll)}
            className="flex items-center gap-2 text-sm font-semibold text-muted hover:text-foreground transition-colors mb-3"
          >
            {showAll ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            Other Candidates ({others.length})
          </button>
          {showAll && (
            <div className="space-y-2">
              {others.map((source, i) => (
                <SourceCard key={source.id} source={source} index={recommended.length + i} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
