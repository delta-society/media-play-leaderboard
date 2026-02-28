"use client";

interface ScoreData {
  member: string;
  total_points: number;
  original_count: number;
  meets_minimum: boolean;
  is_yellow_card: boolean;
  content_count: number;
}

interface WeeklySummaryProps {
  scores: ScoreData[];
}

export default function WeeklySummary({ scores }: WeeklySummaryProps) {
  const totalMembers = scores.length;
  const avgPoints =
    totalMembers > 0
      ? scores.reduce((sum, s) => sum + s.total_points, 0) / totalMembers
      : 0;
  const metCount = scores.filter((s) => s.meets_minimum).length;
  const originalMetCount = scores.filter((s) => s.original_count >= 1).length;
  const yellowCards = scores.filter((s) => s.is_yellow_card).length;
  const totalContent = scores.reduce((sum, s) => sum + s.content_count, 0);

  const stats = [
    {
      label: "평균 포인트",
      sub: "기준 15pt",
      value: `${avgPoints.toFixed(1)}`,
      unit: "pt",
    },
    {
      label: "15pt 달성",
      sub: "주간 최소",
      value: `${metCount}`,
      unit: `/ ${totalMembers}`,
    },
    {
      label: "원본 달성",
      sub: "주 1건 이상",
      value: `${originalMetCount}`,
      unit: `/ ${totalMembers}`,
    },
    {
      label: "총 콘텐츠",
      sub: "",
      value: `${totalContent}`,
      unit: "건",
    },
    {
      label: "경고",
      sub: "10pt 미만",
      value: `${yellowCards}`,
      unit: "건",
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="bg-white rounded-xl border border-[#E7E5E4] p-3.5 text-center"
        >
          <p className="text-2xl font-bold font-heading text-[#1C1917]">
            {stat.value}
            <span className="text-xs font-normal text-[#78716C] ml-0.5">
              {stat.unit}
            </span>
          </p>
          <p className="text-[11px] text-[#44403C] mt-0.5 font-medium">
            {stat.label}
          </p>
          {stat.sub && (
            <p className="text-[9px] text-[#78716C]">{stat.sub}</p>
          )}
        </div>
      ))}
    </div>
  );
}
