"use client";

import { useState, useEffect, use } from "react";
import { getMember } from "@/lib/members";
import ContentTable from "@/components/ContentTable";
import WeekPicker from "@/components/WeekPicker";
import {
  getCurrentWeek,
  getRecentWeeks,
  getGrade,
  type ContentItem,
} from "@/lib/scoring";

interface ScoreData {
  member: string;
  week: string;
  total_points: number;
  original_count: number;
  meets_minimum: boolean;
  is_yellow_card: boolean;
  content_count: number;
  raw_points: number;
  unique_channels: number;
}

export default function MemberPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const member = getMember(id);
  const [week, setWeek] = useState(getCurrentWeek());
  const [score, setScore] = useState<ScoreData | null>(null);
  const [content, setContent] = useState<ContentItem[]>([]);
  const [history, setHistory] = useState<ScoreData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const [scoresRes, contentRes] = await Promise.all([
          fetch(`/api/scores?week=${week}`),
          fetch(`/api/content?week=${week}&member=${id}`),
        ]);

        if (scoresRes.ok) {
          const data = await scoresRes.json();
          const memberScore = data.scores.find(
            (s: ScoreData) => s.member === id
          );
          setScore(memberScore || null);
        }
        if (contentRes.ok) {
          const data = await contentRes.json();
          setContent(data.items);
        }

        // Fetch history for multiple weeks
        const weeks = getRecentWeeks(8);
        const historyData: ScoreData[] = [];
        for (const w of weeks) {
          const res = await fetch(`/api/scores?week=${w}`);
          if (res.ok) {
            const data = await res.json();
            const s = data.scores.find((s: ScoreData) => s.member === id);
            if (s) historyData.push(s);
          }
        }
        setHistory(historyData);
      } catch (error) {
        console.error("Failed to fetch data:", error);
      }
      setLoading(false);
    }

    fetchData();
  }, [week, id]);

  if (!member) {
    return (
      <div className="text-center py-20">
        <h1 className="text-xl font-semibold text-[#1C1917]">
          멤버를 찾을 수 없습니다
        </h1>
      </div>
    );
  }

  // Calculate grade from history
  const totalWeeks = history.length;
  const metWeeks = history.filter((h) => h.meets_minimum).length;
  const fulfillmentRate = totalWeeks > 0 ? metWeeks / totalWeeks : 0;
  const weeklyAvg =
    totalWeeks > 0
      ? history.reduce((sum, h) => sum + h.total_points, 0) / totalWeeks
      : 0;
  const totalContent = history.reduce((sum, h) => sum + h.content_count, 0);
  const totalOriginals = history.reduce(
    (sum, h) => sum + h.original_count,
    0
  );
  const originalRate = totalContent > 0 ? totalOriginals / totalContent : 0;
  const avgChannels =
    totalWeeks > 0
      ? history.reduce((sum, h) => sum + h.unique_channels, 0) / totalWeeks
      : 0;
  const grade = getGrade(weeklyAvg, fulfillmentRate, originalRate, avgChannels);

  const GRADE_COLORS: Record<string, string> = {
    S: "text-[#C0F0FB] border-[#C0F0FB]",
    A: "text-green-500 border-green-500",
    B: "text-[#1C1917] border-[#1C1917]",
    C: "text-orange-500 border-orange-500",
    D: "text-red-500 border-red-500",
  };

  return (
    <div className="space-y-6">
      {/* Back link */}
      <a
        href="/"
        className="text-sm text-[#78716C] hover:text-[#1C1917] transition-colors"
      >
        &larr; 리더보드로
      </a>

      {/* Member header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#1C1917] font-heading">
              {member.displayName}
            </h1>
            <p className="text-sm text-[#78716C]">
              @{member.id} · {member.teams.join(" · ")} · T1: {member.t1Channel}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div
            className={`w-14 h-14 rounded-xl border-2 flex items-center justify-center font-heading text-2xl font-bold ${GRADE_COLORS[grade]}`}
          >
            {grade}
          </div>
          <WeekPicker currentWeek={week} onWeekChange={setWeek} />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-pulse text-[#78716C]">로딩 중...</div>
        </div>
      ) : (
        <>
          {/* Current week stats */}
          {score && (
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {[
                {
                  label: "주간 포인트",
                  value: `${score.total_points}pt`,
                },
                { label: "콘텐츠", value: `${score.content_count}건` },
                { label: "원본", value: `${score.original_count}건` },
                { label: "채널", value: `${score.unique_channels}개` },
                {
                  label: "기준 달성",
                  value: score.meets_minimum ? "달성" : "미달",
                },
                {
                  label: "경고",
                  value: score.is_yellow_card ? "옐로카드" : "-",
                },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="bg-white rounded-lg border border-[#E7E5E4] p-3 text-center"
                >
                  <p className="text-xs text-[#78716C] mb-1">{stat.label}</p>
                  <p className="text-lg font-bold text-[#1C1917] font-heading">
                    {stat.value}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* History bar chart */}
          <div className="bg-white rounded-xl border border-[#E7E5E4] p-4">
            <h2 className="text-sm font-semibold text-[#1C1917] font-heading mb-3">
              주간 추이 (최근 8주)
            </h2>
            <div className="flex items-end gap-2 h-32">
              {history
                .slice()
                .reverse()
                .map((h) => {
                  const maxPt = Math.max(
                    ...history.map((x) => x.total_points),
                    15
                  );
                  const height = Math.max(
                    (h.total_points / maxPt) * 100,
                    4
                  );
                  return (
                    <div
                      key={h.week}
                      className="flex-1 flex flex-col items-center gap-1"
                    >
                      <span className="text-[10px] text-[#78716C]">
                        {h.total_points}
                      </span>
                      <div
                        className={`w-full rounded-t transition-all ${
                          h.meets_minimum
                            ? "bg-[#C0F0FB]"
                            : h.is_yellow_card
                            ? "bg-red-300"
                            : "bg-[#FFEA00]"
                        }`}
                        style={{ height: `${height}%` }}
                      />
                      <span className="text-[9px] text-[#78716C] truncate w-full text-center">
                        {h.week.split("-W")[1]}
                      </span>
                    </div>
                  );
                })}
            </div>
            {/* 15pt line reference */}
            <div className="mt-1 border-t border-dashed border-[#E7E5E4] pt-1">
              <span className="text-[10px] text-[#78716C]">
                --- 최소 기준: 15pt
              </span>
            </div>
          </div>

          {/* Cumulative stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              {
                label: "주간 평균",
                value: `${weeklyAvg.toFixed(1)}pt`,
              },
              {
                label: "충족률",
                value: `${(fulfillmentRate * 100).toFixed(0)}%`,
              },
              {
                label: "원본 비율",
                value: `${(originalRate * 100).toFixed(0)}%`,
              },
              {
                label: "평균 채널",
                value: `${avgChannels.toFixed(1)}개`,
              },
            ].map((stat) => (
              <div
                key={stat.label}
                className="bg-white rounded-lg border border-[#E7E5E4] p-3 text-center"
              >
                <p className="text-xs text-[#78716C] mb-1">{stat.label}</p>
                <p className="text-lg font-bold text-[#1C1917] font-heading">
                  {stat.value}
                </p>
              </div>
            ))}
          </div>

          {/* Content log for this week */}
          <div>
            <h2 className="text-lg font-semibold text-[#1C1917] font-heading mb-3">
              이번 주 콘텐츠
            </h2>
            <div className="bg-white rounded-xl border border-[#E7E5E4] p-4">
              <ContentTable items={content} showMember={false} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
