"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MEMBERS } from "@/lib/members";
import {
  CONTENT_TYPE_LABELS,
  CHANNEL_LABELS,
  type ContentType,
  type Channel,
} from "@/lib/scoring";

export default function AddContentPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [form, setForm] = useState({
    member: "",
    title: "",
    url: "",
    channel: "" as Channel | "",
    content_type: "" as ContentType | "",
    published_at: new Date().toISOString().split("T")[0],
  });

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
          콘텐츠가 추가되었습니다
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

      <form onSubmit={handleSubmit} className="space-y-4">
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

        {/* URL */}
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
            채널 *
          </label>
          <select
            required
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
            콘텐츠 유형 *
          </label>
          <select
            required
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
            발행일 *
          </label>
          <input
            required
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
            {submitting ? "추가 중..." : "콘텐츠 추가"}
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
