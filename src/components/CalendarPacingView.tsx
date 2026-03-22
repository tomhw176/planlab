"use client";

import { useState } from "react";
import type { Unit } from "@/app/page";
import { cn } from "@/lib/utils";

interface CalendarPacingViewProps {
  units: Unit[];
  courseColor: string;
  onRefresh: () => void;
}

export function CalendarPacingView({
  units,
  courseColor,
  onRefresh,
}: CalendarPacingViewProps) {
  const [totalMonths, setTotalMonths] = useState(10);
  const months = Array.from({ length: totalMonths }, (_, i) => i + 1);
  const weeks = [1, 2, 3, 4];

  const updateUnitTiming = async (
    unitId: string,
    field: string,
    value: number | null
  ) => {
    await fetch(`/api/units/${unitId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [field]: value }),
    });
    onRefresh();
  };

  return (
    <div>
      <div className="flex items-center gap-4 mb-4">
        <label className="text-sm text-muted">
          Course length:
          <select
            value={totalMonths}
            onChange={(e) => setTotalMonths(Number(e.target.value))}
            className="ml-2 px-2 py-1 text-sm border border-border rounded-md"
          >
            {[5, 6, 7, 8, 9, 10, 11, 12].map((n) => (
              <option key={n} value={n}>
                {n} months
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="space-y-4">
        {units.map((unit) => (
          <div
            key={unit.id}
            className="border border-border rounded-lg bg-surface p-4"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: courseColor }}
                />
                <h3 className="font-medium text-sm">
                  U{unit.order + 1}: {unit.title}
                </h3>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <label className="flex items-center gap-1 text-muted">
                  Start:
                  <select
                    value={unit.monthStart ?? ""}
                    onChange={(e) =>
                      updateUnitTiming(
                        unit.id,
                        "monthStart",
                        e.target.value ? Number(e.target.value) : null
                      )
                    }
                    className="px-1 py-0.5 border border-border rounded text-xs"
                  >
                    <option value="">—</option>
                    {months.map((m) => (
                      <option key={m} value={m}>
                        M{m}
                      </option>
                    ))}
                  </select>
                  <select
                    value={unit.weekStart ?? ""}
                    onChange={(e) =>
                      updateUnitTiming(
                        unit.id,
                        "weekStart",
                        e.target.value ? Number(e.target.value) : null
                      )
                    }
                    className="px-1 py-0.5 border border-border rounded text-xs"
                  >
                    <option value="">—</option>
                    {weeks.map((w) => (
                      <option key={w} value={w}>
                        W{w}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex items-center gap-1 text-muted">
                  End:
                  <select
                    value={unit.monthEnd ?? ""}
                    onChange={(e) =>
                      updateUnitTiming(
                        unit.id,
                        "monthEnd",
                        e.target.value ? Number(e.target.value) : null
                      )
                    }
                    className="px-1 py-0.5 border border-border rounded text-xs"
                  >
                    <option value="">—</option>
                    {months.map((m) => (
                      <option key={m} value={m}>
                        M{m}
                      </option>
                    ))}
                  </select>
                  <select
                    value={unit.weekEnd ?? ""}
                    onChange={(e) =>
                      updateUnitTiming(
                        unit.id,
                        "weekEnd",
                        e.target.value ? Number(e.target.value) : null
                      )
                    }
                    className="px-1 py-0.5 border border-border rounded text-xs"
                  >
                    <option value="">—</option>
                    {weeks.map((w) => (
                      <option key={w} value={w}>
                        W{w}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </div>

            {/* Visual timeline bar */}
            <div className="flex gap-px">
              {months.map((m) =>
                weeks.map((w) => {
                  const slot = (m - 1) * 4 + w;
                  const start =
                    unit.monthStart && unit.weekStart
                      ? (unit.monthStart - 1) * 4 + unit.weekStart
                      : null;
                  const end =
                    unit.monthEnd && unit.weekEnd
                      ? (unit.monthEnd - 1) * 4 + unit.weekEnd
                      : null;
                  const isActive =
                    start != null && end != null && slot >= start && slot <= end;

                  return (
                    <div
                      key={`${m}-${w}`}
                      className={cn(
                        "h-4 flex-1 rounded-sm",
                        isActive ? "" : "bg-background"
                      )}
                      style={
                        isActive ? { backgroundColor: courseColor, opacity: 0.7 } : undefined
                      }
                      title={`Month ${m}, Week ${w}`}
                    />
                  );
                })
              )}
            </div>
            <div className="flex mt-1">
              {months.map((m) => (
                <div
                  key={m}
                  className="flex-1 text-center text-[10px] text-muted"
                  style={{ flex: 4 }}
                >
                  M{m}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {units.length === 0 && (
        <div className="text-center py-12 text-muted">
          <p>No units yet. Add units in the Outline view first.</p>
        </div>
      )}
    </div>
  );
}
