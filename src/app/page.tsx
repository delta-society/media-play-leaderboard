"use client";

import { useState, useEffect } from "react";
import MemberCard from "@/components/MemberCard";
import ContentTable from "@/components/ContentTable";
import WeekPicker from "@/components/WeekPicker";
import WeeklySummary from "@/components/WeeklySummary";
import { getCurrentWeek, type ContentItem } from "@/lib/scoring";

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

export default function Home() {
  const [week, setWeek] = useState(getCurrentWeek());
  const [scores, setScores] = useState<ScoreData[]>([]);
  const [content, setContent] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const [scoresRes, contentRes] = await Promise.all([
          fetch(`/api/scores?week=${week}`),
          fetch(`/api/content?week=${week}`),
        ]);

        if (scoresRes.ok) {
          const data = await scoresRes.json();
          setScores(data.scores);
        }
        if (contentRes.ok) {
          const data = await contentRes.json();
          setContent(data.items);
        }
      } catch (error) {
        console.error("Failed to fetch data:", error);
      }
      setLoading(false);
    }

    fetchData();
  }, [week]);

  const allMet = scores.length > 0 && scores.every((s) => s.meets_minimum);
  const totalPoints = scores.reduce((sum, s) => sum + s.total_points, 0);

  return (
    <div className="space-y-6">
      {/* Hero header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-[#1C1917] font-heading tracking-tight">
            Leaderboard
          </h1>
          <p className="text-sm text-[#78716C] mt-1">
            주간 콘텐츠 포인트 · 최소{" "}
            <span className="font-semibold text-[#1C1917]">15pt</span> + 원본{" "}
            <span className="font-semibold text-[#1C1917]">1건</span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          {!loading && allMet && (
            <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold">
              ALL CLEAR
            </span>
          )}
          <WeekPicker currentWeek={week} onWeekChange={setWeek} />
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <div className="w-10 h-10 border-3 border-[#C0F0FB] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-[#78716C]">데이터 로딩 중...</p>
        </div>
      ) : (
        <>
          {/* Podium cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {scores.map((score, idx) => (
              <MemberCard
                key={score.member}
                rank={idx + 1}
                memberId={score.member}
                totalPoints={score.total_points}
                originalCount={score.original_count}
                meetsMinimum={score.meets_minimum}
                isYellowCard={score.is_yellow_card}
                contentCount={score.content_count}
                uniqueChannels={score.unique_channels}
              />
            ))}
          </div>

          {/* Team stats */}
          <div>
            <h2 className="text-xs font-bold text-[#78716C] uppercase tracking-wider mb-3 font-heading">
              Team Summary
            </h2>
            <WeeklySummary scores={scores} />
          </div>

          {/* Content feed */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold text-[#1C1917] font-heading">
                  콘텐츠 피드
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-[#1C1917] text-white text-[10px] font-bold">
                  {content.length}
                </span>
              </div>
              <a
                href="/add"
                className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#C0F0FB] to-[#7DD3FC] text-[#1C1917] text-sm font-semibold
                           hover:from-[#FFEA00] hover:to-[#FCD34D] transition-all shadow-sm"
              >
                + 콘텐츠 추가
              </a>
            </div>
            <div className="bg-white rounded-2xl border border-[#E7E5E4] p-4 shadow-sm">
              <ContentTable items={content} />
            </div>
          </div>

          {/* Total team points */}
          <div className="text-center py-4">
            <p className="text-xs text-[#78716C] mb-1">이번 주 팀 합계</p>
            <p className="text-4xl font-bold font-heading text-[#1C1917]">
              {totalPoints}
              <span className="text-lg text-[#78716C] font-normal">pt</span>
            </p>
            <div className="w-16 h-0.5 bg-gradient-to-r from-transparent via-[#C0F0FB] to-transparent mx-auto mt-2" />
          </div>
        </>
      )}
    </div>
  );
}
