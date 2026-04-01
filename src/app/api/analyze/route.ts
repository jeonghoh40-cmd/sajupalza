import { NextRequest } from "next/server";
import { analyzeDestinyStreaming } from "@/lib/claude/client";
import type { AnalysisInput } from "@/lib/types";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as AnalysisInput;

    if (!body.birthDate || !body.koreanName || body.gender === undefined) {
      return new Response(JSON.stringify({ error: "필수 입력값이 누락되었습니다." }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const result = await analyzeDestinyStreaming(body, (pct) => {
            controller.enqueue(encoder.encode(`data: {"progress":${pct}}\n\n`));
          });

          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true, result })}\n\n`));
          controller.close();
        } catch (error) {
          const msg = error instanceof Error ? error.message : "분석 중 오류가 발생했습니다.";

          // 파싱 실패 시 1회 재시도
          if (msg.includes("파싱 실패")) {
            try {
              controller.enqueue(encoder.encode(`data: {"progress":5,"retry":true}\n\n`));
              const result = await analyzeDestinyStreaming(body, (pct) => {
                controller.enqueue(encoder.encode(`data: {"progress":${pct}}\n\n`));
              });
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true, result })}\n\n`));
              controller.close();
              return;
            } catch {
              // 재시도도 실패
            }
          }

          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: msg })}\n\n`));
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch {
    return new Response(JSON.stringify({ error: "요청 처리 실패" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
