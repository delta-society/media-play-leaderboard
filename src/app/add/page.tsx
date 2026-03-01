"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MEMBERS } from "@/lib/members";
import {
  CONTENT_TYPE_LABELS,
  CHANNEL_LABELS,
  type ContentType,
  type Channel,
  type ContentStatus,
} from "@/lib/scoring";

export default function AddContentPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [analyzed, setAnalyzed] = useState(false);
  const [analysisInfo, setAnalysisInfo] = useState<string | null>(null);

  const [urlInput, setUrlInput] = useState("");
  const [form, setForm] = useState({
    member: "",
    title: "",
    url: "",
    channel: "" as Channel | "",
    content_type: "" as ContentType | "",
    published_at: new Date().toISOString().split("T")[0],
    status: "published" as ContentStatus,
  });

  const isPublished = form.status === "published";

  async function handleAnalyze() {
    if (!urlInput.trim()) return;
    setError(null);
    setAnalyzing(true);
    setAnalyzed(false);
    setAnalysisInfo(null);

    try {
      const res = await fetch("/api/analyze-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: urlInput.trim() }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "분석 실패");
      }

      const data = await res.json();

      setForm({
        ...form,
        url: urlInput.trim(),
        title: data.title || form.title,
        channel: data.channel || form.channel,
        content_type: data.content_type || form.content_type,
      });

      setAnalyzed(true);

      // Build info string
      const parts = [];
      parts.push(`${data.charCount.toLocaleString()}자`);
      if (data.isVideo) parts.push("영상");
      setAnalysisInfo(parts.join(" · "));
    } catch (err) {
      setError(err instanceof Error ? err.message : "분석 실패");
    }
    setAnalyzing(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch("/api/content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to add content");
      }

      setSuccess(true);
      setTimeout(() => {
        router.push("/");
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "알 수 없는 오류");
    }
    setSubmitting(false);
  }

  if (success) {
    return (
      <div className="max-w-lg mx-auto py-20 text-center">
        <div className="text-4xl mb-4">&#10003;</div>
        <h2 className="text-xl font-semibold text-[#1C1917] font-heading mb-2">
          {isPublished ? "콘텐츠가 추가되었습니다" : "파이프라인에 등록되었습니다"}
        </h2>
        <p className="text-sm text-[#78716C]">리더보드로 이동 중...</p>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-2xl font-bold text-[#1C1917] font-heading mb-6">
        콘텐츠 추가
      </h1>

      {/* URL Auto-Analyze */}
      <div className="mb-6 p-4 rounded-xl bg-[#F9F7F4] border border-[#E7E5E4]">
        <label className="block text-sm font-medium text-[#44403C] mb-2">
          링크로 자동 분석
        </label>
        <div className="flex gap-2">
          <input
            type="url"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAnalyze();
              }
            }}
            placeholder="URL을 붙여넣으세요"
            className="flex-1 px-3 py-2 rounded-lg border border-[#E7E5E4] bg-white text-sm
                       focus:outline-none focus:ring-2 focus:ring-[#C0F0FB]"
          />
          <button
            type="button"
            onClick={handleAnalyze}
            disabled={analyzing || !urlInput.trim()}
            className="px-4 py-2 rounded-lg bg-[#1C1917] text-white text-sm font-medium
                       hover:bg-[#44403C] transition-colors disabled:opacity-50 shrink-0"
          >
            {analyzing ? "분석중..." : "분석"}
          </button>
        </div>
        {analyzed && analysisInfo && (
          <div className="mt-2 flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[11px] font-bold">
              AUTO
            </span>
            <span className="text-xs text-[#78716C]">
              {analysisInfo} — 아래에서 확인 후 제출하세요
            </span>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Status tabs */}
        <div className="flex gap-1 p-1 rounded-lg bg-[#F5F5F4]">
          {([
            { value: "published", label: "발행 완료" },
            { value: "writing", label: "작성중" },
            { value: "idea", label: "소재" },
          ] as { value: ContentStatus; label: string }[]).map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setForm({ ...form, status: opt.value })}
              className={`flex-1 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                form.status === opt.value
                  ? "bg-white text-[#1C1917] shadow-sm"
                  : "text-[#78716C] hover:text-[#44403C]"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Member */}
        <div>
          <label className="block text-sm font-medium text-[#44403C] mb-1">
            멤버 *
          </label>
          <select
            required
            value={form.member}
            onChange={(e) => setForm({ ...form, member: e.target.value })}
            className="w-full px-3 py-2 rounded-lg border border-[#E7E5E4] bg-white text-sm
                       focus:outline-none focus:ring-2 focus:ring-[#C0F0FB]"
          >
            <option value="">선택...</option>
            {MEMBERS.map((m) => (
              <option key={m.id} value={m.id}>
                {m.displayName} (@{m.id})
              </option>
            ))}
          </select>
        </div>

        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-[#44403C] mb-1">
            제목 *
          </label>
          <input
            required
            type="text"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="콘텐츠 제목"
            className="w-full px-3 py-2 rounded-lg border border-[#E7E5E4] bg-white text-sm
                       focus:outline-none focus:ring-2 focus:ring-[#C0F0FB]"
          />
        </div>

        {/* URL (hidden if auto-analyzed, shown otherwise) */}
        <div>
          <label className="block text-sm font-medium text-[#44403C] mb-1">
            URL
          </label>
          <input
            type="url"
            value={form.url}
            onChange={(e) => setForm({ ...form, url: e.target.value })}
            placeholder="https://..."
            className="w-full px-3 py-2 rounded-lg border border-[#E7E5E4] bg-white text-sm
                       focus:outline-none focus:ring-2 focus:ring-[#C0F0FB]"
          />
        </div>

        {/* Channel */}
        <div>
          <label className="block text-sm font-medium text-[#44403C] mb-1">
            채널 {isPublished && "*"}
          </label>
          <select
            required={isPublished}
            value={form.channel}
            onChange={(e) =>
              setForm({ ...form, channel: e.target.value as Channel })
            }
            className="w-full px-3 py-2 rounded-lg border border-[#E7E5E4] bg-white text-sm
                       focus:outline-none focus:ring-2 focus:ring-[#C0F0FB]"
          >
            <option value="">선택...</option>
            {(Object.entries(CHANNEL_LABELS) as [Channel, string][]).map(
              ([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              )
            )}
          </select>
        </div>

        {/* Content Type */}
        <div>
          <label className="block text-sm font-medium text-[#44403C] mb-1">
            콘텐츠 유형 {isPublished && "*"}
          </label>
          <select
            required={isPublished}
            value={form.content_type}
            onChange={(e) =>
              setForm({
                ...form,
                content_type: e.target.value as ContentType,
              })
            }
            className="w-full px-3 py-2 rounded-lg border border-[#E7E5E4] bg-white text-sm
                       focus:outline-none focus:ring-2 focus:ring-[#C0F0FB]"
          >
            <option value="">선택...</option>
            {(
              Object.entries(CONTENT_TYPE_LABELS) as [ContentType, string][]
            ).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </div>

        {/* Published Date */}
        <div>
          <label className="block text-sm font-medium text-[#44403C] mb-1">
            {isPublished ? "발행일 *" : "예정일"}
          </label>
          <input
            required={isPublished}
            type="date"
            value={form.published_at}
            onChange={(e) =>
              setForm({ ...form, published_at: e.target.value })
            }
            className="w-full px-3 py-2 rounded-lg border border-[#E7E5E4] bg-white text-sm
                       focus:outline-none focus:ring-2 focus:ring-[#C0F0FB]"
          />
        </div>

        {/* Error */}
        {error && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Submit */}
        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 px-4 py-2.5 rounded-lg bg-[#C0F0FB] text-[#1C1917] font-medium text-sm
                       hover:bg-[#FFEA00] transition-colors disabled:opacity-50"
          >
            {submitting
              ? "추가 중..."
              : isPublished
                ? "콘텐츠 추가"
                : form.status === "writing"
                  ? "작성중 등록"
                  : "소재 등록"}
          </button>
          <a
            href="/"
            className="px-4 py-2.5 rounded-lg border border-[#E7E5E4] text-[#44403C] text-sm
                       hover:bg-[#F9F7F4] transition-colors text-center"
          >
            취소
          </a>
        </div>
      </form>
    </div>
  );
}
