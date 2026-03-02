"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  CONTENT_TYPE_LABELS,
  CHANNEL_LABELS,
  TOPIC_LABELS,
  type ContentItem,
  type ContentType,
  type Channel,
  type ContentStatus,
  type Topic,
} from "@/lib/scoring";

export default function EditContentPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [form, setForm] = useState({
    title: "",
    channel: "" as Channel | "",
    content_type: "" as ContentType | "",
    status: "idea" as ContentStatus,
    target_date: "",
    topic: [] as Topic[],
  });

  useEffect(() => {
    async function fetchItem() {
      try {
        const res = await fetch(`/api/content/${id}`);
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        const item: ContentItem = data.item;
        setForm({
          title: item.title || "",
          channel: item.channel || "",
          content_type: item.content_type || "",
          status: item.status,
          target_date: item.target_date || "",
          topic: item.topic || [],
        });
      } catch {
        setError("콘텐츠를 불러올 수 없습니다");
      }
      setLoading(false);
    }
    fetchItem();
  }, [id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch(`/api/content/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          channel: form.channel || undefined,
          content_type: form.content_type || undefined,
          status: form.status,
          target_date: form.target_date || "",
          topic: form.topic,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "수정 실패");
      }

      setSuccess(true);
      setTimeout(() => router.push("/"), 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "알 수 없는 오류");
    }
    setSubmitting(false);
  }

  if (loading) {
    return (
      <div className="max-w-lg mx-auto py-20 text-center">
        <div className="w-8 h-8 border-3 border-[#C0F0FB] border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm text-[#78716C] mt-3">로딩 중...</p>
      </div>
    );
  }

  if (success) {
    return (
      <div className="max-w-lg mx-auto py-20 text-center">
        <div className="text-4xl mb-4">&#10003;</div>
        <h2 className="text-xl font-semibold text-[#1C1917] font-heading mb-2">
          수정 완료
        </h2>
        <p className="text-sm text-[#78716C]">리더보드로 이동 중...</p>
      </div>
    );
  }

  const isPipeline = form.status === "idea";

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-2xl font-bold text-[#1C1917] font-heading mb-6">
        파이프라인 수정
      </h1>

      <form onSubmit={handleSubmit} className="space-y-4">
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
            className="w-full px-3 py-2 rounded-lg border border-[#E7E5E4] bg-white text-sm
                       focus:outline-none focus:ring-2 focus:ring-[#C0F0FB]"
          />
        </div>

        {/* Channel */}
        <div>
          <label className="block text-sm font-medium text-[#44403C] mb-1">
            채널
          </label>
          <select
            value={form.channel}
            onChange={(e) => setForm({ ...form, channel: e.target.value as Channel })}
            className="w-full px-3 py-2 rounded-lg border border-[#E7E5E4] bg-white text-sm
                       focus:outline-none focus:ring-2 focus:ring-[#C0F0FB]"
          >
            <option value="">선택...</option>
            {(Object.entries(CHANNEL_LABELS) as [Channel, string][]).map(
              ([key, label]) => (
                <option key={key} value={key}>{label}</option>
              )
            )}
          </select>
        </div>

        {/* Content Type */}
        <div>
          <label className="block text-sm font-medium text-[#44403C] mb-1">
            콘텐츠 유형
          </label>
          <select
            value={form.content_type}
            onChange={(e) => setForm({ ...form, content_type: e.target.value as ContentType })}
            className="w-full px-3 py-2 rounded-lg border border-[#E7E5E4] bg-white text-sm
                       focus:outline-none focus:ring-2 focus:ring-[#C0F0FB]"
          >
            <option value="">선택...</option>
            {(Object.entries(CONTENT_TYPE_LABELS) as [ContentType, string][]).map(
              ([key, label]) => (
                <option key={key} value={key}>{label}</option>
              )
            )}
          </select>
        </div>

        {/* Target Date */}
        {isPipeline && (
          <div>
            <label className="block text-sm font-medium text-[#44403C] mb-1">
              목표일
            </label>
            <input
              type="date"
              value={form.target_date}
              onChange={(e) => setForm({ ...form, target_date: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-[#E7E5E4] bg-white text-sm
                         focus:outline-none focus:ring-2 focus:ring-[#C0F0FB]"
            />
          </div>
        )}

        {/* Topic */}
        <div>
          <label className="block text-sm font-medium text-[#44403C] mb-2">
            토픽
          </label>
          <div className="flex flex-wrap gap-2">
            {(Object.entries(TOPIC_LABELS) as [Topic, string][]).map(([key, label]) => {
              const selected = form.topic.includes(key);
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => {
                    setForm({
                      ...form,
                      topic: selected
                        ? form.topic.filter((t) => t !== key)
                        : [...form.topic, key],
                    });
                  }}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    selected
                      ? "bg-[#1C1917] text-white"
                      : "bg-[#F5F5F4] text-[#78716C] hover:bg-[#E7E5E4]"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Buttons */}
        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 px-4 py-2.5 rounded-lg bg-[#C0F0FB] text-[#1C1917] font-medium text-sm
                       hover:bg-[#FFEA00] transition-colors disabled:opacity-50"
          >
            {submitting ? "저장 중..." : "저장"}
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
