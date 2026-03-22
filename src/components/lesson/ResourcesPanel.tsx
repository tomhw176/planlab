"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Script from "next/script";
import {
  Sparkles,
  Loader2,
  Check,
  AlertCircle,
  Download,
  RefreshCw,
  FileText,
  Presentation,
  ClipboardList,
  Users,
  HelpCircle,
  ExternalLink,
  FolderOpen,
} from "lucide-react";

declare global {
  interface Window {
    gapi: {
      load: (api: string, callback: () => void) => void;
    };
    google: {
      picker: {
        PickerBuilder: new () => GooglePickerBuilder;
        DocsView: new (viewId: string) => GoogleDocsView;
        ViewId: { FOLDERS: string };
        Action: { PICKED: string; CANCEL: string };
        Response: { ACTION: string; DOCUMENTS: string };
        Document: { ID: string; NAME: string; URL: string };
      };
    };
  }
}

interface GooglePickerBuilder {
  addView(view: GoogleDocsView): GooglePickerBuilder;
  setOAuthToken(token: string): GooglePickerBuilder;
  setDeveloperKey(key: string): GooglePickerBuilder;
  setCallback(cb: (data: Record<string, unknown>) => void): GooglePickerBuilder;
  setTitle(title: string): GooglePickerBuilder;
  build(): { setVisible(v: boolean): void };
}

interface GoogleDocsView {
  setIncludeFolders(v: boolean): GoogleDocsView;
  setMimeTypes(types: string): GoogleDocsView;
  setSelectFolderEnabled(v: boolean): GoogleDocsView;
}

interface GeneratedResource {
  id: string;
  title: string;
  type: string;
}

interface ResourceStatus {
  title: string;
  type: string;
  status: "pending" | "generating" | "complete" | "error";
  resource?: GeneratedResource;
  error?: string;
}

const RESOURCE_ICONS: Record<string, typeof FileText> = {
  reading: FileText,
  worksheet: ClipboardList,
  slides: Presentation,
  assessment: HelpCircle,
  lesson_plan: FileText,
};

const RESOURCE_LABELS: Record<string, string> = {
  reading: "Document",
  worksheet: "Worksheet",
  slides: "Slides",
  assessment: "Assessment",
  lesson_plan: "Lesson Plan",
};

const TYPE_COLORS: Record<string, string> = {
  reading: "#6366f1",
  worksheet: "#10b981",
  slides: "#f59e0b",
  assessment: "#ef4444",
  lesson_plan: "#8b5cf6",
};

interface Props {
  lessonId: string;
  templateName?: string;
  existingResources?: GeneratedResource[];
  onDone?: () => void;
}

export function ResourcesPanel({
  lessonId,
  templateName,
  existingResources = [],
  onDone,
}: Props) {
  const [state, setState] = useState<"idle" | "generating" | "complete">(
    existingResources.length > 0 ? "complete" : "idle"
  );
  const [resources, setResources] = useState<ResourceStatus[]>([]);
  const [completedResources, setCompletedResources] = useState<GeneratedResource[]>(existingResources);
  const abortRef = useRef<AbortController | null>(null);

  // Dynamically loaded resource options
  const [availableResources, setAvailableResources] = useState<{ title: string; type: string }[]>([]);
  const [selectedResources, setSelectedResources] = useState<Set<string>>(new Set());

  // Load available resource options from the lesson endpoint
  useEffect(() => {
    fetch(`/api/lessons/${lessonId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.resourceOptions) {
          setAvailableResources(data.resourceOptions);
          // Select all by default
          setSelectedResources(new Set(data.resourceOptions.map((o: { title: string }) => o.title)));
        }
      })
      .catch(console.error);
  }, [lessonId]);

  const toggleResource = (title: string) => {
    setSelectedResources((prev) => {
      const next = new Set(prev);
      if (next.has(title)) {
        next.delete(title);
      } else {
        next.add(title);
      }
      return next;
    });
  };

  const generate = useCallback(async () => {
    const toGenerate = availableResources.filter((r) => selectedResources.has(r.title));
    if (toGenerate.length === 0) return;

    setState("generating");
    setCompletedResources([]);

    // Initialize status for each selected resource
    const initialStatus: ResourceStatus[] = toGenerate.map((r) => ({
      ...r,
      status: "generating" as const,
    }));
    setResources(initialStatus);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const selectedTitles = availableResources
        .filter((r) => selectedResources.has(r.title))
        .map((r) => r.title);

      const res = await fetch(`/api/lessons/${lessonId}/generate-resources`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ selectedTitles }),
        signal: controller.signal,
      });

      if (!res.ok || !res.body) {
        throw new Error("Failed to start generation");
      }

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
          if (data === "[DONE]") continue;

          try {
            const parsed = JSON.parse(data);

            if (parsed.type === "resource_complete" && parsed.resource) {
              const completed = parsed.resource as GeneratedResource;
              setCompletedResources((prev) => [...prev, completed]);

              setResources((prev) =>
                prev.map((r) =>
                  r.title === completed.title
                    ? { ...r, status: "complete" as const, resource: completed }
                    : r
                )
              );
            }

            if (parsed.type === "resource_error") {
              setResources((prev) =>
                prev.map((r) =>
                  r.title === parsed.resourceTitle
                    ? { ...r, status: "error" as const, error: parsed.error }
                    : r
                )
              );
            }

            if (parsed.type === "done") {
              setState("complete");
            }
          } catch {
            /* skip unparseable */
          }
        }
      }

      setState("complete");
    } catch (err) {
      if ((err as Error).name === "AbortError") return;
      console.error("Resource generation failed:", err);
      setState("complete");
    }
  }, [lessonId, availableResources, selectedResources]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  const completedCount = resources.filter((r) => r.status === "complete").length;
  const errorCount = resources.filter((r) => r.status === "error").length;
  const totalCount = resources.length || selectedResources.size;

  // Google Docs state
  const [googleAuthed, setGoogleAuthed] = useState(false);
  const [sendingToGoogle, setSendingToGoogle] = useState<Record<string, boolean>>({});
  const [googleDocUrls, setGoogleDocUrls] = useState<Record<string, string>>({});
  const [pickerReady, setPickerReady] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState<{ id: string; name: string } | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  const pickerApiKey = process.env.NEXT_PUBLIC_GOOGLE_PICKER_API_KEY || "";

  // Check Google auth status on mount, and resume pending action if returning from OAuth
  useEffect(() => {
    fetch("/api/auth/google?action=status")
      .then((r) => r.json())
      .then((data) => {
        setGoogleAuthed(data.authenticated);
        if (data.authenticated) {
          // Fetch access token for Picker
          fetch("/api/auth/google/token")
            .then((r) => r.json())
            .then((t) => setAccessToken(t.accessToken || null))
            .catch(() => {});

          // Check for a pending Google export action (saved before OAuth redirect)
          try {
            const pending = localStorage.getItem("planlab_pending_google_export");
            if (pending) {
              localStorage.removeItem("planlab_pending_google_export");
              const { resourceId, resourceType, lessonId: pendingLessonId } = JSON.parse(pending);
              // Only resume if this is the same lesson
              if (pendingLessonId === lessonId && resourceId) {
                // Small delay to let the component fully mount
                setTimeout(() => {
                  handleSendToGoogleAfterAuth(resourceId, resourceType);
                }, 500);
              }
            }
          } catch {
            // ignore parse errors
          }
        }
      })
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePickerApiLoad = useCallback(() => {
    if (window.gapi) {
      window.gapi.load("picker", () => setPickerReady(true));
    }
  }, []);

  const openFolderPicker = useCallback(() => {
    if (!pickerReady || !accessToken || !pickerApiKey) return;

    const view = new window.google.picker.DocsView(window.google.picker.ViewId.FOLDERS);
    view.setIncludeFolders(true);
    view.setMimeTypes("application/vnd.google-apps.folder");
    view.setSelectFolderEnabled(true);

    const picker = new window.google.picker.PickerBuilder()
      .addView(view)
      .setOAuthToken(accessToken)
      .setDeveloperKey(pickerApiKey)
      .setTitle("Choose a folder for your resources")
      .setCallback((data: Record<string, unknown>) => {
        const action = data[window.google.picker.Response.ACTION];
        if (action === window.google.picker.Action.PICKED) {
          const docs = data[window.google.picker.Response.DOCUMENTS] as Record<string, unknown>[];
          if (docs?.[0]) {
            const folder = docs[0];
            setSelectedFolder({
              id: folder[window.google.picker.Document.ID] as string,
              name: folder[window.google.picker.Document.NAME] as string,
            });
          }
        }
      })
      .build();

    picker.setVisible(true);
  }, [pickerReady, accessToken, pickerApiKey]);

  const handleDownload = (resourceId: string, resourceTitle: string, type: string) => {
    const ext = type === "slides" ? "pptx" : "docx";
    const link = document.createElement("a");
    link.href = `/api/export/resource/${resourceId}`;
    link.download = `${resourceTitle}.${ext}`;
    link.click();
  };

  const doGoogleExport = async (resourceId: string, type: string) => {
    setSendingToGoogle((prev) => ({ ...prev, [resourceId]: true }));
    try {
      const endpoint = type === "slides"
        ? `/api/export/google-slides/${resourceId}`
        : `/api/export/google-doc/${resourceId}`;

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folderId: selectedFolder?.id }),
      });
      const data = await res.json();
      if (data.success && data.url) {
        setGoogleDocUrls((prev) => ({ ...prev, [resourceId]: data.url }));
        window.open(data.url, "_blank");
      } else if (data.needsAuth) {
        // Token expired — save action and redirect to OAuth
        setGoogleAuthed(false);
        savePendingAndRedirect(resourceId, type);
      } else {
        console.error("Google export failed:", data.error);
      }
    } catch (err) {
      console.error("Google export error:", err);
    } finally {
      setSendingToGoogle((prev) => ({ ...prev, [resourceId]: false }));
    }
  };

  // Called after returning from OAuth redirect
  const handleSendToGoogleAfterAuth = (resourceId: string, type: string) => {
    doGoogleExport(resourceId, type);
  };

  const savePendingAndRedirect = async (resourceId: string, type: string) => {
    // Save the pending action so we can resume after OAuth
    localStorage.setItem("planlab_pending_google_export", JSON.stringify({
      resourceId,
      resourceType: type,
      lessonId,
    }));
    const res = await fetch("/api/auth/google?returnTo=/");
    const { url } = await res.json();
    window.location.href = url;
  };

  const handleSendToGoogle = async (resourceId: string, type: string) => {
    if (!googleAuthed) {
      savePendingAndRedirect(resourceId, type);
      return;
    }
    doGoogleExport(resourceId, type);
  };

  const handleSendAllToGoogle = async () => {
    for (const resource of completedResources) {
      if (!googleDocUrls[resource.id]) {
        await handleSendToGoogle(resource.id, resource.type);
      }
    }
  };

  // ── IDLE state ──
  if (state === "idle") {
    return (
      <div className="space-y-4">
        <div className="text-center py-8">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Sparkles size={24} className="text-primary" />
          </div>
          <h3 className="font-bold text-lg mb-1">Generate Teaching Resources</h3>
          <p className="text-sm text-muted max-w-md mx-auto mb-6">
            Create ready-to-use handouts, worksheets, slides, and assessments from your lesson plan.
          </p>

          <div className="flex flex-wrap justify-center gap-2 mb-6">
            {availableResources.map((r, i) => {
              const Icon = RESOURCE_ICONS[r.type] || FileText;
              const color = TYPE_COLORS[r.type] || "#6366f1";
              const selected = selectedResources.has(r.title);
              return (
                <button
                  key={i}
                  onClick={() => toggleResource(r.title)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all"
                  style={{
                    borderColor: selected ? color : "#e5e7eb",
                    color: selected ? color : "#9ca3af",
                    backgroundColor: selected ? color + "10" : "transparent",
                    opacity: selected ? 1 : 0.6,
                  }}
                >
                  <Icon size={12} />
                  {r.title}
                  {selected && <Check size={10} />}
                </button>
              );
            })}
          </div>

          <button
            onClick={generate}
            disabled={selectedResources.size === 0}
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white font-semibold rounded-xl hover:bg-primary-dark transition-colors disabled:opacity-50"
          >
            <Sparkles size={16} />
            Generate {selectedResources.size === availableResources.length ? "All" : selectedResources.size} Resource{selectedResources.size !== 1 ? "s" : ""}
          </button>
        </div>

        {onDone && (
          <button
            onClick={onDone}
            className="w-full text-center text-sm text-muted hover:text-primary transition-colors py-2"
          >
            Skip for now →
          </button>
        )}
      </div>
    );
  }

  // ── GENERATING / COMPLETE state ──
  return (
    <div className="space-y-4">
      {/* Load Google Picker API */}
      {pickerApiKey && (
        <Script
          src="https://apis.google.com/js/api.js"
          onReady={handlePickerApiLoad}
          strategy="lazyOnload"
        />
      )}

      {state === "generating" && (
        <>
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm">Generating Resources...</h3>
            <span className="text-xs text-muted">{completedCount}/{totalCount} complete</span>
          </div>
          <div className="w-full bg-border rounded-full h-1.5 overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
              style={{ width: `${(completedCount / totalCount) * 100}%` }}
            />
          </div>
        </>
      )}

      {state === "complete" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm">
              {errorCount > 0
                ? `${completedCount} of ${totalCount} resources generated`
                : "All resources ready!"}
            </h3>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setState("idle");
                  setResources([]);
                  setCompletedResources([]);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-border rounded-lg hover:border-primary/50 text-muted hover:text-primary transition-colors"
              >
                <RefreshCw size={12} />
                Regenerate All
              </button>
              {onDone && (
                <button
                  onClick={onDone}
                  className="flex items-center gap-1.5 px-4 py-1.5 text-sm font-semibold bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
                >
                  <Check size={14} />
                  Done
                </button>
              )}
            </div>
          </div>

          {/* Google Drive folder picker + Send All */}
          {googleAuthed && pickerApiKey && (
            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-blue-50 border border-blue-100">
              <svg viewBox="0 0 87.3 78" width={18} height={16} className="shrink-0">
                <path d="M6.6 66.85l3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8H0c0 1.55.4 3.1 1.2 4.5l5.4 9.35z" fill="#0066DA"/>
                <path d="M43.65 25.15L29.9 1.35c-1.35.8-2.5 1.9-3.3 3.3L1.2 46.5c-.8 1.4-1.2 2.95-1.2 4.5h27.5l16.15-25.85z" fill="#00AC47"/>
                <path d="M73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5H59.8l6.3 11.5 7.45 12.3z" fill="#EA4335"/>
                <path d="M43.65 25.15L57.4 1.35C56.05.55 54.5 0 52.85 0H34.45c-1.65 0-3.2.55-4.55 1.35l13.75 23.8z" fill="#00832D"/>
                <path d="M59.8 53h27.5c0-1.55-.4-3.1-1.2-4.5L73.45 28.1c-.8-1.4-1.95-2.5-3.3-3.3L57.4 1.35 43.65 25.15l16.15 27.85z" fill="#2684FC"/>
                <path d="M27.5 53L13.75 76.8c1.35.8 2.9 1.2 4.55 1.2H69.1c1.65 0 3.2-.4 4.55-1.2L59.8 53H27.5z" fill="#FFBA00"/>
              </svg>
              <button
                onClick={openFolderPicker}
                disabled={!pickerReady}
                className="flex items-center gap-1.5 text-xs font-medium text-blue-700 hover:text-blue-900 transition-colors disabled:opacity-50"
              >
                <FolderOpen size={14} />
                {selectedFolder ? selectedFolder.name : "Choose folder..."}
              </button>
              {selectedFolder && (
                <button
                  onClick={() => setSelectedFolder(null)}
                  className="text-[10px] text-blue-400 hover:text-blue-600"
                >
                  ✕
                </button>
              )}
              <div className="flex-1" />
              <button
                onClick={handleSendAllToGoogle}
                disabled={completedResources.length === 0}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                Send All to Google Drive
              </button>
            </div>
          )}
        </div>
      )}

      {/* Resource list */}
      <div className="space-y-2">
        {(resources.length > 0 ? resources : completedResources.map((r) => ({
          title: r.title,
          type: r.type,
          status: "complete" as const,
          resource: r,
        }))).map((item, i) => {
          const Icon = RESOURCE_ICONS[item.type] || FileText;
          const color = TYPE_COLORS[item.type] || "#6366f1";
          const label = RESOURCE_LABELS[item.type] || item.type;
          const ext = item.type === "slides" ? "PPTX" : "DOCX";

          return (
            <div
              key={i}
              className="flex items-center gap-3 p-3 rounded-xl border border-border bg-surface transition-all"
              style={
                item.status === "complete"
                  ? { borderColor: color + "30" }
                  : undefined
              }
            >
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                style={{ backgroundColor: color + "15" }}
              >
                <Icon size={16} style={{ color }} />
              </div>

              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{item.title}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span
                    className="text-[10px] font-semibold uppercase tracking-wider"
                    style={{ color }}
                  >
                    {label}
                  </span>
                  <span className="text-[10px] text-muted">• {ext}</span>
                </div>
              </div>

              <div className="shrink-0 flex items-center gap-1">
                {item.status === "generating" && (
                  <Loader2 size={16} className="animate-spin text-muted" />
                )}
                {item.status === "complete" && item.resource && (
                  <>
                    <button
                      onClick={() =>
                        handleDownload(item.resource!.id, item.resource!.title, item.resource!.type)
                      }
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors hover:bg-surface-hover"
                      style={{ color }}
                    >
                      <Download size={14} />
                      Download
                    </button>
                    {googleDocUrls[item.resource!.id] ? (
                        <a
                          href={googleDocUrls[item.resource!.id]}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors hover:bg-surface-hover text-blue-600"
                        >
                          <ExternalLink size={14} />
                          {item.type === "slides" ? "Open Slides" : "Open Doc"}
                        </a>
                      ) : (
                        <button
                          onClick={() => handleSendToGoogle(item.resource!.id, item.type)}
                          disabled={sendingToGoogle[item.resource!.id]}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors hover:bg-surface-hover text-blue-600 disabled:opacity-50"
                        >
                          {sendingToGoogle[item.resource!.id] ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : (
                            <svg viewBox="0 0 87.3 78" width={14} height={12} fill="currentColor">
                              <path d="M6.6 66.85l3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8H0c0 1.55.4 3.1 1.2 4.5l5.4 9.35z" fill="#0066DA"/>
                              <path d="M43.65 25.15L29.9 1.35c-1.35.8-2.5 1.9-3.3 3.3L1.2 46.5c-.8 1.4-1.2 2.95-1.2 4.5h27.5l16.15-25.85z" fill="#00AC47"/>
                              <path d="M73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5H59.8l6.3 11.5 7.45 12.3z" fill="#EA4335"/>
                              <path d="M43.65 25.15L57.4 1.35C56.05.55 54.5 0 52.85 0H34.45c-1.65 0-3.2.55-4.55 1.35l13.75 23.8z" fill="#00832D"/>
                              <path d="M59.8 53h27.5c0-1.55-.4-3.1-1.2-4.5L73.45 28.1c-.8-1.4-1.95-2.5-3.3-3.3L57.4 1.35 43.65 25.15l16.15 27.85z" fill="#2684FC"/>
                              <path d="M27.5 53L13.75 76.8c1.35.8 2.9 1.2 4.55 1.2H69.1c1.65 0 3.2-.4 4.55-1.2L59.8 53H27.5z" fill="#FFBA00"/>
                            </svg>
                          )}
                          {item.type === "slides" ? "Google Slides" : "Google Docs"}
                        </button>
                      )
                    }
                  </>
                )}
                {item.status === "error" && (
                  <div className="flex items-center gap-1.5 text-xs text-red-500">
                    <AlertCircle size={14} />
                    Failed
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
