"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { AnalysisResponse } from "@/lib/types";

export default function ResultPage() {
  const router = useRouter();
  const [result, setResult] = useState<AnalysisResponse | null>(null);
  const [input, setInput] = useState<Record<string, string> | null>(null);
  const [openSection, setOpenSection] = useState<string | null>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem("analysisResult");
    const storedInput = sessionStorage.getItem("analysisInput");
    if (!stored) {
      router.push("/");
      return;
    }
    setResult(JSON.parse(stored));
    if (storedInput) setInput(JSON.parse(storedInput));
  }, [router]);

  if (!result) return null;

  const { characterCard: card, crossCheck, saju, ziwei, numerology, mbti, yearlyFortune, monthlyGuide } = result;

  const toggleSection = (section: string) => {
    setOpenSection(openSection === section ? null : section);
  };

  return (
    <main className="min-h-screen flex flex-col items-center px-4 py-6 sm:py-8 safe-area-inset">
      {/* 뒤로가기 */}
      <div className="w-full max-w-lg mb-3 sm:mb-4">
        <button
          onClick={() => router.push("/")}
          className="text-[var(--muted)] text-sm hover:text-white transition-colors"
        >
          ← 다시 분석하기
        </button>
      </div>

      {/* 캐릭터카드 메인 */}
      <div className="w-full max-w-lg">
        <div
          className="rounded-2xl p-4 sm:p-6 border border-[var(--border)] shadow-2xl"
          style={{
            background: `linear-gradient(135deg, var(--surface) 0%, ${card.dominantColor}15 100%)`,
          }}
        >
          {/* 아키타입 */}
          <div className="text-center mb-6">
            <div className="text-4xl mb-3">🔮</div>
            <h1 className="text-xl sm:text-2xl font-bold mb-1">{card.archetype}</h1>
            <p className="text-[var(--muted)] text-sm">{card.title}</p>
            {input && (
              <p className="text-[var(--muted)] text-xs mt-2">
                {input.koreanName} · {input.birthDate} ({input.calendarType === "lunar" ? "음력" : "양력"}) · {input.birthHour}
              </p>
            )}
          </div>

          {/* 핵심 특성 태그 */}
          <div className="flex flex-wrap justify-center gap-2 mb-6">
            {(card.coreTraits ?? []).map((trait) => (
              <span
                key={trait}
                className="px-3 py-1 rounded-full text-xs font-medium border"
                style={{
                  borderColor: card.dominantColor,
                  color: card.dominantColor,
                  backgroundColor: `${card.dominantColor}15`,
                }}
              >
                {trait}
              </span>
            ))}
          </div>

          {/* 강점 / 약점 */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <h3 className="text-sm font-semibold text-green-400 mb-2">강점</h3>
              <ul className="space-y-1">
                {(card.strengths ?? []).map((s) => (
                  <li key={s} className="text-sm text-[var(--foreground)]">· {s}</li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-orange-400 mb-2">약점</h3>
              <ul className="space-y-1">
                {(card.weaknesses ?? []).map((w) => (
                  <li key={w} className="text-sm text-[var(--foreground)]">· {w}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* 숨겨진 면 */}
          {card.hiddenSide && (
            <div className="bg-[var(--surface-light)] rounded-xl p-4 mb-6 border border-[var(--border)]">
              <h3 className="text-sm font-semibold text-purple-400 mb-1">숨겨진 면</h3>
              <p className="text-sm text-[var(--muted)]">{card.hiddenSide}</p>
            </div>
          )}

          {/* 교차검증 일치도 */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-[var(--muted)]">시스템 일치도</span>
              <span className="text-sm font-semibold">{crossCheck.agreementScore}%</span>
            </div>
            <div className="w-full bg-[var(--surface-light)] rounded-full h-2 overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${crossCheck.agreementScore}%`,
                  background: `linear-gradient(to right, ${card.dominantColor}, #ec4899)`,
                }}
              />
            </div>
          </div>

          {/* 갈등 지점 */}
          {crossCheck.tensions.length > 0 && (
            <div className="space-y-2 mb-6">
              <h3 className="text-sm font-semibold text-[var(--muted)]">교차검증 인사이트</h3>
              {crossCheck.tensions.map((t, i) => (
                <div
                  key={i}
                  className="bg-[var(--surface-light)] rounded-lg p-3 border border-[var(--border)]"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs">
                      {t.type === "latent" && "🔹"}
                      {t.type === "developed" && "🔸"}
                      {t.type === "duality" && "⚡"}
                      {t.type === "tension" && "🌀"}
                    </span>
                    <span className="text-xs font-medium text-purple-400">
                      {t.trait}
                    </span>
                    <span className="text-xs text-[var(--muted)]">
                      {t.type === "latent" && "잠재 특성"}
                      {t.type === "developed" && "개발된 특성"}
                      {t.type === "duality" && "이중성"}
                      {t.type === "tension" && "내적 긴장"}
                    </span>
                  </div>
                  <p className="text-xs text-[var(--muted)]">{t.description}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 시스템별 상세 (접이식) */}
        <div className="mt-4 space-y-2">
          <AccordionSection
            title="사주팔자"
            icon="📜"
            isOpen={openSection === "saju"}
            onToggle={() => toggleSection("saju")}
          >
            <div className="grid grid-cols-4 gap-2 mb-3">
              {(["year", "month", "day", "hour"] as const).map((pillar) => (
                <div key={pillar} className="text-center">
                  <div className="text-xs text-[var(--muted)] mb-1">
                    {pillar === "year" ? "년주" : pillar === "month" ? "월주" : pillar === "day" ? "일주" : "시주"}
                  </div>
                  <div className="bg-[var(--surface)] rounded-lg p-2 border border-[var(--border)]">
                    <div className="text-lg font-bold">{saju.fourPillars[pillar].stem}</div>
                    <div className="text-lg">{saju.fourPillars[pillar].branch}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="space-y-2 text-sm">
              <div><span className="text-[var(--muted)]">일간:</span> {saju.dayMaster}</div>
              <div><span className="text-[var(--muted)]">용신:</span> {saju.usefulGod}</div>
              <div>
                <span className="text-[var(--muted)]">오행 분포:</span>{" "}
                목{saju.fiveElements.wood} 화{saju.fiveElements.fire} 토{saju.fiveElements.earth} 금{saju.fiveElements.metal} 수{saju.fiveElements.water}
              </div>
              <p className="text-[var(--muted)] mt-2">{saju.summary}</p>
            </div>
          </AccordionSection>

          <AccordionSection
            title="자미두수"
            icon="⭐"
            isOpen={openSection === "ziwei"}
            onToggle={() => toggleSection("ziwei")}
          >
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-[var(--muted)]">명궁:</span> {ziwei.lifePalace.position} —{" "}
                {(ziwei.lifePalace.mainStars ?? []).join(", ")}
                {" "}({(ziwei.lifePalace.brightness ?? []).join(", ")})
              </div>
              <div><span className="text-[var(--muted)]">신궁:</span> {ziwei.bodyPalace}</div>
              <div><span className="text-[var(--muted)]">오행국:</span> {ziwei.fiveElementBureau}</div>
              <div>
                <span className="text-[var(--muted)]">사화:</span>{" "}
                록({ziwei.fourTransformations.lu}) 권({ziwei.fourTransformations.quan}) 과({ziwei.fourTransformations.ke}) 기({ziwei.fourTransformations.ji})
              </div>
              <div className="mt-2">
                <div className="text-[var(--muted)] mb-1">주요 궁:</div>
                <div className="pl-2 space-y-1">
                  <div>관록궁: {(ziwei.keyPalaces.career.stars ?? []).join(", ")} — {ziwei.keyPalaces.career.reading}</div>
                  <div>재백궁: {(ziwei.keyPalaces.wealth.stars ?? []).join(", ")} — {ziwei.keyPalaces.wealth.reading}</div>
                  <div>부처궁: {(ziwei.keyPalaces.spouse.stars ?? []).join(", ")} — {ziwei.keyPalaces.spouse.reading}</div>
                </div>
              </div>
              <p className="text-[var(--muted)] mt-2">{ziwei.summary}</p>
            </div>
          </AccordionSection>

          <AccordionSection
            title="수비학 (Numerology)"
            icon="🔢"
            isOpen={openSection === "numerology"}
            onToggle={() => toggleSection("numerology")}
          >
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mb-3">
              {([
                { key: "lifePath", label: "생명수" },
                { key: "expression", label: "표현수" },
                { key: "soulUrge", label: "영혼수" },
                { key: "personality", label: "인격수" },
                { key: "birthday", label: "생일수" },
              ] as const).map(({ key, label }) => (
                <div key={key} className="text-center">
                  <div className="text-xs text-[var(--muted)] mb-1">{label}</div>
                  <div className="bg-[var(--surface)] rounded-lg p-2 border border-[var(--border)]">
                    <div className="text-xl font-bold text-purple-400">
                      {numerology[key].number}
                    </div>
                  </div>
                  <div className="text-xs text-[var(--muted)] mt-1 line-clamp-2">
                    {numerology[key].meaning}
                  </div>
                </div>
              ))}
            </div>
            <p className="text-sm text-[var(--muted)]">{numerology.summary}</p>
          </AccordionSection>

          <AccordionSection
            title={`MBTI (${mbti.type})`}
            icon="🧠"
            isOpen={openSection === "mbti"}
            onToggle={() => toggleSection("mbti")}
          >
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-[var(--muted)]">인지기능:</span>{" "}
                {mbti.cognitiveStack?.join(" → ") ?? "-"}
              </div>
              <div className="grid grid-cols-2 gap-3 mt-2">
                <div>
                  <div className="text-green-400 text-xs font-medium mb-1">강점</div>
                  {(mbti.strengths ?? []).map((s) => (
                    <div key={s} className="text-xs">· {s}</div>
                  ))}
                </div>
                <div>
                  <div className="text-orange-400 text-xs font-medium mb-1">약점</div>
                  {(mbti.weaknesses ?? []).map((w) => (
                    <div key={w} className="text-xs">· {w}</div>
                  ))}
                </div>
              </div>
              <p className="text-[var(--muted)] mt-2">{mbti.summary}</p>
            </div>
          </AccordionSection>
        </div>

        {/* 대운 흐름 */}
        {saju.daeun && saju.daeun.length > 0 && (
          <div className="mt-4">
            <AccordionSection
              title="대운 흐름"
              icon="🔄"
              isOpen={openSection === "daeun"}
              onToggle={() => toggleSection("daeun")}
            >
              <div className="space-y-2">
                {saju.daeun.map((d, i) => (
                  <div
                    key={i}
                    className={`flex items-center gap-3 p-2.5 rounded-lg border ${
                      d.isCurrent
                        ? "border-purple-500 bg-purple-900/20"
                        : "border-[var(--border)] bg-[var(--surface)]"
                    }`}
                  >
                    <div className="text-center min-w-[56px]">
                      <div className="text-lg font-bold">{d.stem}{d.branch}</div>
                      <div className="text-xs text-[var(--muted)]">{d.age}</div>
                    </div>
                    <div className="flex-1 text-xs text-[var(--muted)]">
                      {d.summary}
                    </div>
                    {d.isCurrent && (
                      <span className="text-xs text-purple-400 font-medium whitespace-nowrap">현재</span>
                    )}
                  </div>
                ))}
              </div>
            </AccordionSection>
          </div>
        )}

        {/* 분야별 상세 운세 */}
        {yearlyFortune && (
          <div className="mt-4 space-y-3">
            <div className="bg-[var(--surface)] rounded-2xl p-5 border border-[var(--border)]">
              <h3 className="text-base font-semibold mb-1 flex items-center gap-2">
                <span>📅</span> {yearlyFortune.year}년 운세
              </h3>
              <p className="text-xs text-[var(--muted)] mb-4">
                세운: {yearlyFortune.stem}{yearlyFortune.branch}년
              </p>

              {/* 종합 운세 */}
              <div className="mb-4 p-3 rounded-xl bg-[var(--surface-light)] border border-[var(--border)]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">종합운</span>
                  <span className="text-sm font-bold" style={{ color: card.dominantColor }}>
                    {yearlyFortune.overall.score}점
                  </span>
                </div>
                <p className="text-xs text-[var(--muted)] mb-1">{yearlyFortune.overall.summary}</p>
                <p className="text-xs text-purple-400">{yearlyFortune.overall.advice}</p>
              </div>

              {/* 분야별 운세 카드 */}
              <div className="grid grid-cols-1 gap-2.5">
                {([
                  { key: "career" as const, icon: "💼", label: "직업운" },
                  { key: "wealth" as const, icon: "💰", label: "재물운" },
                  { key: "love" as const, icon: "💕", label: "연애운" },
                  { key: "health" as const, icon: "🏥", label: "건강운" },
                  { key: "relationship" as const, icon: "🤝", label: "대인관계운" },
                ]).map(({ key, icon, label }) => {
                  const fortune = yearlyFortune[key];
                  if (!fortune) return null;
                  return (
                    <div key={key} className="p-3 rounded-xl bg-[var(--surface-light)] border border-[var(--border)]">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium flex items-center gap-1.5">
                          <span>{icon}</span> {label}
                        </span>
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 rounded-full bg-[var(--surface)] overflow-hidden">
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${fortune.score}%`,
                                background: `linear-gradient(to right, ${card.dominantColor}, #ec4899)`,
                              }}
                            />
                          </div>
                          <span className="text-xs font-bold min-w-[28px] text-right">{fortune.score}</span>
                        </div>
                      </div>
                      <p className="text-xs text-[var(--muted)] mb-1">{fortune.summary}</p>
                      <p className="text-xs text-purple-400">{fortune.advice}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 월별 하이라이트 */}
            {yearlyFortune.monthlyHighlights && yearlyFortune.monthlyHighlights.length > 0 && (
              <div className="bg-[var(--surface)] rounded-2xl p-5 border border-[var(--border)]">
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <span>🗓️</span> 월별 하이라이트
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {yearlyFortune.monthlyHighlights.map((m) => (
                    <div
                      key={m.month}
                      className="p-2.5 rounded-lg bg-[var(--surface-light)] border border-[var(--border)]"
                    >
                      <div className="text-xs font-semibold text-purple-400 mb-1">{m.month}월</div>
                      <div className="text-xs font-medium mb-0.5">{m.keyword}</div>
                      <div className="text-xs text-[var(--muted)]">{m.description}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 6개월 행동 가이드 */}
        {monthlyGuide && monthlyGuide.length > 0 && (
          <div className="mt-4">
            <div className="bg-[var(--surface)] rounded-2xl p-5 border border-[var(--border)]">
              <h3 className="text-base font-semibold mb-1 flex items-center gap-2">
                <span>🃏</span> 6개월 행동 가이드
              </h3>
              <p className="text-xs text-[var(--muted)] mb-4">
                월운 · 자미두수 · 수비학 · 타로 종합 분석
              </p>
              <div className="space-y-3">
                {monthlyGuide.map((g) => (
                  <div
                    key={g.month}
                    className="rounded-xl border border-[var(--border)] overflow-hidden"
                  >
                    {/* 월 헤더 */}
                    <div className="flex items-center justify-between px-4 py-2.5 bg-[var(--surface-light)]">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-purple-400">{g.month}월</span>
                        <span className="text-xs text-[var(--muted)]">
                          {g.monthStem}{g.monthBranch}월
                        </span>
                        <span className="text-xs px-1.5 py-0.5 rounded bg-purple-900/30 text-purple-300">
                          개인월 {g.personalMonth}
                        </span>
                      </div>
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full"
                        style={{
                          background: `${card.dominantColor}20`,
                          color: card.dominantColor,
                        }}
                      >
                        {g.energy}
                      </span>
                    </div>
                    {/* 타로카드 + 지침 */}
                    <div className="px-4 py-3 space-y-2">
                      <div className="flex items-start gap-2">
                        <span className="text-lg">🎴</span>
                        <div>
                          <div className="text-xs font-semibold">{g.tarotCard}</div>
                          <div className="text-xs text-[var(--muted)]">{g.tarotMeaning}</div>
                        </div>
                      </div>
                      <p className="text-xs font-medium text-[var(--foreground)]">{g.focus}</p>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <div className="text-xs font-medium text-green-400 mb-1">✓ 해야 할 것</div>
                          {(g.doList ?? []).map((d, i) => (
                            <div key={i} className="text-xs text-[var(--muted)]">· {d}</div>
                          ))}
                        </div>
                        <div>
                          <div className="text-xs font-medium text-red-400 mb-1">✕ 피해야 할 것</div>
                          {(g.avoidList ?? []).map((a, i) => (
                            <div key={i} className="text-xs text-[var(--muted)]">· {a}</div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 조언 & 궁합 */}
        <div className="mt-4 space-y-3">
          <div className="bg-[var(--surface)] rounded-2xl p-5 border border-[var(--border)]">
            <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
              <span>💡</span> 인생 조언
            </h3>
            <p className="text-sm text-[var(--muted)]">{card.lifeAdvice}</p>
          </div>

          {(card.compatibleTypes ?? []).length > 0 && (
            <div className="bg-[var(--surface)] rounded-2xl p-5 border border-[var(--border)]">
              <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                <span>💕</span> 잘 맞는 유형
              </h3>
              <div className="flex flex-wrap gap-2">
                {(card.compatibleTypes ?? []).map((type) => (
                  <span
                    key={type}
                    className="px-3 py-1 rounded-full text-xs bg-[var(--surface-light)] text-[var(--muted)] border border-[var(--border)]"
                  >
                    {type}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 다시 분석하기 */}
        <div className="mt-6 mb-8">
          <button
            onClick={() => router.push("/")}
            className="w-full py-3 rounded-xl text-sm font-semibold bg-[var(--surface)] border border-[var(--border)] text-[var(--muted)] hover:text-white transition-colors"
          >
            다시 분석하기
          </button>
        </div>
      </div>
    </main>
  );
}

function AccordionSection({
  title,
  icon,
  isOpen,
  onToggle,
  children,
}: {
  title: string;
  icon: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-[var(--surface)] rounded-xl border border-[var(--border)] overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full px-4 py-3 flex items-center justify-between text-sm font-medium hover:bg-[var(--surface-light)] transition-colors"
      >
        <span className="flex items-center gap-2">
          <span>{icon}</span> {title}
        </span>
        <span className={`transition-transform ${isOpen ? "rotate-180" : ""}`}>
          ▼
        </span>
      </button>
      {isOpen && <div className="px-4 pb-4">{children}</div>}
    </div>
  );
}
