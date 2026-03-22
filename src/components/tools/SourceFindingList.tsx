"use client";

import { useEffect, useState } from "react";
import type { ViewState } from "@/app/page";
import { Plus, ArrowLeft, Search, Clock, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

interface SourceBankSummary {
  id: string;
  topic: string;
  grade: string;
  inquiryQuestion: string;
  numSourcesRequested: number;
  status: string;
  createdAt: string;
  lesson?: { id: string; title: string } | null;
  _count?: { sources: number };
}

interface SourceFindingListProps {
  onNavigate: (view: ViewState) => void;
}

const statusConfig: Record<string, { icon: typeof Clock; color: string; label: string }> = {
  pending: { icon: Clock, color: "text-muted", label: "Pending" },
  generating: { icon: Loader2, color: "text-amber-500", label: "Generating..." },
  completed: { icon: CheckCircle2, color: "text-green-600", label: "Complete" },
  error: { icon: AlertCircle, color: "text-red-500", label: "Error" },
};

export function SourceFindingList({ onNavigate }: SourceFindingListProps) {
  const [banks, setBanks] = useState<SourceBankSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/source-banks")
      .then((r) => r.json())
      .then((data) => {
        setBanks(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-2">
        <button
          onClick={() => onNavigate({ type: "tools" })}
          className="p-1.5 rounded-lg hover:bg-surface-hover text-muted hover:text-foreground transition-colors"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">Source Finding</h1>
        </div>
        <button
          onClick={() => onNavigate({ type: "source-finding-new" })}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors font-medium text-sm"
        >
          <Plus size={16} />
          New Source Search
        </button>
      </div>
      <p className="text-muted mb-8 ml-10">
        Find and curate historical sources for your inquiry lessons.
      </p>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="animate-spin text-muted" size={24} />
        </div>
      ) : banks.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-border rounded-xl">
          <Search size={40} className="mx-auto text-muted mb-3" />
          <p className="text-lg font-medium mb-1">No source searches yet</p>
          <p className="text-sm text-muted mb-4">
            Click &quot;New Source Search&quot; to find sources for a topic.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {banks.map((bank) => {
            const status = statusConfig[bank.status] || statusConfig.pending;
            const StatusIcon = status.icon;
            return (
              <button
                key={bank.id}
                onClick={() => onNavigate({ type: "source-bank", sourceBankId: bank.id })}
                className="w-full text-left p-5 rounded-xl border border-border bg-surface hover:shadow-md hover:border-primary/30 transition-all group"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-base group-hover:text-primary transition-colors truncate">
                      {bank.topic}
                    </h3>
                    {bank.inquiryQuestion && (
                      <p className="text-sm text-muted mt-1 italic truncate">
                        &quot;{bank.inquiryQuestion}&quot;
                      </p>
                    )}
                    <div className="flex items-center gap-3 mt-2 text-xs text-muted">
                      {bank.grade && <span>Grade {bank.grade}</span>}
                      <span>{bank._count?.sources ?? 0} sources found</span>
                      {bank.lesson && (
                        <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                          Linked: {bank.lesson.title}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <StatusIcon
                      size={14}
                      className={`${status.color} ${bank.status === "generating" ? "animate-spin" : ""}`}
                    />
                    <span className={`text-xs ${status.color}`}>{status.label}</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
