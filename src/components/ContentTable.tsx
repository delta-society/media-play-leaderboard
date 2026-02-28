"use client";

import {
  type ContentItem,
  CONTENT_TYPE_LABELS,
  CHANNEL_LABELS,
} from "@/lib/scoring";
import { getMember } from "@/lib/members";

interface ContentTableProps {
  items: ContentItem[];
  showMember?: boolean;
}

const SOURCE_BADGE: Record<string, { label: string; color: string }> = {
  ghost_auto: { label: "Ghost", color: "bg-purple-100 text-purple-700" },
  manual_web: { label: "Web", color: "bg-blue-100 text-blue-700" },
  manual_claude: { label: "CLI", color: "bg-green-100 text-green-700" },
};

const CHANNEL_ICONS: Record<string, string> = {
  blog: "",
  linkedin: "",
  x: "",
  podcast: "",
  youtube: "",
  other: "",
};

const POINTS_BADGE: Record<number, string> = {
  5: "bg-[#C0F0FB] text-[#1C1917] font-bold",
  3: "bg-blue-100 text-blue-700 font-semibold",
  2: "bg-violet-100 text-violet-700",
  1: "bg-gray-100 text-gray-600",
};

export default function ContentTable({
  items,
  showMember = true,
}: ContentTableProps) {
  if (items.length === 0) {
    return (
      <div className="text-center py-16 text-[#78716C]">
        <p className="text-lg mb-1 font-heading">아직 콘텐츠가 없습니다</p>
        <p className="text-sm">콘텐츠를 추가해 포인트를 획득하세요</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {items.map((item) => {
        const member = getMember(item.member);
        const source = SOURCE_BADGE[item.source] || SOURCE_BADGE.manual_web;
        const pointStyle =
          POINTS_BADGE[item.points] || "bg-gray-100 text-gray-600";

        return (
          <div
            key={item.id}
            className="flex items-center gap-3 p-3 rounded-lg hover:bg-[#F9F7F4] transition-colors group"
          >
            {/* Points badge */}
            <div
              className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm shrink-0 ${pointStyle}`}
            >
              +{item.points}
            </div>

            {/* Content info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                {showMember && (
                  <span className="text-xs text-[#78716C] shrink-0">
                    {member?.displayName}
                  </span>
                )}
                <span className="text-xs text-[#78716C]">
                  {CHANNEL_LABELS[item.channel]}
                </span>
                {item.is_original && (
                  <span className="px-1.5 py-0.5 rounded text-[9px] bg-[#C0F0FB]/30 text-[#1C1917] font-bold">
                    ORIGINAL
                  </span>
                )}
              </div>
              {item.url ? (
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-[#1C1917] hover:text-[#C0F0FB] transition-colors truncate block font-medium"
                  onClick={(e) => e.stopPropagation()}
                >
                  {item.title} ↗
                </a>
              ) : (
                <span className="text-sm text-[#1C1917] truncate block font-medium">
                  {item.title}
                </span>
              )}
            </div>

            {/* Meta */}
            <div className="flex items-center gap-2 shrink-0">
              <span
                className={`px-1.5 py-0.5 rounded text-[10px] ${source.color}`}
              >
                {source.label}
              </span>
              <span className="text-[11px] text-[#78716C]">
                {new Date(item.published_at).toLocaleDateString("ko-KR", {
                  month: "short",
                  day: "numeric",
                })}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
