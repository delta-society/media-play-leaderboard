"use client";

import { useState, useEffect } from "react";
import MemberCard from "@/components/MemberCard";
import ContentTable from "@/components/ContentTable";
import WeekPicker from "@/components/WeekPicker";
import { getCurrentWeek, getElapsedDays, TOPIC_LABELS, CHANNEL_LABELS, CONTENT_TYPE_LABELS, type ContentItem, type Topic, type Channel, type ContentType } from "@/lib/scoring";

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
  const [pipelineExpanded, setPipelineExpanded] = useState(false);
  const [updatingIds, setUpdatingIds] = useState<Set<string>>(new Set());

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

  const PIPELINE_LIMIT = 5;
  const visiblePipeline = pipelineExpanded ? pipeline : pipeline.slice(0, PIPELINE_LIMIT);
  const hasMorePipeline = pipeline.length > PIPELINE_LIMIT;

  async function handlePipelineAction(id: string, status: "published" | "dropped") {
    setUpdatingIds((prev) => new Set(prev).add(id));
    setPipeline((prev) => prev.filter((item) => item.id !== id));
    try {
      const res = await fetch(`/api/content/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        const data = await res.json();
        console.error("Failed to update:", data.error);
      }
    } catch (error) {
      console.error("Failed to update content:", error);
    }
    setUpdatingIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }

  // Topic coverage: count from published content + pipeline
  const allItems = [...content, ...pipeline];
  const topicCounts: Record<Topic, number> = {
    ai_tech: 0, mgmt_org: 0, invest_capital: 0,
    building: 0, philosophy: 0, culture: 0,
  };
  for (const item of allItems) {
    if (item.topic) {
      for (const t of item.topic) topicCounts[t]++;
    }
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
              {pipeline.length === 0 ? (
                <div className="py-6 text-center">
                  <p className="text-sm text-[#A8A29E]">등록된 소재가 없습니다</p>
                  <a
                    href="/add"
                    className="inline-block mt-2 text-xs text-[#78716C] hover:text-[#1C1917] underline underline-offset-2 transition-colors"
                  >
                    소재 등록하기
                  </a>
                </div>
              ) : (
                <>
                  {visiblePipeline.map((item) => {
                    const statusConfig = { label: "소재", color: "bg-amber-100 text-amber-700" };
                    const isUpdating = updatingIds.has(item.id);
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
                        <a href={`/edit/${item.id}`} className="flex-1 min-w-0 cursor-pointer">
                          <span className="text-sm text-[#1C1917] truncate block font-medium hover:underline underline-offset-2">
                            {item.title}
                          </span>
                          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                            <span className="text-xs text-[#78716C]">
                              {item.member}
                            </span>
                            {item.channel && item.channel !== "other" && (
                              <span className="text-[10px] text-[#A8A29E]">
                                {CHANNEL_LABELS[item.channel as Channel] || item.channel}
                              </span>
                            )}
                            {item.content_type && (
                              <span className="text-[10px] text-[#A8A29E]">
                                {CONTENT_TYPE_LABELS[item.content_type as ContentType]?.replace(/ \(\d+pt\)/, "") || item.content_type}
                              </span>
                            )}
                            {item.target_date && (
                              <span className="text-[10px] text-[#A8A29E]">
                                ~{item.target_date}
                              </span>
                            )}
                          </div>
                        </a>
                        <div className="flex gap-1.5 shrink-0">
                          <button
                            onClick={() => handlePipelineAction(item.id, "published")}
                            disabled={isUpdating}
                            className="px-2 py-1 rounded-md bg-emerald-50 text-emerald-700 text-[11px] font-medium
                                       hover:bg-emerald-100 transition-colors disabled:opacity-50"
                            title="발행 완료 처리"
                          >
                            완료
                          </button>
                          <button
                            onClick={() => handlePipelineAction(item.id, "dropped")}
                            disabled={isUpdating}
                            className="px-2 py-1 rounded-md bg-red-50 text-red-600 text-[11px] font-medium
                                       hover:bg-red-100 transition-colors disabled:opacity-50"
                            title="폐기 처리"
                          >
                            폐기
                          </button>
                        </div>
                      </div>
                    );
                  })}
                  {hasMorePipeline && (
                    <button
                      onClick={() => setPipelineExpanded(!pipelineExpanded)}
                      className="w-full py-2 text-xs text-[#78716C] hover:text-[#44403C] transition-colors font-medium"
                    >
                      {pipelineExpanded
                        ? "접기"
                        : `더보기 (+${pipeline.length - PIPELINE_LIMIT}건)`}
                    </button>
                  )}
                </>
              )}
            </div>
          </div>

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
