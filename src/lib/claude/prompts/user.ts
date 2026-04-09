import { BIRTH_HOURS, type AnalysisInput } from "@/lib/types";
import { calculateFourPillars, formatPillarsForPrompt } from "@/lib/saju/calculator";

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

  return `${input.birthDate}(${calendarLabel})${lunarNote} ${input.birthHour}시(${hourInfo.label}) ${input.gender === "male" ? "남" : "여"} ${input.koreanName}${input.englishName ? ` ${input.englishName}` : ""} MBTI:${input.mbtiType || "추정"} 오늘날짜:${todayStr} 만나이:${age}세 한국나이:${age + 1}세 ${currentYear}년 운세 포함. monthlyGuide는 ${currentYear}년 ${currentMonth}월부터 6개월.

${pillarsInfo}

위 사주 四柱는 원광만세력 기준으로 정확히 계산된 값입니다. fourPillars 출력 시 반드시 위 값을 그대로 사용하세요. JSON만 출력.`;
}
