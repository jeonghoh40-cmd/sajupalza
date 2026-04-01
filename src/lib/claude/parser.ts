import type { AnalysisResponse } from "@/lib/types";

export function parseResponse(text: string): AnalysisResponse {
  let jsonStr = text;

  // ```json ... ``` 블록이 있으면 추출
  const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
  if (jsonMatch) {
    jsonStr = jsonMatch[1];
  } else {
    // { 로 시작하는 JSON 찾기
    const braceStart = text.indexOf("{");
    const braceEnd = text.lastIndexOf("}");
    if (braceStart !== -1 && braceEnd !== -1) {
      jsonStr = text.slice(braceStart, braceEnd + 1);
    }
  }

  // JSON 파싱 시도
  try {
    const parsed = JSON.parse(jsonStr) as AnalysisResponse;
    validateResponse(parsed);
    return parsed;
  } catch (e) {
    // 잘린 JSON 복구 시도
    const repaired = repairJson(jsonStr);
    if (repaired) {
      try {
        const parsed = JSON.parse(repaired) as AnalysisResponse;
        validateResponse(parsed, true);
        return parsed;
      } catch {
        // 복구 실패
      }
    }

    throw new Error(
      `Claude 응답 파싱 실패: ${e instanceof Error ? e.message : "알 수 없는 에러"}`
    );
  }
}

function repairJson(jsonStr: string): string | null {
  let str = jsonStr.trim();

  // 잘린 JSON 복구: 마지막 완전한 값 경계까지 잘라낸 후 괄호 닫기
  // 완전한 값 경계 패턴: "...", number, true, false, null 뒤에 , 또는 } 또는 ]
  const lastComplete = Math.max(
    str.lastIndexOf('",'),
    str.lastIndexOf('"}'),
    str.lastIndexOf('"]'),
    str.lastIndexOf('"},'),
    str.lastIndexOf("],"),
    str.lastIndexOf("},"),
  );

  if (lastComplete > str.length * 0.3) {
    // 쉼표로 끝나면 쉼표 포함, 닫는 괄호로 끝나면 포함
    const endChar = str[lastComplete];
    str = str.slice(0, lastComplete + 1);
    // 마지막이 쉼표면 제거 (닫는 괄호 앞에 쉼표가 오면 안 됨)
    if (endChar === ",") {
      str = str.slice(0, -1);
    }
  }

  // 미닫힌 괄호 카운트 후 닫기
  let braces = 0;
  let brackets = 0;
  let inString = false;
  let escape = false;

  for (const ch of str) {
    if (escape) { escape = false; continue; }
    if (ch === "\\") { escape = true; continue; }
    if (ch === '"') { inString = !inString; continue; }
    if (inString) continue;
    if (ch === "{") braces++;
    if (ch === "}") braces--;
    if (ch === "[") brackets++;
    if (ch === "]") brackets--;
  }

  // 미닫힌 문자열 닫기
  if (inString) str += '"';

  // 후행 쉼표 제거 (닫는 괄호 추가 전)
  str = str.replace(/,\s*$/, "");

  // 미닫힌 배열/객체 닫기
  for (let i = 0; i < brackets; i++) str += "]";
  for (let i = 0; i < braces; i++) str += "}";

  return str;
}

function validateResponse(data: AnalysisResponse, lenient = false): void {
  if (!data.saju?.fourPillars) throw new Error("사주 데이터 누락");
  if (!data.ziwei?.lifePalace) throw new Error("자미두수 데이터 누락");
  if (!data.numerology?.lifePath) throw new Error("수비학 데이터 누락");
  if (!data.mbti?.type) throw new Error("MBTI 데이터 누락");
  if (!data.crossCheck?.unifiedTraits) throw new Error("교차검증 데이터 누락");
  if (!data.characterCard?.archetype) throw new Error("캐릭터카드 데이터 누락");
  if (!lenient && !data.yearlyFortune?.career) throw new Error("운세 데이터 누락");

  // 8축 점수 범위 검증
  const traits = data.crossCheck.unifiedTraits;
  for (const [key, value] of Object.entries(traits)) {
    if (typeof value !== "number" || value < 0 || value > 100) {
      throw new Error(`${key} 점수가 유효하지 않음: ${value}`);
    }
  }
}
