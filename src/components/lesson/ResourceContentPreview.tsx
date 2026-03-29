"use client";

import { useState, useEffect } from "react";
import { ChevronDown, ChevronUp, AlertTriangle, BookOpen, GraduationCap } from "lucide-react";

interface ResourceData {
  id: string;
  title: string;
  type: string;
  content: Record<string, unknown>;
}

interface Props {
  resourceId: string;
  resourceType: string;
  expanded?: boolean;
}

export function ResourceContentPreview({ resourceId, resourceType, expanded: defaultExpanded = false }: Props) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [resource, setResource] = useState<ResourceData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (expanded && !resource) {
      setLoading(true);
      fetch(`/api/resources/${resourceId}`)
        .then((r) => r.json())
        .then((data) => setResource(data))
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [expanded, resourceId, resource]);

  if (!["student_workbook", "teacher_guide", "reading", "worksheet", "assessment", "lesson_plan"].includes(resourceType)) {
    return null;
  }

  return (
    <div className="mt-1">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1 text-[11px] text-muted hover:text-primary transition-colors"
      >
        {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        {expanded ? "Hide preview" : "Preview"}
      </button>

      {expanded && (
        <div className="mt-2 border border-border rounded-lg bg-white overflow-hidden">
          {loading && (
            <div className="p-4 text-sm text-muted animate-pulse">Loading preview...</div>
          )}
          {resource && resource.content && (
            <div className="max-h-[500px] overflow-y-auto">
              {resourceType === "student_workbook" && (
                <StudentWorkbookPreview content={resource.content} />
              )}
              {resourceType === "teacher_guide" && (
                <TeacherGuidePreview content={resource.content} />
              )}
              {resourceType === "reading" && (
                <ReadingPreview content={resource.content} />
              )}
              {resourceType === "worksheet" && (
                <WorksheetPreview content={resource.content} />
              )}
              {resourceType === "assessment" && (
                <AssessmentPreview content={resource.content} />
              )}
              {resourceType === "lesson_plan" && (
                <LessonPlanPreview content={resource.content} />
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Student Workbook Preview ──

function StudentWorkbookPreview({ content }: { content: Record<string, unknown> }) {
  const compellingQuestion = (content.compellingQuestion as string) || "";
  const supportingQuestions = (content.supportingQuestions as string[]) || [];
  const learningTarget = (content.learningTarget as string) || "";
  const vocabularyTracker = (content.vocabularyTracker as Array<{
    term: string; definition: string; contextSentence: string;
  }>) || [];
  const sourceAnalysisSections = (content.sourceAnalysisSections as Array<{
    sourceTitle: string; sourceType: string; sourceAttribution: string;
    isVerified: boolean; teacherNote: string; contextNote: string;
    analysisFramework: string; analysisPrompts: string[];
  }>) || [];
  const formativeCheck = (content.formativeCheck as { instructions: string; questions: string[] }) || { instructions: "", questions: [] };
  const synthesisPrompt = (content.synthesisPrompt as string) || "";

  return (
    <div className="divide-y divide-border">
      {/* Header */}
      <div className="p-4 bg-blue-50">
        <div className="flex items-center gap-2 mb-2">
          <BookOpen size={16} className="text-blue-600" />
          <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600">Student Workbook</span>
        </div>
        <h3 className="text-lg font-bold text-blue-900 leading-snug">{compellingQuestion}</h3>
      </div>

      {/* Supporting Questions */}
      {supportingQuestions.length > 0 && (
        <div className="p-4">
          <SectionHeader label="Supporting Questions" color="blue" />
          <ul className="space-y-1 mt-2">
            {supportingQuestions.map((q, i) => (
              <li key={i} className="text-sm text-foreground flex gap-2">
                <span className="text-blue-500 shrink-0">•</span>
                {q}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Learning Target */}
      {learningTarget && (
        <div className="p-4">
          <SectionHeader label="Learning Target" color="blue" />
          <p className="text-sm mt-2 bg-blue-50 rounded-lg p-3 text-blue-900">{learningTarget}</p>
        </div>
      )}

      {/* Vocabulary Tracker */}
      {vocabularyTracker.length > 0 && (
        <div className="p-4">
          <SectionHeader label="Vocabulary Tracker" color="blue" />
          <div className="mt-2 overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-blue-600 text-white">
                  <th className="px-2 py-1.5 text-left font-semibold">Term</th>
                  <th className="px-2 py-1.5 text-left font-semibold">Definition</th>
                  <th className="px-2 py-1.5 text-left font-semibold">Context</th>
                </tr>
              </thead>
              <tbody>
                {vocabularyTracker.map((v, i) => (
                  <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-blue-50/50"}>
                    <td className="px-2 py-1.5 font-semibold border-b border-border">{v.term}</td>
                    <td className="px-2 py-1.5 border-b border-border">{v.definition}</td>
                    <td className="px-2 py-1.5 border-b border-border italic text-muted">{v.contextSentence}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Source Analysis Sections */}
      {sourceAnalysisSections.map((source, i) => (
        <div key={i} className="p-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <SectionHeader label={`Source ${i + 1}: ${source.sourceTitle}`} color="blue" />
              <p className="text-[11px] text-muted mt-1">
                {source.sourceType} · {source.sourceAttribution}
              </p>
            </div>
            {!source.isVerified && (
              <span className="flex items-center gap-1 text-[10px] font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full shrink-0">
                <AlertTriangle size={10} />
                Teacher to supply
              </span>
            )}
          </div>
          {source.contextNote && (
            <p className="text-xs text-muted italic mt-2">{source.contextNote}</p>
          )}
          <div className="mt-2 bg-blue-50 rounded-lg p-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600">
              {source.analysisFramework}
            </span>
          </div>
          <ul className="space-y-1 mt-2">
            {source.analysisPrompts.map((prompt, pi) => (
              <li key={pi} className="text-xs text-foreground flex gap-2">
                <span className="text-blue-400 shrink-0">{pi + 1}.</span>
                {prompt}
              </li>
            ))}
          </ul>
        </div>
      ))}

      {/* Formative Check */}
      {formativeCheck.questions.length > 0 && (
        <div className="p-4">
          <SectionHeader label="Formative Check" color="blue" />
          {formativeCheck.instructions && (
            <p className="text-xs text-muted italic mt-2">{formativeCheck.instructions}</p>
          )}
          <ol className="space-y-1 mt-2 list-decimal list-inside">
            {formativeCheck.questions.map((q, i) => (
              <li key={i} className="text-sm text-foreground">{q}</li>
            ))}
          </ol>
        </div>
      )}

      {/* Synthesis */}
      {synthesisPrompt && (
        <div className="p-4">
          <SectionHeader label="Synthesis" color="blue" />
          <p className="text-sm mt-2 bg-blue-50 rounded-lg p-3 text-blue-900">{synthesisPrompt}</p>
        </div>
      )}
    </div>
  );
}

// ── Teacher Guide Preview ──

function TeacherGuidePreview({ content }: { content: Record<string, unknown> }) {
  const compellingQuestion = (content.compellingQuestion as string) || "";
  const supportingQuestions = (content.supportingQuestions as string[]) || [];
  const learningTarget = (content.learningTarget as string) || "";
  const vocabularyTracker = (content.vocabularyTracker as Array<{
    term: string; definition: string; contextSentence: string; teachingStrategy: string;
  }>) || [];
  const sourceAnalysisSections = (content.sourceAnalysisSections as Array<{
    sourceTitle: string; sourceType: string; sourceAttribution: string;
    isVerified: boolean; teacherNote: string; contextNote: string;
    analysisFramework: string; analysisPrompts: string[];
    expectedResponses: string[]; teachingNotes: string; followUpQuestions: string[];
  }>) || [];
  const formativeCheck = (content.formativeCheck as {
    instructions: string; questions: string[]; rubric: string; sampleResponses: string[];
  }) || { instructions: "", questions: [], rubric: "", sampleResponses: [] };
  const synthesisPrompt = (content.synthesisPrompt as string) || "";
  const synthesisRubric = (content.synthesisRubric as string) || "";

  return (
    <div className="divide-y divide-border">
      {/* Header */}
      <div className="p-4 bg-purple-50">
        <div className="flex items-center gap-2 mb-2">
          <GraduationCap size={16} className="text-purple-600" />
          <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600">Teacher Guide</span>
        </div>
        <h3 className="text-lg font-bold text-purple-900 leading-snug">{compellingQuestion}</h3>
      </div>

      {/* Supporting Questions */}
      {supportingQuestions.length > 0 && (
        <div className="p-4">
          <SectionHeader label="Supporting Questions" color="purple" />
          <ul className="space-y-1 mt-2">
            {supportingQuestions.map((q, i) => (
              <li key={i} className="text-sm text-foreground flex gap-2">
                <span className="text-purple-500 shrink-0">•</span>
                {q}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Learning Target */}
      {learningTarget && (
        <div className="p-4">
          <SectionHeader label="Learning Target" color="purple" />
          <p className="text-sm mt-2 bg-purple-50 rounded-lg p-3 text-purple-900">{learningTarget}</p>
        </div>
      )}

      {/* Vocabulary with Teaching Strategies */}
      {vocabularyTracker.length > 0 && (
        <div className="p-4">
          <SectionHeader label="Vocabulary Tracker" color="purple" />
          <div className="mt-2 overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-purple-600 text-white">
                  <th className="px-2 py-1.5 text-left font-semibold">Term</th>
                  <th className="px-2 py-1.5 text-left font-semibold">Definition</th>
                  <th className="px-2 py-1.5 text-left font-semibold">Teaching Strategy</th>
                </tr>
              </thead>
              <tbody>
                {vocabularyTracker.map((v, i) => (
                  <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-purple-50/50"}>
                    <td className="px-2 py-1.5 font-semibold border-b border-border">{v.term}</td>
                    <td className="px-2 py-1.5 border-b border-border">{v.definition}</td>
                    <td className="px-2 py-1.5 border-b border-border italic text-purple-700">{v.teachingStrategy}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Source Analysis with Expected Responses */}
      {sourceAnalysisSections.map((source, i) => (
        <div key={i} className="p-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <SectionHeader label={`Source ${i + 1}: ${source.sourceTitle}`} color="purple" />
              <p className="text-[11px] text-muted mt-1">
                {source.sourceType} · {source.sourceAttribution}
              </p>
            </div>
            {!source.isVerified && (
              <span className="flex items-center gap-1 text-[10px] font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full shrink-0">
                <AlertTriangle size={10} />
                Teacher to supply
              </span>
            )}
          </div>
          {source.contextNote && (
            <p className="text-xs text-muted italic mt-2">{source.contextNote}</p>
          )}

          {/* Teaching Notes */}
          {source.teachingNotes && (
            <div className="mt-2 bg-purple-50 rounded-lg p-2.5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-purple-600 mb-1">Teaching Notes</p>
              <p className="text-xs text-purple-900">{source.teachingNotes}</p>
            </div>
          )}

          <div className="mt-2 bg-purple-100/50 rounded-lg p-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600">
              {source.analysisFramework}
            </span>
          </div>

          {/* Prompts + Expected Responses side by side */}
          <div className="space-y-2 mt-2">
            {source.analysisPrompts.map((prompt, pi) => (
              <div key={pi} className="text-xs">
                <p className="text-foreground flex gap-2">
                  <span className="text-purple-400 shrink-0 font-bold">{pi + 1}.</span>
                  {prompt}
                </p>
                {source.expectedResponses?.[pi] && (
                  <div className="ml-5 mt-1 bg-green-50 border-l-2 border-green-400 p-2 rounded-r">
                    <p className="text-[10px] font-bold text-green-700 mb-0.5">Expected Response:</p>
                    <p className="text-green-900">{source.expectedResponses[pi]}</p>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Follow-up Questions */}
          {source.followUpQuestions?.length > 0 && (
            <div className="mt-2">
              <p className="text-[10px] font-bold uppercase tracking-wider text-purple-600 mb-1">Follow-up Questions</p>
              <ul className="space-y-0.5">
                {source.followUpQuestions.map((q, qi) => (
                  <li key={qi} className="text-xs text-foreground flex gap-2">
                    <span className="text-purple-400 shrink-0">→</span>
                    {q}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ))}

      {/* Formative Check with Rubric */}
      {formativeCheck.questions.length > 0 && (
        <div className="p-4">
          <SectionHeader label="Formative Check" color="purple" />
          {formativeCheck.instructions && (
            <p className="text-xs text-muted italic mt-2">{formativeCheck.instructions}</p>
          )}
          <ol className="space-y-1 mt-2 list-decimal list-inside">
            {formativeCheck.questions.map((q, i) => (
              <li key={i} className="text-sm text-foreground">{q}</li>
            ))}
          </ol>
          {formativeCheck.rubric && (
            <div className="mt-3 bg-purple-50 rounded-lg p-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-purple-600 mb-1">Rubric</p>
              <p className="text-xs text-purple-900 whitespace-pre-line">{formativeCheck.rubric}</p>
            </div>
          )}
          {formativeCheck.sampleResponses?.length > 0 && (
            <div className="mt-2 space-y-1">
              <p className="text-[10px] font-bold uppercase tracking-wider text-purple-600">Sample Responses</p>
              {formativeCheck.sampleResponses.map((r, i) => (
                <div key={i} className="bg-green-50 rounded p-2 text-xs text-green-900 border-l-2 border-green-400">
                  {r}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Synthesis + Rubric */}
      {synthesisPrompt && (
        <div className="p-4">
          <SectionHeader label="Synthesis" color="purple" />
          <p className="text-sm mt-2 bg-purple-50 rounded-lg p-3 text-purple-900">{synthesisPrompt}</p>
          {synthesisRubric && (
            <div className="mt-2 bg-green-50 rounded-lg p-3 border-l-2 border-green-400">
              <p className="text-[10px] font-bold uppercase tracking-wider text-green-700 mb-1">Synthesis Rubric</p>
              <p className="text-xs text-green-900 whitespace-pre-line">{synthesisRubric}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Generic Previews for other resource types ──

function ReadingPreview({ content }: { content: Record<string, unknown> }) {
  const title = (content.title as string) || "";
  const subtitle = (content.subtitle as string) || "";
  const format = (content.format as string) || "";
  const from = (content.from as string) || "";
  const to = (content.to as string) || "";
  const subject = (content.subject as string) || "";
  const body = (content.body as string[]) || [];
  const sections = (content.sections as Array<{ heading: string; content: string }>) || [];
  const closingTask = (content.closingTask as string) || "";

  return (
    <div className="p-4 space-y-3">
      {(title || format) && (
        <div className="bg-indigo-50 rounded-lg p-3">
          {title && <h3 className="font-bold text-sm text-indigo-900">{title}</h3>}
          {subtitle && <p className="text-xs text-indigo-700 mt-0.5">{subtitle}</p>}
          {format && <p className="text-[10px] uppercase tracking-wider text-indigo-500 mt-1">{format}</p>}
        </div>
      )}
      {from && <p className="text-xs"><strong>From:</strong> {from}</p>}
      {to && <p className="text-xs"><strong>To:</strong> {to}</p>}
      {subject && <p className="text-xs"><strong>Subject:</strong> {subject}</p>}
      {body.length > 0 && (
        <div className="space-y-2">
          {body.map((para, i) => (
            <p key={i} className="text-sm leading-relaxed">{para}</p>
          ))}
        </div>
      )}
      {sections.length > 0 && (
        <div className="space-y-3">
          {sections.map((s, i) => (
            <div key={i}>
              {s.heading && <h4 className="font-semibold text-sm mb-1">{s.heading}</h4>}
              <p className="text-sm leading-relaxed whitespace-pre-line">{s.content}</p>
            </div>
          ))}
        </div>
      )}
      {closingTask && (
        <div className="bg-amber-50 rounded-lg p-3 border-l-2 border-amber-400">
          <p className="text-[10px] font-bold uppercase tracking-wider text-amber-600 mb-1">Your Task</p>
          <p className="text-sm text-amber-900">{closingTask}</p>
        </div>
      )}
    </div>
  );
}

function WorksheetPreview({ content }: { content: Record<string, unknown> }) {
  const roles = (content.roles as Array<{
    title: string; who: string; whatTheyWant: string; whatTheyFear: string; biasOrPriority: string;
  }>) || [];
  const sections = (content.sections as Array<{
    heading: string; instructions: string; prompts: string[];
  }>) || [];

  if (roles.length > 0) {
    return (
      <div className="p-4 space-y-3">
        <SectionHeader label="Role Cards" color="green" />
        {roles.map((role, i) => (
          <div key={i} className="border border-emerald-200 rounded-lg p-3 bg-emerald-50/30">
            <h4 className="font-bold text-sm text-emerald-900">{role.title}</h4>
            <p className="text-xs text-muted mt-1">{role.who}</p>
            <div className="grid grid-cols-2 gap-2 mt-2 text-xs">
              <div><strong className="text-emerald-700">Wants:</strong> {role.whatTheyWant}</div>
              <div><strong className="text-red-600">Fears:</strong> {role.whatTheyFear}</div>
            </div>
            {role.biasOrPriority && (
              <p className="text-xs mt-1"><strong className="text-amber-700">Priority:</strong> {role.biasOrPriority}</p>
            )}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="p-4 space-y-3">
      <SectionHeader label="Worksheet" color="green" />
      {sections.map((s, i) => (
        <div key={i}>
          <h4 className="font-semibold text-sm">{s.heading}</h4>
          {s.instructions && <p className="text-xs text-muted italic mt-0.5">{s.instructions}</p>}
          <ul className="space-y-0.5 mt-1">
            {s.prompts.map((p, pi) => (
              <li key={pi} className="text-xs flex gap-2">
                <span className="text-emerald-500 shrink-0">{pi + 1}.</span>
                {p}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

function AssessmentPreview({ content }: { content: Record<string, unknown> }) {
  const title = (content.title as string) || "Assessment";
  const instructions = (content.instructions as string) || "";
  const questions = (content.questions as Array<{
    number: number; question: string; type: string; options: string[]; answer: string; explanation: string;
  }>) || [];

  return (
    <div className="p-4 space-y-3">
      <div className="bg-red-50 rounded-lg p-3">
        <h3 className="font-bold text-sm text-red-900">{title}</h3>
        {instructions && <p className="text-xs text-red-700 mt-0.5">{instructions}</p>}
      </div>
      {questions.map((q, i) => (
        <div key={i} className="text-xs">
          <p className="font-semibold">
            {q.number || i + 1}. {q.question}
            <span className="text-[10px] text-muted ml-2">({q.type?.replace("_", " ")})</span>
          </p>
          {q.options?.length > 0 && (
            <ul className="ml-4 mt-0.5 space-y-0.5 text-muted">
              {q.options.map((opt, oi) => (
                <li key={oi}>{opt}</li>
              ))}
            </ul>
          )}
          <div className="ml-4 mt-1 bg-green-50 rounded p-1.5 border-l-2 border-green-400">
            <strong className="text-green-700">Answer:</strong> {q.answer}
            {q.explanation && <span className="text-green-900 ml-1">— {q.explanation}</span>}
          </div>
        </div>
      ))}
    </div>
  );
}

function LessonPlanPreview({ content }: { content: Record<string, unknown> }) {
  const sections = (content.sections as Array<{ heading: string; content: string }>) || [];

  return (
    <div className="p-4 space-y-3">
      <SectionHeader label="Lesson Plan" color="purple" />
      {sections.map((s, i) => (
        <div key={i}>
          <h4 className="font-semibold text-sm mb-1">{s.heading}</h4>
          <p className="text-sm leading-relaxed whitespace-pre-line">{s.content}</p>
        </div>
      ))}
    </div>
  );
}

// ── Shared Components ──

function SectionHeader({ label, color }: { label: string; color: string }) {
  const colors: Record<string, string> = {
    blue: "text-blue-600",
    purple: "text-purple-600",
    green: "text-emerald-600",
    red: "text-red-600",
    indigo: "text-indigo-600",
  };
  return (
    <h4 className={`text-[11px] font-bold uppercase tracking-wider ${colors[color] || "text-primary"}`}>
      {label}
    </h4>
  );
}
