"use client";

import { useState, useEffect } from "react";
import { getMember, ACTIVE_MEMBERS } from "@/lib/members";
import {
  CHANNEL_LABELS,
  TOPIC_LABELS,
  CONTENT_TYPE_LABELS,
  type ContentItem,
  type Channel,
  type Topic,
  type ContentType,
} from "@/lib/scoring";

interface Stats {
  total: number;
  extracted: number;
  pending: number;
}

interface Suggestion {
  type: "unfurled" | "emotion" | "data";
  topic: string;
  detail: string;
  reason: string;
  source_title: string;
}

interface InsightsData {
  suggestions: Suggestion[];
  generated_at: string;
}

const SUGGESTION_TYPE_CONFIG = {
  unfurled: { label: "미전개", color: "text-blue-600 bg-blue-50" },
  emotion: { label: "경험/감정", color: "text-amber-700 bg-amber-50" },
  data: { label: "데이터", color: "text-emerald-700 bg-emerald-50" },
};

export default function KnowledgePage() {
  const [items, setItems] = useState<ContentItem[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, extracted: 0, pending: 0 });
  const [insights, setInsights] = useState<Record<string, InsightsData>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [memberFilter, setMemberFilter] = useState("");
  const [channelFilter, setChannelFilter] = useState("");
  const [topicFilter, setTopicFilter] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [extractingId, setExtractingId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "members">("members");

  useEffect(() => {
    fetchData();
  }, [memberFilter, channelFilter, topicFilter]);

  async function fetchData() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (memberFilter) params.set("member", memberFilter);
      if (channelFilter) params.set("channel", channelFilter);
      if (topicFilter) params.set("topic", topicFilter);
      if (search) params.set("q", search);

      const res = await fetch(`/api/knowledge?${params}`);
      if (res.ok) {
        const data = await res.json();
        setItems(data.items);
        setStats(data.stats);
        if (data.insights) setInsights(data.insights);
      }
    } catch (error) {
      console.error("Failed to fetch:", error);
    }
    setLoading(false);
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    fetchData();
  }

  async function handleExtract(id: string) {
    setExtractingId(id);
    try {
      const res = await fetch("/api/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        const data = await res.json();
        setItems((prev) =>
          prev.map((item) => (item.id === id ? data.item : item))
        );
        setExpandedId(id);
      }
    } catch (error) {
      console.error("Extract failed:", error);
    }
    setExtractingId(null);
  }

  async function handleBatchExtract() {
    setExtractingId("batch");
    try {
      const res = await fetch("/api/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ batch: true }),
      });
      if (res.ok) {
        await fetchData();
      }
    } catch (error) {
      console.error("Batch extract failed:", error);
    }
    setExtractingId(null);
  }

  const EXTRACTABLE_CHANNELS = ["blog", "linkedin", "podcast"];

  function getExtractionStatus(item: ContentItem): "extracted" | "pending" | "unavailable" {
    if (item.extracted_at) return "extracted";
    if (!EXTRACTABLE_CHANNELS.includes(item.channel)) return "unavailable";
    if (!item.url) return "unavailable";
    return "pending";
  }

  const STATUS_CONFIG = {
    extracted: { dot: "bg-emerald-400", label: "추출 완료" },
    pending: { dot: "bg-amber-400", label: "추출 가능" },
    unavailable: { dot: "bg-[#D6D3D1]", label: "추출 불가" },
  };

  const filteredItems = search
    ? items.filter(
        (item) =>
          item.title.toLowerCase().includes(search.toLowerCase()) ||
          item.summary?.toLowerCase().includes(search.toLowerCase()) ||
          item.key_claims?.some((c) =>
            c.toLowerCase().includes(search.toLowerCase())
          )
      )
    : items;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-[#1C1917] font-heading tracking-tight">
            Knowledge Base
          </h1>
          <p className="text-sm text-[#78716C] mt-1">
            발행 콘텐츠에서 추출한 지식 인덱스
          </p>
        </div>
        {stats.pending > 0 && (
          <button
            onClick={handleBatchExtract}
            disabled={extractingId === "batch"}
            className="px-4 py-2 rounded-lg bg-[#C0F0FB] text-[#1C1917] text-xs font-semibold
                       hover:bg-[#7DD3FC] transition-colors disabled:opacity-50"
          >
            {extractingId === "batch"
              ? "추출 중..."
              : `미추출 ${stats.pending}건 일괄 추출`}
          </button>
        )}
      </div>

      {/* View toggle + Stats bar */}
      <div className="flex items-center gap-4 px-4 py-3 rounded-xl bg-[#1C1917] text-white text-sm">
        <div className="flex items-center gap-1 mr-2">
          <button
            onClick={() => setViewMode("members")}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
              viewMode === "members"
                ? "bg-white/15 text-white"
                : "text-white/40 hover:text-white/70"
            }`}
          >
            멤버별
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
              viewMode === "list"
                ? "bg-white/15 text-white"
                : "text-white/40 hover:text-white/70"
            }`}
          >
            전체 목록
          </button>
        </div>
        <div className="w-px h-4 bg-white/10" />
        <span>
          <span className="text-[#A8A29E] text-xs mr-1.5">전체</span>
          <span className="font-bold font-heading">{stats.total}</span>
        </span>
        <span>
          <span className="text-[#A8A29E] text-xs mr-1.5">추출 완료</span>
          <span className="font-bold font-heading text-emerald-400">
            {stats.extracted}
          </span>
        </span>
        <span>
          <span className="text-[#A8A29E] text-xs mr-1.5">추출 가능</span>
          <span className="font-bold font-heading text-amber-400">
            {items.filter((i) => getExtractionStatus(i) === "pending").length}
          </span>
        </span>
        <span>
          <span className="text-[#A8A29E] text-xs mr-1.5">추출 불가</span>
          <span className="font-bold font-heading text-[#A8A29E]">
            {items.filter((i) => getExtractionStatus(i) === "unavailable").length}
          </span>
        </span>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <form onSubmit={handleSearch} className="flex-1 min-w-[200px]">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="제목, 요약, 핵심 주장 검색..."
            className="w-full px-3 py-2 rounded-lg border border-[#E7E5E4] bg-white text-sm
                       focus:outline-none focus:ring-2 focus:ring-[#C0F0FB] focus:border-transparent"
          />
        </form>
        <select
          value={memberFilter}
          onChange={(e) => setMemberFilter(e.target.value)}
          className="px-3 py-2 rounded-lg border border-[#E7E5E4] bg-white text-sm"
        >
          <option value="">전체 멤버</option>
          {ACTIVE_MEMBERS.map((m) => (
            <option key={m.id} value={m.id}>
              {m.displayName}
            </option>
          ))}
        </select>
        <select
          value={channelFilter}
          onChange={(e) => setChannelFilter(e.target.value)}
          className="px-3 py-2 rounded-lg border border-[#E7E5E4] bg-white text-sm"
        >
          <option value="">전체 채널</option>
          {(Object.entries(CHANNEL_LABELS) as [Channel, string][]).map(
            ([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            )
          )}
        </select>
        <select
          value={topicFilter}
          onChange={(e) => setTopicFilter(e.target.value)}
          className="px-3 py-2 rounded-lg border border-[#E7E5E4] bg-white text-sm"
        >
          <option value="">전체 토픽</option>
          {(Object.entries(TOPIC_LABELS) as [Topic, string][]).map(
            ([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            )
          )}
        </select>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <div className="w-10 h-10 border-3 border-[#C0F0FB] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-[#78716C]">로딩 중...</p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-sm text-[#A8A29E]">
            {search ? "검색 결과가 없습니다" : "발행된 콘텐츠가 없습니다"}
          </p>
        </div>
      ) : viewMode === "members" ? (
        /* ===== MEMBER VIEW ===== */
        <div className="space-y-8">
          {ACTIVE_MEMBERS.map((m) => {
            const memberItems = filteredItems.filter((i) => i.member === m.id);
            if (memberItems.length === 0) return null;
            const memberStatuses = memberItems.map(getExtractionStatus);
            const mExtracted = memberStatuses.filter((s) => s === "extracted").length;
            const mPending = memberStatuses.filter((s) => s === "pending").length;
            const mUnavailable = memberStatuses.filter((s) => s === "unavailable").length;
            const recentItems = memberItems.slice(0, 5);

            return (
              <div key={m.id}>
                {/* Member header */}
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#C0F0FB] to-[#7DD3FC] flex items-center justify-center text-[#1C1917] text-sm font-bold font-heading">
                    {m.displayName[0]}
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-[#1C1917] font-heading">
                      {m.displayName}
                    </h2>
                    <div className="flex items-center gap-2 text-[11px] text-[#78716C]">
                      <span>{memberItems.length}건</span>
                      {mExtracted > 0 && (
                        <>
                          <span>·</span>
                          <span className="text-emerald-600">{mExtracted} 추출</span>
                        </>
                      )}
                      {mPending > 0 && (
                        <>
                          <span>·</span>
                          <span className="text-amber-600">{mPending} 대기</span>
                        </>
                      )}
                      {mUnavailable > 0 && (
                        <>
                          <span>·</span>
                          <span className="text-[#A8A29E]">{mUnavailable} 불가</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Member insights */}
                {insights[m.id] && insights[m.id].suggestions.length > 0 && (
                  <div className="mb-3 p-3 rounded-xl bg-gradient-to-r from-[#FFFBEB] to-[#FEF3C7] border border-[#FDE68A]/50">
                    <h3 className="text-[10px] font-bold text-[#92400E] uppercase tracking-wider mb-2">
                      다음 글감 제안
                    </h3>
                    <div className="space-y-2.5">
                      {insights[m.id].suggestions.map((s, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <span className={`shrink-0 px-1.5 py-0.5 rounded text-[9px] font-medium mt-0.5 ${SUGGESTION_TYPE_CONFIG[s.type].color}`}>
                            {SUGGESTION_TYPE_CONFIG[s.type].label}
                          </span>
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-[#1C1917]">{s.topic}</p>
                            <p className="text-[11px] text-[#44403C] leading-relaxed mt-0.5">{s.detail}</p>
                            <p className="text-[10px] text-[#78716C] mt-0.5">사유: {s.reason}</p>
                            <p className="text-[9px] text-[#A8A29E] mt-0.5">← {s.source_title}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    <p className="text-[9px] text-[#A8A29E] mt-2">
                      {new Date(insights[m.id].generated_at).toLocaleDateString("ko-KR")} 분석
                    </p>
                  </div>
                )}

                {/* Member content cards */}
                <div className="space-y-2">
                  {recentItems.map((item) => {
                    const isExpanded = expandedId === item.id;
                    const itemStatus = getExtractionStatus(item);
                    const sc = STATUS_CONFIG[itemStatus];

                    return (
                      <div
                        key={item.id}
                        className="bg-white rounded-xl border border-[#E7E5E4] shadow-sm overflow-hidden"
                      >
                        <button
                          onClick={() =>
                            setExpandedId(isExpanded ? null : item.id)
                          }
                          className="w-full px-4 py-3 flex items-center gap-3 hover:bg-[#F9F7F4] transition-colors text-left"
                        >
                          <span
                            className={`w-2 h-2 rounded-full shrink-0 ${sc.dot}`}
                            title={sc.label}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-[#1C1917] truncate">
                              {item.title}
                            </div>
                            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                              <span className="text-[10px] text-[#A8A29E]">
                                {CHANNEL_LABELS[item.channel] || item.channel}
                              </span>
                              <span className="text-[10px] text-[#A8A29E]">
                                {item.published_at}
                              </span>
                              {item.topic?.map((t) => (
                                <span
                                  key={t}
                                  className="px-1.5 py-0.5 rounded text-[9px] bg-[#C0F0FB]/30 text-[#1C1917]"
                                >
                                  {TOPIC_LABELS[t]}
                                </span>
                              ))}
                            </div>
                          </div>
                          <span className="text-[#A8A29E] text-xs shrink-0">
                            {isExpanded ? "▲" : "▼"}
                          </span>
                        </button>

                        {isExpanded && (
                          <div className="px-4 pb-4 border-t border-[#E7E5E4]">
                            {itemStatus === "extracted" ? (
                              <div className="pt-3 space-y-3">
                                {item.summary && (
                                  <div>
                                    <h4 className="text-[10px] font-bold text-[#A8A29E] uppercase tracking-wider mb-1">
                                      요약
                                    </h4>
                                    <p className="text-sm text-[#44403C] leading-relaxed">
                                      {item.summary}
                                    </p>
                                  </div>
                                )}
                                {item.key_claims &&
                                  item.key_claims.length > 0 && (
                                    <div>
                                      <h4 className="text-[10px] font-bold text-[#A8A29E] uppercase tracking-wider mb-1">
                                        핵심 주장
                                      </h4>
                                      <ul className="space-y-1">
                                        {item.key_claims.map((claim, i) => (
                                          <li
                                            key={i}
                                            className="text-sm text-[#44403C] pl-3 border-l-2 border-[#C0F0FB]"
                                          >
                                            {claim}
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}
                                {item.url && (
                                  <a
                                    href={item.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-block text-xs text-[#78716C] hover:text-[#1C1917] underline underline-offset-2"
                                  >
                                    원문 보기 →
                                  </a>
                                )}
                              </div>
                            ) : itemStatus === "pending" ? (
                              <div className="pt-3 flex items-center gap-3">
                                <p className="text-sm text-[#A8A29E]">
                                  추출 가능한 콘텐츠입니다
                                </p>
                                <button
                                  onClick={() => handleExtract(item.id)}
                                  disabled={extractingId === item.id}
                                  className="px-3 py-1.5 rounded-lg bg-[#C0F0FB] text-[#1C1917] text-xs font-semibold
                                             hover:bg-[#7DD3FC] transition-colors disabled:opacity-50"
                                >
                                  {extractingId === item.id
                                    ? "추출 중..."
                                    : "추출하기"}
                                </button>
                              </div>
                            ) : (
                              <div className="pt-3 flex items-center gap-3">
                                <p className="text-sm text-[#A8A29E]">
                                  {!item.url ? "URL 없음 — 추출 불가" : `${CHANNEL_LABELS[item.channel] || item.channel} 채널은 자동 추출 미지원`}
                                </p>
                                {item.url && (
                                  <a
                                    href={item.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-[#78716C] hover:text-[#1C1917] underline underline-offset-2"
                                  >
                                    원문 보기 →
                                  </a>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {memberItems.length > 5 && (
                    <button
                      onClick={() => {
                        setMemberFilter(m.id);
                        setViewMode("list");
                      }}
                      className="w-full py-2 text-xs text-[#78716C] hover:text-[#44403C] transition-colors font-medium"
                    >
                      +{memberItems.length - 5}건 더보기
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ===== LIST VIEW ===== */
        <div className="space-y-2">
          {filteredItems.map((item) => {
            const member = getMember(item.member);
            const isExpanded = expandedId === item.id;
            const itemStatus = getExtractionStatus(item);
            const sc = STATUS_CONFIG[itemStatus];

            return (
              <div
                key={item.id}
                className="bg-white rounded-2xl border border-[#E7E5E4] shadow-sm overflow-hidden"
              >
                <button
                  onClick={() => setExpandedId(isExpanded ? null : item.id)}
                  className="w-full px-4 py-3 flex items-center gap-3 hover:bg-[#F9F7F4] transition-colors text-left"
                >
                  <span
                    className={`w-2 h-2 rounded-full shrink-0 ${sc.dot}`}
                    title={sc.label}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-[#1C1917] truncate">
                      {item.title}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className="text-[11px] text-[#78716C]">
                        {member?.displayName || item.member}
                      </span>
                      <span className="text-[10px] text-[#A8A29E]">
                        {CHANNEL_LABELS[item.channel] || item.channel}
                      </span>
                      <span className="text-[10px] text-[#A8A29E]">
                        {CONTENT_TYPE_LABELS[item.content_type]?.replace(
                          / \(\d+pt\)/,
                          ""
                        )}
                      </span>
                      <span className="text-[10px] text-[#A8A29E]">
                        {item.published_at}
                      </span>
                      {item.topic?.map((t) => (
                        <span
                          key={t}
                          className="px-1.5 py-0.5 rounded text-[9px] bg-[#C0F0FB]/30 text-[#1C1917]"
                        >
                          {TOPIC_LABELS[t]}
                        </span>
                      ))}
                    </div>
                  </div>
                  <span className="text-[#A8A29E] text-xs shrink-0">
                    {isExpanded ? "▲" : "▼"}
                  </span>
                </button>

                {isExpanded && (
                  <div className="px-4 pb-4 border-t border-[#E7E5E4]">
                    {itemStatus === "extracted" ? (
                      <div className="pt-3 space-y-3">
                        {item.summary && (
                          <div>
                            <h4 className="text-[10px] font-bold text-[#A8A29E] uppercase tracking-wider mb-1">
                              요약
                            </h4>
                            <p className="text-sm text-[#44403C] leading-relaxed">
                              {item.summary}
                            </p>
                          </div>
                        )}
                        {item.key_claims && item.key_claims.length > 0 && (
                          <div>
                            <h4 className="text-[10px] font-bold text-[#A8A29E] uppercase tracking-wider mb-1">
                              핵심 주장
                            </h4>
                            <ul className="space-y-1">
                              {item.key_claims.map((claim, i) => (
                                <li
                                  key={i}
                                  className="text-sm text-[#44403C] pl-3 border-l-2 border-[#C0F0FB]"
                                >
                                  {claim}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {item.url && (
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-block text-xs text-[#78716C] hover:text-[#1C1917] underline underline-offset-2"
                          >
                            원문 보기 →
                          </a>
                        )}
                      </div>
                    ) : itemStatus === "pending" ? (
                      <div className="pt-3 flex items-center gap-3">
                        <p className="text-sm text-[#A8A29E]">
                          추출 가능한 콘텐츠입니다
                        </p>
                        <button
                          onClick={() => handleExtract(item.id)}
                          disabled={extractingId === item.id}
                          className="px-3 py-1.5 rounded-lg bg-[#C0F0FB] text-[#1C1917] text-xs font-semibold
                                     hover:bg-[#7DD3FC] transition-colors disabled:opacity-50"
                        >
                          {extractingId === item.id ? "추출 중..." : "추출하기"}
                        </button>
                      </div>
                    ) : (
                      <div className="pt-3 flex items-center gap-3">
                        <p className="text-sm text-[#A8A29E]">
                          {!item.url ? "URL 없음 — 추출 불가" : `${CHANNEL_LABELS[item.channel] || item.channel} 채널은 자동 추출 미지원`}
                        </p>
                        {item.url && (
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-[#78716C] hover:text-[#1C1917] underline underline-offset-2"
                          >
                            원문 보기 →
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
