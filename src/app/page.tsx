"use client";

import { useState, useEffect } from "react";
import MemberCard from "@/components/MemberCard";
import ContentTable from "@/components/ContentTable";
import WeekPicker from "@/components/WeekPicker";
import { getCurrentWeek, getElapsedDays, type ContentItem } from "@/lib/scoring";

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

  const elapsed = getElapsedDays(week);
  const allMet = scores.length > 0 && scores.every((s) => s.meets_minimum);
  const metCount = scores.filter((s) => s.meets_minimum).length;
  const totalPoints = scores.reduce((sum, s) => sum + s.total_points, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
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
          {/* Member list */}
          <div className="space-y-2">
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
                elapsedDays={elapsed}
              />
            ))}
          </div>

          {/* Team summary — single line */}
          <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-[#1C1917] text-white">
            <div className="flex items-center gap-6 text-sm">
              <span>
                <span className="text-[#A8A29E] text-xs mr-1.5">달성</span>
                <span className="font-bold font-heading">{metCount}</span>
                <span className="text-[#A8A29E] text-xs">/{scores.length}</span>
              </span>
              <span>
                <span className="text-[#A8A29E] text-xs mr-1.5">팀 합계</span>
                <span className="font-bold font-heading">{totalPoints}</span>
                <span className="text-[#A8A29E] text-xs ml-0.5">pt</span>
              </span>
            </div>
            {allMet && (
              <span className="text-[10px] font-bold text-emerald-400 tracking-wider">
                ALL CLEAR
              </span>
            )}
          </div>

          {/* Content feed */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <h2 className="text-lg font-semibold text-[#1C1917] font-heading">
                콘텐츠 피드
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-[#1C1917] text-white text-[10px] font-bold">
                {content.length}
              </span>
            </div>
            <div className="bg-white rounded-2xl border border-[#E7E5E4] p-4 shadow-sm">
              <ContentTable items={content} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
