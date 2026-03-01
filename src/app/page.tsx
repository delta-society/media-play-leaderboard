"use client";

import { useState, useEffect } from "react";
import MemberCard from "@/components/MemberCard";
import ContentTable from "@/components/ContentTable";
import WeekPicker from "@/components/WeekPicker";
import { getCurrentWeek, getElapsedDays, TOPIC_LABELS, type ContentItem, type Topic } from "@/lib/scoring";

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
  const [pipeline, setPipeline] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const [scoresRes, contentRes, pipelineRes] = await Promise.all([
          fetch(`/api/scores?week=${week}`),
          fetch(`/api/content?week=${week}`),
          fetch(`/api/pipeline`),
        ]);

        if (scoresRes.ok) {
          const data = await scoresRes.json();
          setScores(data.scores);
        }
        if (contentRes.ok) {
          const data = await contentRes.json();
          setContent(data.items);
        }
        if (pipelineRes.ok) {
          const data = await pipelineRes.json();
          setPipeline(data.items);
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

  // Topic coverage: count from published content + pipeline
  const allItems = [...content, ...pipeline];
  const topicCounts: Record<Topic, number> = {
    ai_tech: 0, mgmt_org: 0, invest_capital: 0,
    building: 0, philosophy: 0, culture: 0,
  };
  for (const item of allItems) {
    if (item.topic) topicCounts[item.topic]++;
  }
  const coveredTopics = Object.values(topicCounts).filter((c) => c > 0).length;
  const totalTopics = Object.keys(topicCounts).length;

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

          {/* Pipeline */}
          {pipeline.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <h2 className="text-lg font-semibold text-[#1C1917] font-heading">
                  파이프라인
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[10px] font-bold">
                  {pipeline.length}
                </span>
              </div>
              <div className="bg-white rounded-2xl border border-[#E7E5E4] p-4 shadow-sm space-y-2">
                {pipeline.map((item) => {
                  const statusConfig = item.status === "writing"
                    ? { label: "작성중", color: "bg-blue-100 text-blue-700" }
                    : { label: "소재", color: "bg-amber-100 text-amber-700" };
                  return (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-[#F9F7F4] transition-colors"
                    >
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${statusConfig.color}`}
                      >
                        {statusConfig.label}
                      </span>
                      <div className="flex-1 min-w-0">
                        <span className="text-sm text-[#1C1917] truncate block font-medium">
                          {item.title}
                        </span>
                        <span className="text-xs text-[#78716C]">
                          {item.member}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Topic coverage */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <h2 className="text-lg font-semibold text-[#1C1917] font-heading">
                토픽 커버리지
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-[#1C1917] text-white text-[10px] font-bold">
                {coveredTopics}/{totalTopics}
              </span>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {(Object.entries(TOPIC_LABELS) as [Topic, string][]).map(([key, label]) => {
                const count = topicCounts[key];
                return (
                  <div
                    key={key}
                    className={`px-3 py-2.5 rounded-xl text-center transition-colors ${
                      count > 0
                        ? "bg-[#C0F0FB]/30 border border-[#C0F0FB]"
                        : "bg-[#F5F5F4] border border-[#E7E5E4]"
                    }`}
                  >
                    <div className={`text-xs font-medium ${count > 0 ? "text-[#1C1917]" : "text-[#A8A29E]"}`}>
                      {label}
                    </div>
                    <div className={`text-lg font-bold font-heading mt-0.5 ${count > 0 ? "text-[#1C1917]" : "text-[#D6D3D1]"}`}>
                      {count}
                    </div>
                  </div>
                );
              })}
            </div>
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
