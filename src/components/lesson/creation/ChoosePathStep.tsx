"use client";

import { Sparkles, Pencil } from "lucide-react";

interface Props {
  title: string;
  onTitleChange: (title: string) => void;
  onScratch: () => void;
  onTemplate: () => void;
}

export function ChoosePathStep({ title, onTitleChange, onScratch, onTemplate }: Props) {
  return (
    <div className="space-y-6">
      {/* Title Input */}
      <div>
        <label className="block text-sm font-semibold mb-2">Lesson Title</label>
        <input
          type="text"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder="e.g. The Causes of World War I"
          className="w-full px-4 py-3 text-base border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary bg-background"
          autoFocus
        />
      </div>

      {/* Path Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Build from Template */}
        <button
          onClick={onTemplate}
          className="group relative text-left p-6 rounded-xl border-2 border-primary/20 bg-primary/5 hover:border-primary/50 hover:bg-primary/10 transition-all"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center group-hover:bg-primary/30 transition-colors">
              <Sparkles size={20} className="text-primary" />
            </div>
            <h3 className="text-base font-bold">Build from Template</h3>
          </div>
          <p className="text-sm text-muted leading-relaxed">
            Choose a lesson template (Historical Decision-Making, Escape Room, etc.) and let AI generate a complete lesson plan you can iterate on.
          </p>
          <div className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-primary">
            <Sparkles size={12} />
            AI-powered generation
          </div>
        </button>

        {/* Build from Scratch */}
        <button
          onClick={onScratch}
          disabled={!title.trim()}
          className="group relative text-left p-6 rounded-xl border-2 border-border hover:border-emerald-400/50 hover:bg-emerald-50/50 dark:hover:bg-emerald-900/10 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center group-hover:bg-emerald-200 dark:group-hover:bg-emerald-900/50 transition-colors">
              <Pencil size={20} className="text-emerald-600" />
            </div>
            <h3 className="text-base font-bold">Build from Scratch</h3>
          </div>
          <p className="text-sm text-muted leading-relaxed">
            Start with a blank lesson and fill in each section yourself. You can still use per-section AI tools as you go.
          </p>
          <div className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
            <Pencil size={12} />
            Full manual control
          </div>
          {!title.trim() && (
            <p className="mt-2 text-xs text-amber-600">Enter a title above first</p>
          )}
        </button>
      </div>
    </div>
  );
}
