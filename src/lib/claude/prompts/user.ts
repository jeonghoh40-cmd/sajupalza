import { BIRTH_HOURS, type AnalysisInput } from "@/lib/types";

export function buildUserPrompt(input: AnalysisInput): string {
  const hourInfo = BIRTH_HOURS.find((h) => {
    if (input.birthHour === 23 || input.birthHour === 0) return h.value === 0;
    return input.birthHour >= h.value * 2 + 1 && input.birthHour < h.value * 2 + 3;
  }) ?? BIRTH_HOURS[Math.floor(((input.birthHour + 1) % 24) / 2)];

  const currentYear = new Date().getFullYear();

  const isLunar = input.calendarType === "lunar";
  const calendarLabel = isLunar ? "음력" : "양력";

  return `아래 정보를 기반으로 운명 캐릭터카드를 생성해주세요.

## 입력 정보
- 생년월일: ${input.birthDate} (${calendarLabel})${isLunar ? "\n  ※ 음력 날짜입니다. 사주 산출 시 반드시 양력으로 변환한 후 절기 기준으로 년주/월주를 산출하세요. 자미두수는 음력 날짜를 그대로 사용합니다." : ""}
- 출생시간: ${input.birthHour}시 (${hourInfo.label}, ${hourInfo.range})
- 성별: ${input.gender === "male" ? "남성" : "여성"}
- 이름(한글): ${input.koreanName}
${input.englishName ? `- 이름(영문): ${input.englishName}` : ""}
- MBTI: ${input.mbtiType || "알 수 없음 (사주/자미두수 기반으로 추정해주세요)"}
- 현재 연도: ${currentYear}년

## 요청사항
1. 사주팔자 정밀 분석 (사주 산출, 오행 분포, 십성, 용신, 대운 8~10개)
2. 자미두수 명반 분석 (명궁 주성, 주요 궁 해석, 사화)
3. 수비학 분석 (생명수, 표현수, 영혼수, 인격수, 생일수)
4. MBTI 분석 (인지기능 기반 상세 분석)
5. 교차검증 (8축 통합 점수 0~100, 일치도, 갈등 분석)
6. 캐릭터카드 생성 (아키타입, 강점, 약점, 조언)
7. ${currentYear}년 상세 운세 (세운 분석 + 직업운/재물운/연애운/건강운/대인관계운 각각 점수와 해석, 월별 하이라이트 6개)

반드시 지정된 JSON 형식으로만 응답해주세요.`;
}
