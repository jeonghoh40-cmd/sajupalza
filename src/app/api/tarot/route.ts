import { NextRequest } from "next/server";
import { getClient } from "@/lib/claude/client";
import { TAROT_DECK, SPREAD_POSITIONS } from "@/lib/tarot/deck";

const MODELS = ["claude-haiku-4-5-20251001", "claude-sonnet-4-6"] as const;

interface TarotRequest {
  question: string;
  cardIds: number[]; // 5개
}

interface TarotCardReading {
  position: string;     // "과거"
  cardName: string;     // "The Fool(바보)"
  keywords: string[];
  reading: string;      // 해석 2~3문장
}

interface TarotResponse {
  question: string;
  overallTheme: string;       // 전체 흐름 1문장
  cards: TarotCardReading[];  // 5장 각 위치별 해석
  synthesis: string;          // 종합 해석 3~4문장
  advice: string;             // 실천적 조언 2~3문장
}

const SYSTEM_PROMPT = `당신은 깊이 있는 타로 리더입니다. 사용자의 질문에 대해 5장의 타로 카드(과거/현재/미래/원인/결과 스프레드)를 진정성 있게 해석합니다.

규칙:
- 카드의 전통적 의미와 위치 컨텍스트를 결합해 구체적으로 해석
- 운명을 단정하지 말고 통찰과 가능성을 제시
- 부정적 카드도 성장의 메시지로 균형감 있게 풀이
- 반드시 JSON만 출력. 다른 텍스트 금지.

JSON 스키마:
\`\`\`json
{
  "question": "사용자 질문 그대로",
  "overallTheme": "전체 리딩의 핵심 흐름 1문장",
  "cards": [
    {
      "position": "과거",
      "cardName": "카드 이름",
      "keywords": ["키워드1","키워드2","키워드3"],
      "reading": "이 카드가 이 위치에서 의미하는 바 2~3문장"
    }
  ],
  "synthesis": "5장을 종합한 스토리텔링 해석 3~4문장",
  "advice": "사용자가 실천할 수 있는 구체적 조언 2~3문장"
}
\`\`\`

cards 배열은 정확히 5개, 순서는 과거→현재→미래→원인→결과.`;

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as TarotRequest;

    if (!body.question || !Array.isArray(body.cardIds) || body.cardIds.length !== 5) {
      return new Response(
        JSON.stringify({ error: "질문과 5장의 카드가 필요합니다." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const cards = body.cardIds.map((id) => TAROT_DECK.find((c) => c.id === id));
    if (cards.some((c) => !c)) {
      return new Response(JSON.stringify({ error: "잘못된 카드 ID" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const cardsInfo = cards
      .map((c, i) => {
        const pos = SPREAD_POSITIONS[i];
        return `${i + 1}. [${pos.label}(${pos.en}) - ${pos.desc}] ${c!.name.en}(${c!.name.ko}) | 키워드: ${c!.keywords.join(", ")} | 의미: ${c!.meaning}`;
      })
      .join("\n");

    const userPrompt = `질문: ${body.question}

뽑힌 5장 (과거/현재/미래/원인/결과 스프레드):
${cardsInfo}

위 5장의 타로카드로 사용자의 질문에 대한 깊이 있는 해석을 JSON으로 출력하세요.`;

    const client = await getClient();

    let lastError: Error | null = null;
    for (const model of MODELS) {
      try {
        const msg = await client.messages.create({
          model,
          max_tokens: 4000,
          temperature: 0.7,
          system: SYSTEM_PROMPT,
          messages: [{ role: "user", content: userPrompt }],
        });

        const textBlock = msg.content.find((b) => b.type === "text");
        if (!textBlock || textBlock.type !== "text") {
          throw new Error("응답 텍스트 없음");
        }
        const text = textBlock.text;

        // JSON 추출
        let jsonStr = text;
        const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
        if (jsonMatch) {
          jsonStr = jsonMatch[1];
        } else {
          const start = text.indexOf("{");
          const end = text.lastIndexOf("}");
          if (start !== -1 && end !== -1 && end > start) {
            jsonStr = text.slice(start, end + 1);
          } else {
            throw new Error("AI 응답에서 JSON을 찾을 수 없습니다. 응답: " + text.substring(0, 100));
          }
        }

        // JSON 파싱 전 기본 검증
        jsonStr = jsonStr.trim();
        if (!jsonStr.startsWith("{") || !jsonStr.endsWith("}")) {
          throw new Error("유효하지 않은 JSON 형식: " + jsonStr.substring(0, 100));
        }

        let result: TarotResponse;
        try {
          result = JSON.parse(jsonStr) as TarotResponse;
        } catch (parseError) {
          throw new Error(
            `JSON 파싱 실패: ${(parseError as Error).message}. 원본: ${jsonStr.substring(0, 200)}`
          );
        }

        // 필수 필드 검증
        if (!result.cards || !Array.isArray(result.cards) || result.cards.length !== 5) {
          throw new Error("응답에 5장의 카드 해석이 포함되어야 합니다");
        }
        if (!result.overallTheme || !result.synthesis || !result.advice) {
          throw new Error("응답에 필수 필드(overallTheme, synthesis, advice)가 누락되었습니다");
        }

        return new Response(JSON.stringify(result), {
          headers: { "Content-Type": "application/json" },
        });
      } catch (err) {
        const status = (err as { status?: number }).status;
        if (status === 429) {
          continue;
        }
        lastError = err as Error;
      }
    }

    throw lastError ?? new Error("모든 모델 실패");
  } catch (err) {
    const msg = err instanceof Error ? err.message : "타로 해석 실패";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
