import { NextRequest, NextResponse } from "next/server";
import { analyzeDestiny } from "@/lib/claude/client";
import type { AnalysisInput } from "@/lib/types";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as AnalysisInput;

    if (!body.birthDate || !body.koreanName || body.gender === undefined) {
      return NextResponse.json(
        { error: "필수 입력값이 누락되었습니다." },
        { status: 400 }
      );
    }

    if (body.birthHour < 0 || body.birthHour > 23) {
      return NextResponse.json(
        { error: "출생 시간이 유효하지 않습니다." },
        { status: 400 }
      );
    }

    const result = await analyzeDestiny(body);
    return NextResponse.json(result);
  } catch (error) {
    console.error("분석 실패:", error);

    const status = (error as { status?: number }).status;
    const rawMessage =
      error instanceof Error ? error.message : "분석 중 오류가 발생했습니다.";

    if (status === 429 || rawMessage.includes("rate_limit")) {
      return NextResponse.json(
        { error: "요청이 너무 많습니다. 1~2분 후 다시 시도해주세요." },
        { status: 429 }
      );
    }

    // 파싱 실패 시 1회 재시도
    if (rawMessage.includes("파싱 실패")) {
      try {
        const body = (await request.clone().json()) as AnalysisInput;
        const result = await analyzeDestiny(body);
        return NextResponse.json(result);
      } catch {
        // 재시도도 실패
      }
    }

    return NextResponse.json({ error: rawMessage }, { status: 500 });
  }
}
