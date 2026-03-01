"use client";

import { getMember } from "@/lib/members";
import { getProjectedPoints } from "@/lib/scoring";

interface MemberCardProps {
  rank: number;
  memberId: string;
  totalPoints: number;
  originalCount: number;
  meetsMinimum: boolean;
  isYellowCard: boolean;
  contentCount: number;
  uniqueChannels: number;
  elapsedDays: number;
}

function getLevel(points: number): { name: string; color: string } {
  if (points >= 23) return { name: "ON FIRE", color: "text-red-500" };
  if (points >= 20) return { name: "BEAST", color: "text-purple-500" };
  if (points >= 17) return { name: "SOLID", color: "text-blue-500" };
  if (points >= 15) return { name: "CLEAR", color: "text-emerald-500" };
  if (points >= 10) return { name: "ALMOST", color: "text-yellow-600" };
  return { name: "DANGER", color: "text-red-500" };
}

export default function MemberCard({
  rank,
  memberId,
  totalPoints,
  meetsMinimum,
  isYellowCard,
  elapsedDays,
}: MemberCardProps) {
  const member = getMember(memberId);
  if (!member) return null;

  const isCompleted = elapsedDays >= 7;
  const projected = getProjectedPoints(totalPoints, elapsedDays);
  const level = isCompleted
    ? getLevel(totalPoints)
    : totalPoints === 0
    ? { name: "—", color: "text-[#A8A29E]" }
    : getLevel(projected);

  // Progress: pace-adjusted for current week
  const paceTarget = isCompleted ? 15 : (elapsedDays / 7) * 15;
  const paceProgress = paceTarget > 0 ? Math.min((totalPoints / paceTarget) * 100, 100) : 0;
  const isAheadOfPace = totalPoints > paceTarget;

  const progress = Math.min((totalPoints / 15) * 100, 100);
  const isTop = rank === 1;

  return (
    <a
      href={`/member/${memberId}`}
      className={`group flex items-center gap-4 px-4 py-3.5 rounded-xl border transition-all duration-200
                  hover:shadow-md hover:scale-[1.01] cursor-pointer
                  ${isTop ? "border-[#C0F0FB] bg-gradient-to-r from-[#C0F0FB]/8 to-white shadow-sm" : "border-[#E7E5E4] bg-white"}`}
    >
      {/* Rank */}
      <span
        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold font-heading shrink-0
                    ${isTop ? "bg-[#C0F0FB] text-[#1C1917]" : "bg-[#F5F5F4] text-[#78716C]"}`}
      >
        {rank}
      </span>

      {/* Name + team */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-[#1C1917] font-heading text-sm">
            {member.displayName}
          </span>
          <span className="text-[10px] text-[#A8A29E] truncate hidden sm:inline">
            {member.teams.join(" · ")}
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-24 shrink-0 hidden sm:block">
        <div className="relative w-full bg-[#F5F5F4] rounded-full h-1.5 overflow-hidden">
          <div
            className={`h-1.5 rounded-full transition-all duration-500 ${
              isCompleted
                ? meetsMinimum
                  ? "bg-gradient-to-r from-[#C0F0FB] to-[#7DD3FC]"
                  : isYellowCard
                  ? "bg-red-300"
                  : "bg-[#FFEA00]"
                : isAheadOfPace
                ? "bg-gradient-to-r from-[#C0F0FB] to-[#7DD3FC]"
                : "bg-[#FFEA00]"
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
        {/* Pace marker for current week */}
        {!isCompleted && (
          <div className="relative w-full h-0">
            <div
              className="absolute -top-1.5 w-px h-1.5 bg-[#1C1917]/30"
              style={{ left: `${Math.min((paceTarget / 15) * 100, 100)}%` }}
            />
          </div>
        )}
      </div>

      {/* Points */}
      <div className="text-right shrink-0">
        <span className="text-lg font-bold text-[#1C1917] font-heading">
          {totalPoints}
          <span className="text-xs font-normal text-[#A8A29E] ml-0.5">pt</span>
        </span>
        {!isCompleted && totalPoints > 0 && (
          <span className="text-[9px] text-[#A8A29E] ml-1">
            →{projected}
          </span>
        )}
      </div>

      {/* Level */}
      <div className="shrink-0 w-16 text-right">
        <span className={`text-[10px] font-bold tracking-wider ${level.color}`}>
          {level.name}
        </span>
      </div>
    </a>
  );
}
