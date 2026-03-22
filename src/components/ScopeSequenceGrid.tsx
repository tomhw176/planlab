"use client";

import type { Unit } from "@/app/page";

interface ScopeSequenceGridProps {
  units: Unit[];
  courseColor: string;
}

export function ScopeSequenceGrid({ units, courseColor }: ScopeSequenceGridProps) {
  if (units.length === 0) {
    return (
      <div className="text-center py-12 text-muted">
        <p>No units yet. Add units in the Outline view to see the scope and sequence.</p>
      </div>
    );
  }

  // Calculate total weeks across all units
  const totalMonths = Math.max(
    ...units.map((u) => u.monthEnd ?? u.monthStart ?? 1),
    10
  );

  const months = Array.from({ length: totalMonths }, (_, i) => i + 1);

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr>
            <th className="text-left p-3 border border-border bg-surface font-semibold text-muted min-w-[200px]">
              Unit
            </th>
            {months.map((m) => (
              <th
                key={m}
                className="p-3 border border-border bg-surface font-semibold text-muted text-center min-w-[80px]"
              >
                Month {m}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {units.map((unit) => {
            const lessons = (unit.lessons ?? []).sort(
              (a, b) => a.order - b.order
            );
            const confirmedCount = lessons.filter(
              (l) => l.status === "confirmed"
            ).length;

            return (
              <tr key={unit.id}>
                <td className="p-3 border border-border">
                  <div className="font-medium">{unit.title}</div>
                  {unit.bigIdea && (
                    <div className="text-xs text-muted mt-0.5">
                      {unit.bigIdea}
                    </div>
                  )}
                  <div className="text-xs text-muted mt-1">
                    {lessons.length} lesson{lessons.length !== 1 ? "s" : ""}
                    {confirmedCount > 0 && ` (${confirmedCount} confirmed)`}
                  </div>
                </td>
                {months.map((m) => {
                  const isActive =
                    unit.monthStart != null &&
                    unit.monthEnd != null &&
                    m >= unit.monthStart &&
                    m <= unit.monthEnd;
                  const isStart = m === unit.monthStart;
                  const isEnd = m === unit.monthEnd;

                  return (
                    <td
                      key={m}
                      className="p-1 border border-border text-center"
                    >
                      {isActive && (
                        <div
                          className="h-8 flex items-center justify-center text-white text-xs font-medium"
                          style={{
                            backgroundColor: courseColor,
                            borderRadius: `${isStart ? "6px" : "0"} ${isEnd ? "6px" : "0"} ${isEnd ? "6px" : "0"} ${isStart ? "6px" : "0"}`,
                            opacity: 0.85,
                          }}
                        >
                          {isStart && `U${unit.order + 1}`}
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            );
          })}

          {/* Topics/Skills row */}
          <tr>
            <td className="p-3 border border-border font-semibold text-muted">
              Key Topics
            </td>
            {months.map((m) => {
              const activeUnits = units.filter(
                (u) =>
                  u.monthStart != null &&
                  u.monthEnd != null &&
                  m >= u.monthStart &&
                  m <= u.monthEnd
              );
              return (
                <td
                  key={m}
                  className="p-2 border border-border text-xs text-muted"
                >
                  {activeUnits.map((u) => (
                    <div key={u.id} className="truncate">
                      {u.bigIdea || u.title}
                    </div>
                  ))}
                </td>
              );
            })}
          </tr>
        </tbody>
      </table>

      <p className="text-xs text-muted mt-4">
        Tip: Set unit timing in the Calendar view to see them on this grid. Months are relative to the start of the course.
      </p>
    </div>
  );
}
