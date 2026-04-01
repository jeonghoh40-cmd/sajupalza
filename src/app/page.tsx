"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { BIRTH_HOURS } from "@/lib/types";

const MBTI_TYPES = [
  "INTJ", "INTP", "ENTJ", "ENTP",
  "INFJ", "INFP", "ENFJ", "ENFP",
  "ISTJ", "ISFJ", "ESTJ", "ESFJ",
  "ISTP", "ISFP", "ESTP", "ESFP",
] as const;

export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    birthYear: "",
    birthMonth: "",
    birthDay: "",
    birthHour: "6",
    calendarType: "solar" as "solar" | "lunar",
    gender: "male" as "male" | "female",
    koreanName: "",
    englishName: "",
    mbtiType: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!form.birthYear || !form.birthMonth || !form.birthDay || !form.koreanName) {
      setError("필수 항목을 모두 입력해주세요.");
      return;
    }

    setLoading(true);

    try {
      const birthDate = `${form.birthYear}-${form.birthMonth.padStart(2, "0")}-${form.birthDay.padStart(2, "0")}`;
      const hourIndex = parseInt(form.birthHour);
      const birthHourNum = hourIndex === 0 ? 0 : hourIndex * 2 + 1;

      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          birthDate,
          birthHour: birthHourNum,
          calendarType: form.calendarType,
          gender: form.gender,
          koreanName: form.koreanName,
          englishName: form.englishName || undefined,
          mbtiType: form.mbtiType || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "분석에 실패했습니다.");
      }

      const result = await res.json();
      sessionStorage.setItem("analysisResult", JSON.stringify(result));
      sessionStorage.setItem(
        "analysisInput",
        JSON.stringify({
          birthDate,
          birthHour: BIRTH_HOURS[hourIndex]?.label,
          calendarType: form.calendarType,
          gender: form.gender,
          koreanName: form.koreanName,
        })
      );
      router.push("/result");
    } catch (err) {
      setError(err instanceof Error ? err.message : "오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center px-4 py-6 sm:py-8 safe-area-inset">
      {/* 헤더 */}
      <div className="text-center mb-6 sm:mb-8 mt-4">
        <h1 className="text-2xl sm:text-3xl font-bold mb-2 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
          사주팔자
        </h1>
        <p className="text-[var(--muted)] text-sm">
          4개의 도시가 당신을 분석합니다
        </p>
        <p className="text-[var(--muted)] text-xs mt-1 px-4">
          사주 · 자미두수 · 수비학 · MBTI 교차검증으로 당신만의 운명 캐릭터카드를 만들어 드립니다
        </p>
      </div>

      {/* 아이콘 */}
      <div className="w-14 h-14 sm:w-16 sm:h-16 mb-5 sm:mb-6 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center text-2xl sm:text-3xl shadow-lg shadow-purple-900/50">
        🔮
      </div>

      {/* 폼 카드 */}
      <div className="w-full max-w-md">
        <div className="bg-[var(--surface)] rounded-2xl p-5 sm:p-6 border border-[var(--border)] shadow-xl">
          <h2 className="text-base sm:text-lg font-semibold text-center mb-1">운명 정보 입력</h2>
          <p className="text-[var(--muted)] text-xs text-center mb-5 sm:mb-6">
            정확한 분석을 위해 생년월일과 출생 시간을 입력해주세요
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* 이름 */}
            <div>
              <label className="block text-sm mb-1.5 text-[var(--muted)]">이름 (한글) *</label>
              <input
                type="text"
                placeholder="홍길동"
                value={form.koreanName}
                onChange={(e) => setForm({ ...form, koreanName: e.target.value })}
                className="w-full px-4 py-3 sm:py-2.5 rounded-lg text-sm"
              />
            </div>

            {/* 영문 이름 */}
            <div>
              <label className="block text-sm mb-1.5 text-[var(--muted)]">이름 (영문)</label>
              <input
                type="text"
                placeholder="Hong Gildong"
                value={form.englishName}
                onChange={(e) => setForm({ ...form, englishName: e.target.value })}
                className="w-full px-4 py-3 sm:py-2.5 rounded-lg text-sm"
              />
            </div>

            {/* 생년월일 */}
            <div>
              <label className="block text-sm mb-1.5 text-[var(--muted)]">생년월일 *</label>
              <div className="grid grid-cols-2 gap-2 mb-2">
                {(["solar", "lunar"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setForm({ ...form, calendarType: t })}
                    style={{
                      WebkitAppearance: "none",
                      background: form.calendarType === t ? "#9333ea" : "#252240",
                      color: form.calendarType === t ? "#ffffff" : "#8b85a8",
                      border: form.calendarType === t ? "1px solid #9333ea" : "1px solid #2d2a45",
                    }}
                    className="py-2.5 rounded-lg text-sm font-medium transition-all"
                  >
                    {t === "solar" ? "☀ 양력" : "☽ 음력"}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-3 gap-2">
                <input
                  type="number"
                  placeholder="년"
                  min="1900"
                  max="2100"
                  value={form.birthYear}
                  onChange={(e) => setForm({ ...form, birthYear: e.target.value })}
                  className="w-full px-3 sm:px-4 py-3 sm:py-2.5 rounded-lg text-sm"
                />
                <select
                  value={form.birthMonth}
                  onChange={(e) => setForm({ ...form, birthMonth: e.target.value })}
                  className="w-full px-3 sm:px-4 py-3 sm:py-2.5 rounded-lg text-sm appearance-none"
                >
                  <option value="">월</option>
                  {Array.from({ length: 12 }, (_, i) => (
                    <option key={i + 1} value={String(i + 1)}>{i + 1}월</option>
                  ))}
                </select>
                <select
                  value={form.birthDay}
                  onChange={(e) => setForm({ ...form, birthDay: e.target.value })}
                  className="w-full px-3 sm:px-4 py-3 sm:py-2.5 rounded-lg text-sm appearance-none"
                >
                  <option value="">일</option>
                  {Array.from({ length: 31 }, (_, i) => (
                    <option key={i + 1} value={String(i + 1)}>{i + 1}일</option>
                  ))}
                </select>
              </div>
            </div>

            {/* 출생 시간 */}
            <div>
              <label className="block text-sm mb-1.5 text-[var(--muted)]">출생 시간 *</label>
              <select
                value={form.birthHour}
                onChange={(e) => setForm({ ...form, birthHour: e.target.value })}
                className="w-full px-4 py-3 sm:py-2.5 rounded-lg text-sm appearance-none"
              >
                {BIRTH_HOURS.map((h) => (
                  <option key={h.value} value={h.value}>
                    {h.label} ({h.range})
                  </option>
                ))}
              </select>
            </div>

            {/* 성별 */}
            <div>
              <label className="block text-sm mb-1.5 text-[var(--muted)]">성별 *</label>
              <div className="grid grid-cols-2 gap-2">
                {(["male", "female"] as const).map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setForm({ ...form, gender: g })}
                    className={`py-3 sm:py-2.5 rounded-lg text-sm font-medium transition-all ${
                      form.gender === g
                        ? "bg-purple-600 text-white shadow-lg shadow-purple-900/30"
                        : "bg-[var(--surface-light)] text-[var(--muted)] hover:text-white"
                    }`}
                  >
                    {g === "male" ? "남" : "여"}
                  </button>
                ))}
              </div>
            </div>

            {/* MBTI */}
            <div>
              <label className="block text-sm mb-1.5 text-[var(--muted)]">MBTI (선택)</label>
              <select
                value={form.mbtiType}
                onChange={(e) => setForm({ ...form, mbtiType: e.target.value })}
                className="w-full px-4 py-3 sm:py-2.5 rounded-lg text-sm appearance-none"
              >
                <option value="">모름 / 선택 안함</option>
                {MBTI_TYPES.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            {error && (
              <div className="bg-red-900/30 border border-red-800 text-red-300 text-sm px-4 py-2.5 rounded-lg">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 sm:py-3 rounded-xl text-sm font-semibold transition-all bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white shadow-lg shadow-purple-900/30 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <LoadingSpinner />
                  운명을 분석하고 있습니다...
                </span>
              ) : (
                "나의 운명 캐릭터 카드 만들기 →"
              )}
            </button>
          </form>
        </div>
      </div>

      {loading && <LoadingOverlay />}
    </main>
  );
}

function LoadingSpinner() {
  return (
    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

function LoadingOverlay() {
  const steps = [
    "사주팔자를 풀어보고 있습니다...",
    "자미두수 명반을 배치하고 있습니다...",
    "수비학 운명수를 계산하고 있습니다...",
    "네 가지 운명을 교차검증하고 있습니다...",
  ];

  const [step, setStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setStep((prev) => (prev + 1) % steps.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--surface)] rounded-2xl p-6 sm:p-8 max-w-sm w-full text-center border border-[var(--border)]">
        <div className="text-5xl mb-4 animate-pulse">🔮</div>
        <p className="text-lg font-semibold mb-2">분석 중</p>
        <p className="text-[var(--muted)] text-sm animate-pulse">{steps[step]}</p>
        <div className="mt-4 w-full bg-[var(--surface-light)] rounded-full h-1.5 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-purple-600 to-pink-600 rounded-full transition-all duration-1000"
            style={{ width: `${((step + 1) / steps.length) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}
