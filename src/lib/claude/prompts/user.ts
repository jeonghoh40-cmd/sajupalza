import { BIRTH_HOURS, type AnalysisInput } from "@/lib/types";

export function buildUserPrompt(input: AnalysisInput): string {
  const hourInfo = BIRTH_HOURS.find((h) => {
    if (input.birthHour === 23 || input.birthHour === 0) return h.value === 0;
    return input.birthHour >= h.value * 2 + 1 && input.birthHour < h.value * 2 + 3;
  }) ?? BIRTH_HOURS[Math.floor(((input.birthHour + 1) % 24) / 2)];

  const currentYear = new Date().getFullYear();
  const isLunar = input.calendarType === "lunar";
  const calendarLabel = isLunar ? "음력" : "양력";
  const lunarNote = isLunar ? " (음력→양력 변환 후 사주 산출, 자미두수는 음력 사용)" : "";

  return `${input.birthDate}(${calendarLabel})${lunarNote} ${input.birthHour}시(${hourInfo.label}) ${input.gender === "male" ? "남" : "여"} ${input.koreanName}${input.englishName ? ` ${input.englishName}` : ""} MBTI:${input.mbtiType || "추정"} ${currentYear}년 운세 포함. JSON만 출력.`;
}
