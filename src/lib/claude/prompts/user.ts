import { BIRTH_HOURS, type AnalysisInput } from "@/lib/types";
import { calculateFourPillars, formatPillarsForPrompt } from "@/lib/saju/calculator";
import { calculateMbtiFromPillars, formatMbtiForPrompt } from "@/lib/saju/mbti";

export function buildUserPrompt(input: AnalysisInput): string {
  const hourInfo = BIRTH_HOURS.find((h) => {
    if (input.birthHour === 23 || input.birthHour === 0) return h.value === 0;
    return input.birthHour >= h.value * 2 + 1 && input.birthHour < h.value * 2 + 3;
  }) ?? BIRTH_HOURS[Math.floor(((input.birthHour + 1) % 24) / 2)];

  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1;
  const todayStr = `${currentYear}-${String(currentMonth).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  // 만 나이 계산
  const birth = new Date(input.birthDate);
  let age = currentYear - birth.getFullYear();
  const hasBirthdayPassed =
    currentMonth > birth.getMonth() + 1 ||
    (currentMonth === birth.getMonth() + 1 && today.getDate() >= birth.getDate());
  if (!hasBirthdayPassed) age--;

  const isLunar = input.calendarType === "lunar";
  const calendarLabel = isLunar ? "음력" : "양력";
  const lunarNote = isLunar ? " (음력→양력 변환 후 사주 산출, 자미두수는 음력 사용)" : "";

  // 사주 사주(四柱) 사전 계산 (양력 기준)
  const [y, m, d] = input.birthDate.split("-").map(Number);
  const pillars = calculateFourPillars(y, m, d, input.birthHour);
  const pillarsInfo = formatPillarsForPrompt(pillars);

  // MBTI 처리: 사용자 입력이 있으면 절대 우선 (ground truth), 없으면 참고용 추정
  let mbtiInfo: string;
  if (input.mbtiType) {
    mbtiInfo = [
      `[사용자 확정 MBTI: ${input.mbtiType}]`,
      `이 값을 mbti.type에 반드시 그대로 사용하세요.`,
      `MBTI는 사주와 독립된 심리 유형 지표이며, 사용자 본인이 검사/확정한 값이 유일한 근거입니다.`,
      `cognitiveStack, strengths, weaknesses, summary는 ${input.mbtiType} 공식 유형 설명 기반으로 작성하세요.`,
      `또한 crossCheck 교차검증과 characterCard 아키타입 도출 시 ${input.mbtiType}를 핵심 근거로 활용하세요.`,
    ].join("\n");
  } else {
    // 미지정 시에만 사주 기반 러프 추정을 참고치로 제공 (lock 아님)
    const mbtiCalc = calculateMbtiFromPillars(pillars);
    mbtiInfo = [
      `[MBTI 미지정 - 참고용 추정치]`,
      `사주 四柱 오행 편향 기반 러프 추정: ${mbtiCalc.type}`,
      `(오행분포 목${mbtiCalc.elements.wood} 화${mbtiCalc.elements.fire} 토${mbtiCalc.elements.earth} 금${mbtiCalc.elements.metal} 수${mbtiCalc.elements.water})`,
      `주의: 사주와 MBTI는 본질적으로 다른 체계이므로 이는 참고치일 뿐입니다.`,
      `mbti.summary 마지막에 "(※ MBTI 미지정으로 사주 기반 추정)"을 반드시 덧붙이세요.`,
    ].join("\n");
  }

  return `${input.birthDate}(${calendarLabel})${lunarNote} ${input.birthHour}시(${hourInfo.label}) ${input.gender === "male" ? "남" : "여"} ${input.koreanName}${input.englishName ? ` ${input.englishName}` : ""} 오늘날짜:${todayStr} 만나이:${age}세 한국나이:${age + 1}세 ${currentYear}년 운세 포함. monthlyGuide는 ${currentYear}년 ${currentMonth}월부터 6개월.

${pillarsInfo}

${mbtiInfo}

위 사주 四柱는 원광만세력 기준 정밀 계산값입니다. fourPillars는 반드시 그대로 사용하세요. JSON만 출력.`;
}
