/**
 * 사주 四柱 기반 결정론적 MBTI 계산기
 *
 * 동일한 생년월일시 → 항상 동일한 MBTI가 산출되도록 보장.
 * 오행 분포(천간+지지 본기) + 일간 양음 + 전체 음양 밸런스 기반.
 *
 * 알고리즘 설계 원칙:
 * - E/I: 일간 양음(주) + 사주 전체 양음 비율(부)
 * - S/N: 금+토(현실/감각 S) vs 목+화(직관/이상 N)
 * - T/F: 일간 오행(庚辛壬癸=T, 甲乙丙丁=F) + 오행 보정
 * - J/P: 일간 양음(양=J 결단, 음=P 유연) + 토 강도 보정
 */

import type { FourPillars } from "./calculator";

const STEMS = ["갑", "을", "병", "정", "무", "기", "경", "신", "임", "계"];
const BRANCHES = ["자", "축", "인", "묘", "진", "사", "오", "미", "신", "유", "술", "해"];

// 천간 오행: 甲乙=목, 丙丁=화, 戊己=토, 庚辛=금, 壬癸=수
const STEM_ELEMENT: Array<"wood" | "fire" | "earth" | "metal" | "water"> = [
  "wood", "wood", "fire", "fire", "earth", "earth", "metal", "metal", "water", "water",
];

// 지지 본기:
// 子=수, 丑=토, 寅=목, 卯=목, 辰=토, 巳=화, 午=화, 未=토, 申=금, 酉=금, 戌=토, 亥=수
const BRANCH_ELEMENT: Array<"wood" | "fire" | "earth" | "metal" | "water"> = [
  "water", "earth", "wood", "wood", "earth", "fire",
  "fire", "earth", "metal", "metal", "earth", "water",
];

// 천간 양음: 甲(0)丙(2)戊(4)庚(6)壬(8)=양, 乙(1)丁(3)己(5)辛(7)癸(9)=음
// 지지 양음: 子(0)寅(2)辰(4)午(6)申(8)戌(10)=양, 丑(1)卯(3)巳(5)未(7)酉(9)亥(11)=음
function isYangStem(idx: number): boolean { return idx % 2 === 0; }
function isYangBranch(idx: number): boolean { return idx % 2 === 0; }

export interface MbtiCalculation {
  type: string;              // "INFP"
  scores: {
    EI: number;              // 양수=E, 음수=I
    SN: number;              // 양수=S, 음수=N
    TF: number;              // 양수=T, 음수=F
    JP: number;              // 양수=J, 음수=P
  };
  elements: {
    wood: number;
    fire: number;
    earth: number;
    metal: number;
    water: number;
  };
}

/**
 * 사주 四柱로부터 결정론적 MBTI 산출
 */
export function calculateMbtiFromPillars(pillars: FourPillars): MbtiCalculation {
  const stemIdx = {
    year: STEMS.indexOf(pillars.year.stem),
    month: STEMS.indexOf(pillars.month.stem),
    day: STEMS.indexOf(pillars.day.stem),
    hour: STEMS.indexOf(pillars.hour.stem),
  };
  const branchIdx = {
    year: BRANCHES.indexOf(pillars.year.branch),
    month: BRANCHES.indexOf(pillars.month.branch),
    day: BRANCHES.indexOf(pillars.day.branch),
    hour: BRANCHES.indexOf(pillars.hour.branch),
  };

  // 오행 분포 (천간 + 지지 본기, 총 8점)
  const elements = { wood: 0, fire: 0, earth: 0, metal: 0, water: 0 };
  for (const key of ["year", "month", "day", "hour"] as const) {
    elements[STEM_ELEMENT[stemIdx[key]]]++;
    elements[BRANCH_ELEMENT[branchIdx[key]]]++;
  }

  // 양/음 카운트 (8개 중)
  let yangCount = 0;
  for (const key of ["year", "month", "day", "hour"] as const) {
    if (isYangStem(stemIdx[key])) yangCount++;
    if (isYangBranch(branchIdx[key])) yangCount++;
  }
  const yinCount = 8 - yangCount;
  const dayIsYang = isYangStem(stemIdx.day);

  // ── E/I 축 ────────────────────────────
  // 일간 양음(주요 요인) + 사주 전체 양음 비율(보조)
  const EI =
    (dayIsYang ? 2.0 : -2.0) +
    (yangCount - yinCount) * 0.4;
  const eiChar = EI >= 0 ? "E" : "I";

  // ── S/N 축 ────────────────────────────
  // 금+토(실무/현실 감각) vs 목+화(상상/직관)
  const SN =
    (elements.metal + elements.earth) -
    (elements.wood + elements.fire);
  // 동점 시: 일간 양=S(현실), 음=N(내적)
  const snChar = SN === 0 ? (dayIsYang ? "S" : "N") : SN > 0 ? "S" : "N";

  // ── T/F 축 ────────────────────────────
  // 일간 오행이 금수(논리/분석) = T, 목화(감정/공감) = F
  // + 사주 전체 금수 vs 목화 분포로 보정
  const dayElem = STEM_ELEMENT[stemIdx.day];
  const dayTfBias =
    dayElem === "metal" || dayElem === "water" ? 1.5 :
    dayElem === "wood" || dayElem === "fire" ? -1.5 :
    0; // 戊己(토)는 중립
  const TF =
    dayTfBias +
    (elements.metal + elements.water) * 0.6 -
    (elements.wood + elements.fire) * 0.6;
  const tfChar = TF >= 0 ? "T" : "F";

  // ── J/P 축 ────────────────────────────
  // 일간 양=J(결단/계획), 음=P(유연/적응)
  // + 토 강도는 J(체계), 수 강도는 P(유동)를 보강
  const JP =
    (dayIsYang ? 1.5 : -1.5) +
    elements.earth * 0.4 -
    elements.water * 0.4;
  const jpChar = JP >= 0 ? "J" : "P";

  return {
    type: `${eiChar}${snChar}${tfChar}${jpChar}`,
    scores: { EI, SN, TF, JP },
    elements,
  };
}

/**
 * 프롬프트용 MBTI 설명 문자열
 */
export function formatMbtiForPrompt(calc: MbtiCalculation): string {
  const { type, elements } = calc;
  return [
    `[사전계산된 MBTI 유형 - 반드시 이 값을 사용하세요]`,
    `MBTI: ${type}`,
    `근거 오행분포: 목${elements.wood} 화${elements.fire} 토${elements.earth} 금${elements.metal} 수${elements.water}`,
  ].join("\n");
}
