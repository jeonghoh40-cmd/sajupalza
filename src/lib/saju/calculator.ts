/**
 * 사주 사주(四柱) 계산기
 * - 일주(日柱): 율리우스 일수(JDN) 기반 정확 계산
 * - 년주(年柱): 입춘(立春) 기준 년간지 산출 (분 단위 절기 시각 비교)
 * - 월주(月柱): 절기(節氣) 기준 월간지 산출 (연상기월법, 분 단위 정밀)
 * - 시주(時柱): 일상기시법(日上起時法) + 진태양시 보정
 */

// ========== 진태양시(眞太陽時) 보정 ==========
// 한국 표준시(KST, UTC+9)는 동경 135° 기준.
// 서울 경도 ≈ 126.978° → 표준 경도 대비 -8.022° → -(8.022/15)*60 ≈ -32.1분
// 대부분 만세력은 진태양시 보정을 적용하지 않지만, 시주(時柱) 경계 부근에서는 약 30분 차이가 남.
// USE_TRUE_SOLAR_TIME = true: 진태양시 보정 적용 (서울 기준, 더 전통적)
// USE_TRUE_SOLAR_TIME = false: KST 그대로 사용 (앱별로 다르므로 false를 기본값으로 유지)
const USE_TRUE_SOLAR_TIME = false;
const TRUE_SOLAR_TIME_OFFSET_MIN = -32; // 서울: KST 기준 -32분

// 천간(天干) 10개
const HEAVENLY_STEMS = ["갑", "을", "병", "정", "무", "기", "경", "신", "임", "계"] as const;
// 지지(地支) 12개
const EARTHLY_BRANCHES = ["자", "축", "인", "묘", "진", "사", "오", "미", "신", "유", "술", "해"] as const;

// 천간 한자
const STEM_HANJA: Record<string, string> = {
  갑: "甲", 을: "乙", 병: "丙", 정: "丁", 무: "戊",
  기: "己", 경: "庚", 신: "辛", 임: "壬", 계: "癸",
};
// 지지 한자
const BRANCH_HANJA: Record<string, string> = {
  자: "子", 축: "丑", 인: "寅", 묘: "卯", 진: "辰", 사: "巳",
  오: "午", 미: "未", 신: "申", 유: "酉", 술: "戌", 해: "亥",
};

export interface FourPillars {
  year: { stem: string; branch: string; hanja: string };
  month: { stem: string; branch: string; hanja: string };
  day: { stem: string; branch: string; hanja: string };
  hour: { stem: string; branch: string; hanja: string };
}

// ========== 율리우스 일수 (JDN) ==========

/** 그레고리력 날짜를 율리우스 일수(JDN)로 변환 */
function toJDN(year: number, month: number, day: number): number {
  const a = Math.floor((14 - month) / 12);
  const y = year + 4800 - a;
  const m = month + 12 * a - 3;
  return (
    day +
    Math.floor((153 * m + 2) / 5) +
    365 * y +
    Math.floor(y / 4) -
    Math.floor(y / 100) +
    Math.floor(y / 400) -
    32045
  );
}

// ========== 태양 황경 계산 (절기 판정용) ==========

/** JD → Julian Century from J2000.0 (JD는 분수 허용, TT 기준) */
function jdToJulianCentury(jd: number): number {
  return (jd - 2451545.0) / 36525.0;
}

/**
 * 태양 겉보기 황경(apparent ecliptic longitude) 계산 (도 단위, 0~360)
 * - 입력 jd는 분수 JD (UT 기준, TT-UT 차는 수 초 ~ 수십 초로 절기 판정에 무시 가능)
 * - 정확도 약 0.01° (≈15분의 태양 운동량)
 */
function solarLongitude(jd: number): number {
  const T = jdToJulianCentury(jd);
  // 평균 황경
  const L0 = 280.46646 + 36000.76983 * T + 0.0003032 * T * T;
  // 평균 근점이각
  const M = 357.52911 + 35999.05029 * T - 0.0001537 * T * T;
  const Mrad = (M * Math.PI) / 180;
  // 중심차
  const C =
    (1.9146 - 0.004817 * T - 0.000014 * T * T) * Math.sin(Mrad) +
    (0.019993 - 0.000101 * T) * Math.sin(2 * Mrad) +
    0.00029 * Math.sin(3 * Mrad);
  // 겉보기 황경 (장동 보정)
  const omega = 125.04 - 1934.136 * T;
  const lambda = L0 + C - 0.00569 - 0.00478 * Math.sin((omega * Math.PI) / 180);
  return ((lambda % 360) + 360) % 360;
}

/**
 * 목표 황경과의 부호 있는 차이 (−180°~+180°).
 * 0을 기준으로 음수면 "아직 도달 안 함", 양수면 "이미 지났음".
 */
function lngDiff(jd: number, targetLng: number): number {
  let d = solarLongitude(jd) - targetLng;
  while (d > 180) d -= 360;
  while (d < -180) d += 360;
  return d;
}

// 절기 JD 캐시 (year-targetLng 키)
const solarTermCache = new Map<string, number>();

/**
 * 특정 양력 연도에서 태양 황경이 targetLng가 되는 분수 JD(UT)를 반환.
 * 정밀도: 약 1분 이내.
 */
function findSolarTermJD(year: number, targetLng: number, searchStartMonth: number): number {
  const cacheKey = `${year}-${targetLng}`;
  const cached = solarTermCache.get(cacheKey);
  if (cached !== undefined) return cached;

  const startJdn = toJDN(year, searchStartMonth, 1);

  // 1) 일 단위로 교차일(crossing day) 찾기
  let crossJdn = -1;
  let prevDiff = lngDiff(startJdn, targetLng);
  for (let d = 1; d <= 62; d++) {
    const jd = startJdn + d;
    const diff = lngDiff(jd, targetLng);
    if (prevDiff < 0 && diff >= 0) {
      crossJdn = jd;
      break;
    }
    prevDiff = diff;
  }
  if (crossJdn < 0) {
    // fallback: 찾지 못함
    const fallback = startJdn + 30;
    solarTermCache.set(cacheKey, fallback);
    return fallback;
  }

  // 2) [crossJdn-1, crossJdn] 범위에서 이분법으로 분 단위 정밀도 탐색
  let lo = crossJdn - 1;
  let hi = crossJdn;
  for (let i = 0; i < 30; i++) {
    // 2^30 ≈ 10억분의 1일 ≈ 0.1ms (현실적으로 ~초 단위면 충분)
    const mid = (lo + hi) / 2;
    if (lngDiff(mid, targetLng) < 0) lo = mid;
    else hi = mid;
  }
  const result = (lo + hi) / 2;
  solarTermCache.set(cacheKey, result);
  return result;
}

// ========== 절기 (節氣) 경계일 ==========

/**
 * 12절기의 태양 황경 및 검색 시작월
 * 절기(節): 월 시작 경계로 사용되는 12개
 * index 0 = 소한(小寒, 1월/축월), 1 = 입춘(立春, 2월/인월), ...
 */
const SOLAR_TERM_BOUNDARIES = [
  { name: "소한", lng: 285, searchMonth: 1 },   // 축월(丑月) 시작 → 12월(음력)
  { name: "입춘", lng: 315, searchMonth: 1 },   // 인월(寅月) 시작 → 1월
  { name: "경칩", lng: 345, searchMonth: 2 },   // 묘월(卯月) 시작 → 2월
  { name: "청명", lng: 15, searchMonth: 3 },    // 진월(辰月) 시작 → 3월
  { name: "입하", lng: 45, searchMonth: 4 },    // 사월(巳月) 시작 → 4월
  { name: "망종", lng: 75, searchMonth: 5 },    // 오월(午月) 시작 → 5월
  { name: "소서", lng: 105, searchMonth: 6 },   // 미월(未月) 시작 → 6월
  { name: "입추", lng: 135, searchMonth: 7 },   // 신월(申月) 시작 → 7월
  { name: "백로", lng: 165, searchMonth: 8 },   // 유월(酉月) 시작 → 8월
  { name: "한로", lng: 195, searchMonth: 9 },   // 술월(戌月) 시작 → 9월
  { name: "입동", lng: 225, searchMonth: 10 },  // 해월(亥月) 시작 → 10월
  { name: "대설", lng: 255, searchMonth: 11 },  // 자월(子月) 시작 → 11월
] as const;

// 월지 순서: 인(1월) 묘(2월) 진(3월) 사(4월) 오(5월) 미(6월) 신(7월) 유(8월) 술(9월) 해(10월) 자(11월) 축(12월)
const MONTH_BRANCHES = ["인", "묘", "진", "사", "오", "미", "신", "유", "술", "해", "자", "축"] as const;

/**
 * 양력 날짜 + 한국 표준시(KST) 시각을 분수 JD(UT)로 변환.
 * KST = UT + 9h → UT = KST - 9h
 * @param hour  정수 시 (0~23, KST)
 * @param minute 분 (0~59, 기본 0)
 */
function toJD_UT(year: number, month: number, day: number, hour: number, minute = 0): number {
  const jdn = toJDN(year, month, day);
  // JDN은 정오(12:00 UT) 기준이므로: JD = JDN - 0.5 + (시각/24)
  const utHour = hour - 9; // KST → UT
  return jdn - 0.5 + (utHour + minute / 60) / 24;
}

/**
 * 특정 양력 날짜+시각(KST)이 사주력 기준 몇 월인지 판정.
 * 절기 경계를 분수 JD(분 단위 정밀도)로 비교하므로 경계일 출생자도 정확하게 처리됨.
 * @returns 사주월 1~12 (1=인월, 6=미월 등), 사주년도
 */
function getSajuMonth(
  year: number, month: number, day: number,
  hour: number, minute = 0
): { sajuMonth: number; sajuYear: number } {
  // 출생 시각을 분수 JD(UT)로 변환
  const birthJD = toJD_UT(year, month, day, hour, minute);

  // 입춘(황경 315°) 시각 (분수 JD)
  const lichunJD = findSolarTermJD(year, 315, 1);

  // 사주년도 결정: 입춘 시각 이전이면 전년도
  const sajuYear = birthJD < lichunJD ? year - 1 : year;

  // 12절기 경계를 분수 JD로 계산
  const boundaries: { sajuMonth: number; jd: number }[] = [];

  for (let i = 1; i <= 12; i++) {
    const term = SOLAR_TERM_BOUNDARIES[i % 12]; // i=1→입춘, i=12→소한
    let termYear = sajuYear;

    if (i >= 11) {
      // 대설(11월)·소한(12월)은 양력으로 다음해에 걸칠 수 있음
      const jdInSajuYear = findSolarTermJD(sajuYear, term.lng, term.searchMonth);
      const jdInNextYear = findSolarTermJD(sajuYear + 1, term.lng, term.searchMonth);
      let jd: number;
      if (i === 12) {
        // 소한은 사주력 기준 항상 다음 양력해
        jd = jdInNextYear;
      } else {
        // 대설: 사주년도에서 먼저 찾고, 이미 지났으면 다음해
        jd = birthJD >= jdInNextYear ? jdInNextYear : jdInSajuYear;
      }
      boundaries.push({ sajuMonth: i, jd });
      continue;
    }

    boundaries.push({
      sajuMonth: i,
      jd: findSolarTermJD(termYear, term.lng, term.searchMonth),
    });
  }

  // 역순으로 탐색: 출생 JD가 해당 절기 JD 이상이면 그 월
  for (let i = boundaries.length - 1; i >= 0; i--) {
    if (birthJD >= boundaries[i].jd) {
      return { sajuMonth: boundaries[i].sajuMonth, sajuYear };
    }
  }

  // 입춘 이전: 전년도 12월(축월)
  return { sajuMonth: 12, sajuYear: sajuYear - 1 };
}

// ========== 사주 계산 ==========

/** 년주(年柱) 계산: (년도 - 4) % 60 → 간지 */
function yearPillar(sajuYear: number): { stem: string; branch: string; hanja: string } {
  const idx = ((sajuYear - 4) % 60 + 60) % 60;
  const stem = HEAVENLY_STEMS[idx % 10];
  const branch = EARTHLY_BRANCHES[idx % 12];
  return { stem, branch, hanja: `${STEM_HANJA[stem]}${BRANCH_HANJA[branch]}` };
}

/**
 * 월주(月柱) 계산: 연상기월법(年上起月法)
 * 년간에 따라 인월(1월) 시작 천간이 결정됨
 */
function monthPillar(yearStemIdx: number, sajuMonth: number): { stem: string; branch: string; hanja: string } {
  // 연상기월법: 년간(甲/己→丙寅, 乙/庚→戊寅, 丙/辛→庚寅, 丁/壬→壬寅, 戊/癸→甲寅)
  const monthStartStem = [2, 4, 6, 8, 0]; // 甲→丙(2), 乙→戊(4), 丙→庚(6), 丁→壬(8), 戊→甲(0)
  const baseStem = monthStartStem[yearStemIdx % 5];
  const stemIdx = (baseStem + (sajuMonth - 1)) % 10;
  const branch = MONTH_BRANCHES[sajuMonth - 1];
  const stem = HEAVENLY_STEMS[stemIdx];
  return { stem, branch, hanja: `${STEM_HANJA[stem]}${BRANCH_HANJA[branch]}` };
}

/** 일주(日柱) 계산: JDN 기반 60갑자 순환 */
function dayPillar(year: number, month: number, day: number): { stem: string; branch: string; hanja: string } {
  const jdn = toJDN(year, month, day);
  // (JDN + 49) % 60 = 60갑자 인덱스 (검증: 1967-07-22 → 丁亥 = idx 23)
  const idx = ((jdn + 49) % 60 + 60) % 60;
  const stem = HEAVENLY_STEMS[idx % 10];
  const branch = EARTHLY_BRANCHES[idx % 12];
  return { stem, branch, hanja: `${STEM_HANJA[stem]}${BRANCH_HANJA[branch]}` };
}

/**
 * 시주(時柱) 계산: 일상기시법(日上起時法)
 * @param dayStemIdx 일간 인덱스 (0=甲, 1=乙, ...)
 * @param hourBranch 시지 인덱스 (0=子, 1=丑, ..., 11=亥)
 */
function hourPillar(dayStemIdx: number, hourBranchIdx: number): { stem: string; branch: string; hanja: string } {
  // 일상기시법: 일간(甲/己→甲子, 乙/庚→丙子, 丙/辛→戊子, 丁/壬→庚子, 戊/癸→壬子)
  const hourStartStem = [0, 2, 4, 6, 8]; // 甲→甲(0), 乙→丙(2), 丙→戊(4), 丁→庚(6), 戊→壬(8)
  const baseStem = hourStartStem[dayStemIdx % 5];
  const stemIdx = (baseStem + hourBranchIdx) % 10;
  const stem = HEAVENLY_STEMS[stemIdx];
  const branch = EARTHLY_BRANCHES[hourBranchIdx];
  return { stem, branch, hanja: `${STEM_HANJA[stem]}${BRANCH_HANJA[branch]}` };
}

/**
 * 시간(0~23) + 분(0~59) → 시지 인덱스 (0=子시 ~ 11=亥시)
 * 야자시(夜子時): 23:00~23:59 → 당일 자시 (일주 변경 없음)
 * 조자시(早子時): 00:00~00:59 → 익일 자시 (일주를 다음날로)
 * 시진 경계: 각 시는 홀수 시 정각에 시작 (子시=23시, 丑시=01시, ...)
 */
function hourTobranchIdx(hour: number, minute = 0): { branchIdx: number; isNextDay: boolean } {
  const totalMin = hour * 60 + minute;
  // 23:00 ~ 23:59: 야자시 (당일)
  if (totalMin >= 23 * 60) return { branchIdx: 0, isNextDay: false };
  // 00:00 ~ 00:59: 조자시 (익일)
  if (totalMin < 60) return { branchIdx: 0, isNextDay: true };
  // 01:00~02:59 → 丑(1), 03:00~04:59 → 寅(2), ..., 21:00~22:59 → 亥(11)
  const branchIdx = Math.floor((totalMin - 60) / 120) + 1;
  return { branchIdx, isNextDay: false };
}

// ========== 메인 함수 ==========

/**
 * 양력 생년월일시(KST)로 사주(四柱) 계산
 * @param hour   시 (0~23, 한국표준시)
 * @param minute 분 (0~59, 기본 0)
 */
export function calculateFourPillars(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute = 0,
): FourPillars {
  // 진태양시 보정 (옵션)
  let adjHour = hour, adjMinute = minute;
  if (USE_TRUE_SOLAR_TIME) {
    const totalMin = hour * 60 + minute + TRUE_SOLAR_TIME_OFFSET_MIN;
    // 날짜 경계를 넘을 경우는 시주 판정에만 영향 (일주는 별도 처리)
    adjHour = Math.floor(((totalMin % 1440) + 1440) % 1440 / 60);
    adjMinute = ((totalMin % 60) + 60) % 60;
  }

  // 야자시/조자시 판정
  const { branchIdx: hourBranchIdx, isNextDay } = hourTobranchIdx(adjHour, adjMinute);

  // 일주: 조자시(00:00~00:59)이면 익일 일진 사용
  let dayYear = year, dayMonth = month, dayDay = day;
  if (isNextDay) {
    const nextDate = jdnToGregorian(toJDN(year, month, day) + 1);
    dayYear = nextDate.year;
    dayMonth = nextDate.month;
    dayDay = nextDate.day;
  }

  const dayP = dayPillar(dayYear, dayMonth, dayDay);
  const dayStemIdx = HEAVENLY_STEMS.indexOf(dayP.stem as typeof HEAVENLY_STEMS[number]);

  // 년주·월주: 출생 시각(KST)과 절기 시각(분 단위)을 비교해 정확하게 판정
  const { sajuMonth, sajuYear } = getSajuMonth(year, month, day, hour, minute);
  const yearP = yearPillar(sajuYear);
  const yearStemIdx = HEAVENLY_STEMS.indexOf(yearP.stem as typeof HEAVENLY_STEMS[number]);
  const monthP = monthPillar(yearStemIdx, sajuMonth);

  // 시주
  const hourP = hourPillar(dayStemIdx, hourBranchIdx);

  return { year: yearP, month: monthP, day: dayP, hour: hourP };
}

/** JDN → 그레고리력 날짜 역변환 */
function jdnToGregorian(jdn: number): { year: number; month: number; day: number } {
  const a = jdn + 32044;
  const b = Math.floor((4 * a + 3) / 146097);
  const c = a - Math.floor(146097 * b / 4);
  const d = Math.floor((4 * c + 3) / 1461);
  const e = c - Math.floor(1461 * d / 4);
  const m = Math.floor((5 * e + 2) / 153);
  const day = e - Math.floor((153 * m + 2) / 5) + 1;
  const month = m + 3 - 12 * Math.floor(m / 10);
  const year = 100 * b + d - 4800 + Math.floor(m / 10);
  return { year, month, day };
}

/**
 * 사주 결과를 프롬프트용 문자열로 포맷
 */
export function formatPillarsForPrompt(pillars: FourPillars): string {
  const { year, month, day, hour } = pillars;
  return [
    `[사전계산된 사주 四柱 - 반드시 이 값을 사용하세요]`,
    `년주(年柱): ${year.stem}${year.branch}(${year.hanja})`,
    `월주(月柱): ${month.stem}${month.branch}(${month.hanja})`,
    `일주(日柱): ${day.stem}${day.branch}(${day.hanja})`,
    `시주(時柱): ${hour.stem}${hour.branch}(${hour.hanja})`,
  ].join("\n");
}
