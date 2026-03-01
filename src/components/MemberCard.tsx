"use client";

import { getMember } from "@/lib/members";

interface MemberCardProps {
  rank: number;
  memberId: string;
  totalPoints: number;
  originalCount: number;
  meetsMinimum: boolean;
  isYellowCard: boolean;
  contentCount: number;
  uniqueChannels: number;
}

function getLevel(points: number): { name: string; color: string } {
  if (points >= 30) return { name: "ON FIRE", color: "text-red-500" };
  if (points >= 25) return { name: "BEAST", color: "text-purple-500" };
  if (points >= 20) return { name: "SOLID", color: "text-blue-500" };
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
  contentCount,
}: MemberCardProps) {
  const member = getMember(memberId);
  if (!member) return null;

  const progress = Math.min((totalPoints / 15) * 100, 100);
  const level = getLevel(totalPoints);

  const rankLabel = rank <= 3 ? `${rank}` : `${rank}`;
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
        {rankLabel}
      </span>

      {/* Name + team */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-[#1C1917] font-heading text-sm">
            {member.displayName}
          </span>
          <span className="text-[10px] text-[#A8A29E] truncate">
            {member.teams.join(" · ")}
          </span>
        </div>
      </div>

      {/* Progress bar (compact) */}
      <div className="w-24 shrink-0 hidden sm:block">
        <div className="w-full bg-[#F5F5F4] rounded-full h-1.5 overflow-hidden">
          <div
            className={`h-1.5 rounded-full transition-all duration-500 ${
              meetsMinimum
                ? "bg-gradient-to-r from-[#C0F0FB] to-[#7DD3FC]"
                : isYellowCard
                ? "bg-red-300"
                : "bg-[#FFEA00]"
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Points + level */}
      <div className="text-right shrink-0">
        <span className="text-lg font-bold text-[#1C1917] font-heading">
          {totalPoints}
          <span className="text-xs font-normal text-[#A8A29E] ml-0.5">pt</span>
        </span>
      </div>

      {/* Status */}
      <div className="shrink-0 w-16 text-right">
        <span className={`text-[10px] font-bold tracking-wider ${level.color}`}>
          {level.name}
        </span>
      </div>
    </a>
  );
}
