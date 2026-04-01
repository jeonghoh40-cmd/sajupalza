// === 입력 타입 ===

export interface AnalysisInput {
  birthDate: string; // YYYY-MM-DD
  birthHour: number; // 0-23
  calendarType: "solar" | "lunar"; // 양력/음력
  gender: "male" | "female";
  koreanName: string;
  englishName?: string;
  mbtiType?: string; // 예: "INTJ"
}

// 시진 매핑
export const BIRTH_HOURS = [
  { label: "자시 (子時)", range: "23:00~01:00", value: 0 },
  { label: "축시 (丑時)", range: "01:00~03:00", value: 1 },
  { label: "인시 (寅時)", range: "03:00~05:00", value: 2 },
  { label: "묘시 (卯時)", range: "05:00~07:00", value: 3 },
  { label: "진시 (辰時)", range: "07:00~09:00", value: 4 },
  { label: "사시 (巳時)", range: "09:00~11:00", value: 5 },
  { label: "오시 (午時)", range: "11:00~13:00", value: 6 },
  { label: "미시 (未時)", range: "13:00~15:00", value: 7 },
  { label: "신시 (申時)", range: "15:00~17:00", value: 8 },
  { label: "유시 (酉時)", range: "17:00~19:00", value: 9 },
  { label: "술시 (戌時)", range: "19:00~21:00", value: 10 },
  { label: "해시 (亥時)", range: "21:00~23:00", value: 11 },
] as const;

// === Claude 응답 타입 ===

export interface SajuResult {
  fourPillars: {
    year: { stem: string; branch: string };
    month: { stem: string; branch: string };
    day: { stem: string; branch: string };
    hour: { stem: string; branch: string };
  };
  fiveElements: {
    wood: number;
    fire: number;
    earth: number;
    metal: number;
    water: number;
  };
  dayMaster: string;
  tenGods: string[];
  usefulGod: string;
  relations: string[];
  summary: string;
  daeun: DaeunPeriod[];        // 대운 흐름 (8~10개)
}

export interface ZiweiResult {
  lifePalace: {
    position: string;
    mainStars: string[];
    brightness: string[];
  };
  bodyPalace: string;
  fiveElementBureau: string;
  keyPalaces: {
    career: { stars: string[]; reading: string };
    wealth: { stars: string[]; reading: string };
    spouse: { stars: string[]; reading: string };
  };
  fourTransformations: {
    lu: string;
    quan: string;
    ke: string;
    ji: string;
  };
  summary: string;
}

export interface NumerologyResult {
  lifePath: { number: number; meaning: string };
  expression: { number: number; meaning: string };
  soulUrge: { number: number; meaning: string };
  personality: { number: number; meaning: string };
  birthday: { number: number; meaning: string };
  summary: string;
}

export interface MbtiResult {
  type: string;
  cognitiveStack: string[];
  strengths: string[];
  weaknesses: string[];
  summary: string;
}

export interface UnifiedTraits {
  leadership: number;
  creativity: number;
  analytical: number;
  stability: number;
  social: number;
  adventure: number;
  intuition: number;
  service: number;
}

export interface Tension {
  trait: string;
  type: "latent" | "developed" | "duality" | "tension";
  description: string;
}

export interface CrossCheckResult {
  unifiedTraits: UnifiedTraits;
  agreementScore: number;
  tensions: Tension[];
}

// === 대운/세운 & 분야별 운세 ===

export interface DaeunPeriod {
  age: string;         // 예: "1~10세"
  stem: string;        // 천간
  branch: string;      // 지지
  summary: string;     // 간략 해석
  isCurrent: boolean;  // 현재 대운 여부
}

export interface FortuneDetail {
  score: number;       // 0~100
  summary: string;     // 해석 요약
  advice: string;      // 조언
}

export interface YearlyFortune {
  year: number;
  stem: string;        // 세운 천간
  branch: string;      // 세운 지지
  overall: FortuneDetail;
  career: FortuneDetail;
  wealth: FortuneDetail;
  love: FortuneDetail;
  health: FortuneDetail;
  relationship: FortuneDetail;
  monthlyHighlights: MonthlyHighlight[];
}

export interface MonthlyHighlight {
  month: number;
  keyword: string;     // 핵심 키워드
  description: string;
}

// === 6개월 행동 가이드 ===

export interface MonthlyGuide {
  month: number;
  monthStem: string;       // 월운 천간
  monthBranch: string;     // 월운 지지
  personalMonth: number;   // 수비학 개인월 수
  tarotCard: string;       // 대표 타로카드
  tarotMeaning: string;    // 카드 의미 (1문장)
  energy: string;          // 종합 에너지 키워드
  doList: string[];        // 해야 할 것 (2~3개)
  avoidList: string[];     // 피해야 할 것 (1~2개)
  focus: string;           // 핵심 행동 지침 (1~2문장)
}

export interface CharacterCard {
  archetype: string;
  title: string;
  element: string;
  dominantColor: string;
  coreTraits: string[];
  strengths: string[];
  weaknesses: string[];
  hiddenSide: string;
  lifeAdvice: string;
  yearFortune: string;
  compatibleTypes: string[];
}

export interface AnalysisResponse {
  saju: SajuResult;
  ziwei: ZiweiResult;
  numerology: NumerologyResult;
  mbti: MbtiResult;
  crossCheck: CrossCheckResult;
  characterCard: CharacterCard;
  yearlyFortune: YearlyFortune;
  monthlyGuide: MonthlyGuide[];  // 향후 6개월 행동 가이드
}
