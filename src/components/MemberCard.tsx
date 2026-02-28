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

const RANK_CONFIG: Record<
  number,
  { label: string; border: string; bg: string; glow: string; badge: string }
> = {
  1: {
    label: "1st",
    border: "border-[#C0F0FB]",
    bg: "bg-gradient-to-br from-[#C0F0FB]/10 to-white",
    glow: "shadow-[0_0_20px_rgba(192,240,251,0.3)]",
    badge: "bg-[#C0F0FB] text-[#1C1917]",
  },
  2: {
    label: "2nd",
    border: "border-[#E7E5E4]",
    bg: "bg-gradient-to-br from-[#F9F7F4] to-white",
    glow: "",
    badge: "bg-[#E7E5E4] text-[#44403C]",
  },
  3: {
    label: "3rd",
    border: "border-[#E7E5E4]",
    bg: "bg-gradient-to-br from-[#F9F7F4] to-white",
    glow: "",
    badge: "bg-[#F5F5F4] text-[#78716C]",
  },
};

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
  originalCount,
  meetsMinimum,
  isYellowCard,
  contentCount,
  uniqueChannels,
}: MemberCardProps) {
  const member = getMember(memberId);
  if (!member) return null;

  const progress = Math.min((totalPoints / 15) * 100, 100);
  const overAchieve = totalPoints > 15 ? ((totalPoints - 15) / 15) * 100 : 0;
  const config = RANK_CONFIG[rank] || RANK_CONFIG[3];
  const level = getLevel(totalPoints);

  return (
    <a
      href={`/member/${memberId}`}
      className={`group block rounded-2xl border-2 p-5 transition-all duration-300
                  hover:scale-[1.02] hover:shadow-lg cursor-pointer
                  ${config.border} ${config.bg} ${config.glow}`}
    >
      {/* Top: rank + name + points */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold font-heading ${config.badge}`}>
            {config.label}
          </span>
          <div>
            <h3 className="font-semibold text-[#1C1917] text-lg font-heading leading-tight">
              {member.displayName}
            </h3>
            <p className="text-[11px] text-[#78716C]">
              @{member.id} · {member.t1Channel}
            </p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold text-[#1C1917] font-heading leading-none">
            {totalPoints}
            <span className="text-sm font-normal text-[#78716C]">pt</span>
          </div>
          <div className={`text-[10px] font-bold tracking-wider mt-1 ${level.color}`}>
            {level.name}
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="relative w-full bg-[#F5F5F4] rounded-full h-3 mb-3 overflow-hidden">
        <div
          className={`h-3 rounded-full transition-all duration-700 ease-out ${
            meetsMinimum
              ? "bg-gradient-to-r from-[#C0F0FB] to-[#7DD3FC]"
              : isYellowCard
              ? "bg-gradient-to-r from-red-300 to-red-400"
              : "bg-gradient-to-r from-[#FFEA00] to-[#FCD34D]"
          }`}
          style={{ width: `${progress}%` }}
        />
        {overAchieve > 0 && (
          <div
            className="absolute top-0 h-3 bg-gradient-to-r from-[#7DD3FC] to-[#C0F0FB] opacity-50 rounded-r-full"
            style={{ left: `${progress}%`, width: `${Math.min(overAchieve, 100 - progress)}%` }}
          />
        )}
        {/* 15pt marker */}
        <div
          className="absolute top-0 w-0.5 h-3 bg-[#1C1917]/20"
          style={{ left: "100%" }}
        />
      </div>

      {/* Stats row */}
      <div className="flex items-center justify-between text-xs">
        <div className="flex gap-3">
          <span className="text-[#78716C]">
            콘텐츠 <span className="font-medium text-[#44403C]">{contentCount}건</span>
          </span>
          <span className="text-[#78716C]">
            원본{" "}
            <span
              className={`font-medium ${
                originalCount >= 1 ? "text-[#44403C]" : "text-red-500"
              }`}
            >
              {originalCount}/1건
            </span>
          </span>
          <span className="text-[#78716C]">
            채널{" "}
            <span
              className={`font-medium ${
                uniqueChannels >= 2 ? "text-[#44403C]" : "text-red-500"
              }`}
            >
              {uniqueChannels}개
            </span>
          </span>
        </div>
        <div className="flex gap-1.5">
          {meetsMinimum && (
            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold">
              CLEAR
            </span>
          )}
          {isYellowCard && (
            <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-600 text-[10px] font-bold">
              YELLOW
            </span>
          )}
          {!meetsMinimum && !isYellowCard && (
            <span className="px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 text-[10px] font-bold">
              진행중
            </span>
          )}
        </div>
      </div>
    </a>
  );
}
