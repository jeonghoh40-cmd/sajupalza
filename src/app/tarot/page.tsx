"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { TAROT_DECK, SPREAD_POSITIONS, shuffleDeck, type TarotCard } from "@/lib/tarot/deck";

type Phase = "question" | "select" | "reveal" | "result";

interface TarotCardReading {
  position: string;
  cardName: string;
  keywords: string[];
  reading: string;
}

interface TarotResponse {
  question: string;
  overallTheme: string;
  cards: TarotCardReading[];
  synthesis: string;
  advice: string;
}

export default function TarotPage() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("question");
  const [question, setQuestion] = useState("");
  const [shuffleSeed, setShuffleSeed] = useState<number>(() => Date.now());
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [revealedCount, setRevealedCount] = useState(0);
  const [reading, setReading] = useState<TarotResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // 셔플된 덱 (시드 기반으로 안정)
  const shuffled = useMemo(
    () => shuffleDeck(TAROT_DECK, shuffleSeed),
    [shuffleSeed]
  );

  // 화면에 펼쳐 보여줄 카드 (앞 24장만 노출)
  const displayedDeck = shuffled.slice(0, 24);

  const handleSelectCard = (id: number) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((x) => x !== id));
    } else if (selectedIds.length < 5) {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleQuestionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) {
      setError("질문을 입력해주세요.");
      return;
    }
    setError("");
    setShuffleSeed(Date.now());
    setSelectedIds([]);
    setPhase("select");
  };

  const handleStartReveal = async () => {
    if (selectedIds.length !== 5) return;

    // 카드 이미지 사전 로드 (플립 시 즉시 보이도록)
    const preloadCards = selectedIds
      .map((id) => TAROT_DECK.find((c) => c.id === id))
      .filter((c): c is TarotCard => !!c);
    await Promise.all(
      preloadCards.map(
        (c) =>
          new Promise<void>((resolve) => {
            const img = new Image();
            img.onload = () => resolve();
            img.onerror = () => resolve();
            img.src = c.image;
          })
      )
    );

    setPhase("reveal");
    setRevealedCount(0);

    // 카드 한 장씩 순차 플립 (600ms 간격)
    for (let i = 1; i <= 5; i++) {
      await new Promise((r) => setTimeout(r, 600));
      setRevealedCount(i);
    }

    // 모두 뒤집힌 후 1초 대기 후 Claude 호출
    await new Promise((r) => setTimeout(r, 1000));
    await fetchReading();
  };

  const fetchReading = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/tarot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, cardIds: selectedIds }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || "해석 실패");
      }
      setReading(data);
      setPhase("result");
    } catch (e) {
      setError(e instanceof Error ? e.message : "해석 중 오류 발생");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setPhase("question");
    setQuestion("");
    setSelectedIds([]);
    setRevealedCount(0);
    setReading(null);
    setError("");
  };

  const selectedCards = selectedIds
    .map((id) => TAROT_DECK.find((c) => c.id === id))
    .filter((c): c is TarotCard => !!c);

  return (
    <main className="min-h-screen flex flex-col items-center px-4 py-6 sm:py-8 safe-area-inset">
      {/* 헤더 */}
      <div className="w-full max-w-lg mb-3 sm:mb-4 flex items-center justify-between">
        <button
          onClick={() => router.push("/")}
          className="text-[var(--muted)] text-sm hover:text-white transition-colors"
        >
          ← 메인
        </button>
        <h1 className="text-base font-semibold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
          🃏 타로 5장 리딩
        </h1>
        <div className="w-10" />
      </div>

      {/* 단계 표시 */}
      <div className="w-full max-w-lg mb-4 flex items-center justify-center gap-2">
        {(["question", "select", "reveal", "result"] as Phase[]).map((p, i) => (
          <div
            key={p}
            className={`h-1.5 flex-1 rounded-full transition-all ${
              phase === p
                ? "bg-purple-400"
                : i < ["question", "select", "reveal", "result"].indexOf(phase)
                ? "bg-purple-700"
                : "bg-[var(--surface-light)]"
            }`}
          />
        ))}
      </div>

      <div className="w-full max-w-lg">
        {/* PHASE 1: 질문 입력 */}
        {phase === "question" && (
          <form
            onSubmit={handleQuestionSubmit}
            className="bg-[var(--surface)] rounded-2xl p-6 border border-[var(--border)]"
          >
            <div className="text-center mb-5">
              <div className="text-4xl mb-3">🔮</div>
              <h2 className="text-lg font-semibold mb-1">마음 속 질문을 적어주세요</h2>
              <p className="text-xs text-[var(--muted)]">
                구체적이고 진지한 질문일수록 깊은 답을 얻습니다
              </p>
            </div>
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="예: 지금 준비 중인 이직, 어떤 흐름으로 가고 있나요?"
              className="w-full h-28 px-3 py-2 rounded-lg bg-[var(--surface-light)] border border-[var(--border)] text-sm resize-none focus:outline-none focus:border-purple-500"
              maxLength={200}
            />
            <div className="text-xs text-[var(--muted)] text-right mt-1">
              {question.length}/200
            </div>
            {error && <p className="text-xs text-red-400 mt-2">{error}</p>}
            <button
              type="submit"
              className="w-full mt-4 py-3 rounded-xl text-sm font-semibold bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:opacity-90 transition-opacity"
            >
              카드 뽑으러 가기 →
            </button>
          </form>
        )}

        {/* PHASE 2: 카드 선택 */}
        {phase === "select" && (
          <div>
            <div className="bg-[var(--surface)] rounded-2xl p-5 border border-[var(--border)] mb-4">
              <p className="text-xs text-[var(--muted)] mb-1">질문</p>
              <p className="text-sm font-medium leading-relaxed">{question}</p>
            </div>

            <div className="bg-[var(--surface)] rounded-2xl p-5 border border-[var(--border)] mb-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold">
                  카드를 5장 선택하세요
                </h3>
                <span className="text-xs px-2 py-0.5 rounded-full bg-purple-900/30 text-purple-300 border border-purple-700/40">
                  {selectedIds.length}/5
                </span>
              </div>
              <p className="text-xs text-[var(--muted)] mb-4">
                직관적으로 끌리는 카드를 골라주세요. 순서대로 과거→현재→미래→원인→결과가 됩니다.
              </p>

              {/* 카드 그리드 */}
              <div className="grid grid-cols-6 gap-1.5">
                {displayedDeck.map((card) => {
                  const idx = selectedIds.indexOf(card.id);
                  const isSelected = idx !== -1;
                  return (
                    <button
                      key={card.id}
                      onClick={() => handleSelectCard(card.id)}
                      disabled={!isSelected && selectedIds.length >= 5}
                      className={`relative aspect-[2/3] rounded-md border-2 transition-all ${
                        isSelected
                          ? "border-purple-400 scale-95 shadow-lg shadow-purple-500/30"
                          : "border-purple-900/50 hover:border-purple-500 hover:scale-105"
                      } ${!isSelected && selectedIds.length >= 5 ? "opacity-30 cursor-not-allowed" : ""}`}
                      style={{
                        background:
                          "linear-gradient(135deg, #1e1b4b 0%, #4c1d95 50%, #1e1b4b 100%)",
                      }}
                    >
                      {isSelected && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-5 h-5 rounded-full bg-purple-400 text-white text-xs flex items-center justify-center font-bold">
                            {idx + 1}
                          </div>
                        </div>
                      )}
                      {!isSelected && (
                        <div className="absolute inset-0 flex items-center justify-center text-purple-300/40 text-lg">
                          ✦
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => setShuffleSeed(Date.now())}
                  className="flex-1 py-2.5 rounded-lg text-xs font-medium bg-[var(--surface-light)] border border-[var(--border)] text-[var(--muted)] hover:text-white transition-colors"
                >
                  🔀 다시 섞기
                </button>
                <button
                  onClick={handleStartReveal}
                  disabled={selectedIds.length !== 5}
                  className="flex-[2] py-2.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-purple-600 to-pink-600 text-white disabled:opacity-30 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
                >
                  카드 뒤집기 ({selectedIds.length}/5)
                </button>
              </div>
            </div>
          </div>
        )}

        {/* PHASE 3: 카드 공개 (플립) */}
        {phase === "reveal" && (
          <div className="bg-[var(--surface)] rounded-2xl p-5 border border-[var(--border)]">
            <div className="text-center mb-4">
              <h3 className="text-sm font-semibold">카드가 모습을 드러냅니다</h3>
              {loading && <p className="text-xs text-purple-400 mt-2 animate-pulse">우주의 메시지를 해석하는 중...</p>}
            </div>

            <div className="grid grid-cols-5 gap-2 mb-4">
              {selectedCards.map((card, i) => {
                const flipped = revealedCount > i;
                const pos = SPREAD_POSITIONS[i];
                return (
                  <div key={card.id} className="flex flex-col items-center">
                    <div className="text-xs text-purple-400 mb-1.5 font-medium">
                      {pos.label}
                    </div>
                    <div className="relative w-full aspect-[2/3] rounded-md">
                      {/* 뒷면 */}
                      <div
                        className={`absolute inset-0 rounded-md border-2 border-purple-900/50 flex items-center justify-center text-purple-300/40 transition-opacity duration-500 ${flipped ? "opacity-0" : "opacity-100"}`}
                        style={{
                          background:
                            "linear-gradient(135deg, #1e1b4b 0%, #4c1d95 50%, #1e1b4b 100%)",
                        }}
                      >
                        ✦
                      </div>
                      {/* 앞면 */}
                      <div
                        className={`absolute inset-0 rounded-md border-2 border-purple-400 overflow-hidden bg-amber-50 transition-all duration-500 ${flipped ? "opacity-100 scale-100" : "opacity-0 scale-90"}`}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={card.image}
                          alt={card.name.ko}
                          className="w-full h-full object-cover"
                          loading="eager"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).style.display = "none";
                          }}
                        />
                        <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[9px] font-bold text-center py-0.5 leading-tight">
                          {card.name.ko}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {error && (
              <div className="text-center">
                <p className="text-xs text-red-400 mb-3">{error}</p>
                <button
                  onClick={handleReset}
                  className="text-xs text-purple-400 underline"
                >
                  다시 시도
                </button>
              </div>
            )}
          </div>
        )}

        {/* PHASE 4: 결과 */}
        {phase === "result" && reading && (
          <div className="space-y-4">
            {/* 질문 + 전체 흐름 */}
            <div className="bg-[var(--surface)] rounded-2xl p-5 border border-[var(--border)]">
              <p className="text-xs text-[var(--muted)] mb-1">당신의 질문</p>
              <p className="text-sm font-medium mb-4 leading-relaxed">{reading.question}</p>
              <div className="p-3 rounded-lg bg-purple-900/20 border border-purple-700/40">
                <div className="text-xs text-purple-400 font-medium mb-1">전체 흐름</div>
                <p className="text-sm leading-relaxed">{reading.overallTheme}</p>
              </div>
            </div>

            {/* 5장 카드 + 위치별 해석 */}
            <div className="bg-[var(--surface)] rounded-2xl p-5 border border-[var(--border)]">
              <h3 className="text-sm font-semibold mb-4">카드별 해석</h3>
              <div className="space-y-3">
                {reading.cards.map((card, i) => {
                  const cardData = selectedCards[i];
                  const pos = SPREAD_POSITIONS[i];
                  return (
                    <div
                      key={i}
                      className="flex gap-3 p-3 rounded-xl bg-[var(--surface-light)] border border-[var(--border)]"
                    >
                      {/* 카드 미니 이미지 */}
                      <div className="w-14 h-20 flex-shrink-0 rounded-md border border-purple-400 overflow-hidden bg-amber-50">
                        {cardData && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={cardData.image}
                            alt={cardData.name.ko}
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs px-1.5 py-0.5 rounded bg-purple-900/30 text-purple-300 font-medium">
                            {pos.label}
                          </span>
                          <span className="text-xs font-semibold truncate">{card.cardName}</span>
                        </div>
                        <div className="flex flex-wrap gap-1 mb-1.5">
                          {card.keywords.map((k) => (
                            <span
                              key={k}
                              className="text-[10px] px-1.5 py-0.5 rounded-full bg-[var(--surface)] text-[var(--muted)] border border-[var(--border)]"
                            >
                              {k}
                            </span>
                          ))}
                        </div>
                        <p className="text-xs text-[var(--muted)] leading-relaxed">{card.reading}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 종합 해석 */}
            <div className="bg-[var(--surface)] rounded-2xl p-5 border border-[var(--border)]">
              <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                <span>🌟</span> 종합 해석
              </h3>
              <p className="text-sm text-[var(--foreground)] leading-relaxed">{reading.synthesis}</p>
            </div>

            {/* 조언 */}
            <div className="bg-gradient-to-br from-purple-900/30 to-pink-900/20 rounded-2xl p-5 border border-purple-700/40">
              <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                <span>💡</span> 우주의 조언
              </h3>
              <p className="text-sm leading-relaxed">{reading.advice}</p>
            </div>

            {/* 다시 보기 */}
            <button
              onClick={handleReset}
              className="w-full py-3 rounded-xl text-sm font-semibold bg-[var(--surface)] border border-[var(--border)] text-[var(--muted)] hover:text-white transition-colors mb-8"
            >
              새로운 질문하기
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
