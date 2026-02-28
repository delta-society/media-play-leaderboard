"use client";

import { getWeekDates, getRecentWeeks, getCurrentWeek } from "@/lib/scoring";

interface WeekPickerProps {
  currentWeek: string;
  onWeekChange: (week: string) => void;
}

export default function WeekPicker({
  currentWeek,
  onWeekChange,
}: WeekPickerProps) {
  const weeks = getRecentWeeks(12);
  const thisWeek = getCurrentWeek();

  return (
    <div className="relative">
      <select
        value={currentWeek}
        onChange={(e) => onWeekChange(e.target.value)}
        className="appearance-none pl-3 pr-8 py-2 rounded-xl border border-[#E7E5E4] bg-white text-sm text-[#1C1917]
                   focus:outline-none focus:ring-2 focus:ring-[#C0F0FB] focus:border-transparent
                   cursor-pointer shadow-sm font-medium"
      >
        {weeks.map((week) => {
          const { start, end } = getWeekDates(week);
          const label = `${start.toLocaleDateString("ko-KR", {
            month: "short",
            day: "numeric",
          })} — ${end.toLocaleDateString("ko-KR", {
            month: "short",
            day: "numeric",
          })}`;
          const isCurrent = week === thisWeek;
          return (
            <option key={week} value={week}>
              {week} ({label}){isCurrent ? " ← 이번 주" : ""}
            </option>
          );
        })}
      </select>
      <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-[#78716C] text-xs">
        ▼
      </div>
    </div>
  );
}
