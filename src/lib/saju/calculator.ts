/**
 * 사주 사주(四柱) 계산기
 * - 일주(日柱): 율리우스 일수(JDN) 기반 정확 계산
 * - 년주(年柱): 입춘(立春) 기준 년간지 산출
 * - 월주(月柱): 절기(節氣) 기준 월간지 산출 (연상기월법)
 * - 시주(時柱): 일상기시법(日上起時法) 기준 시간지 산출
 */

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

/** JDN → Julian Century from J2000.0 */
function jdnToJulianCentury(jdn: number): number {
  return (jdn - 2451545.0) / 36525.0;
}

/** 태양 황경(ecliptic longitude) 계산 (도 단위, 0~360) */
function solarLongitude(jdn: number): number {
  const T = jdnToJulianCentury(jdn);
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
 * 특정 연도에서 태양 황경이 targetLng도가 되는 JDN을 찾는다.
 * (이분법으로 1일 이내 정확도)
 */
function findSolarTermJDN(year: number, targetLng: number, searchStartMonth: number): number {
  // 검색 시작일
  let jdn = toJDN(year, searchStartMonth, 1);
  // 대략 60일 범위에서 탐색
  const endJdn = jdn + 60;

  // 먼저 대략적 위치 찾기 (1일 단위)
  let prevLng = solarLongitude(jdn);
  for (let d = jdn + 1; d <= endJdn; d++) {
    const lng = solarLongitude(d);
    // 황경이 targetLng를 지나는 지점 (360→0 경계 처리)
    const crossed =
      (prevLng <= targetLng && lng >= targetLng) ||
      (targetLng < 30 && prevLng > 300 && lng < 60);
    if (crossed) {
      return d;
    }
    prevLng = lng;
  }
  // fallback: 검색 실패 시 대략값
  return jdn + 30;
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
 * 특정 양력 날짜가 몇 월(사주력 기준)인지 판정
 * @returns 사주월 1~12 (1=인월, 6=미월 등)
 */
function getSajuMonth(year: number, month: number, day: number): { sajuMonth: number; sajuYear: number } {
  const jdn = toJDN(year, month, day);

  // 입춘 JDN (인월 시작 = 사주력 새해)
  const lichunJDN = findSolarTermJDN(year, 315, 1);

  // 사주년도 결정: 입춘 이전이면 전년도
  const sajuYear = jdn < lichunJDN ? year - 1 : year;

  // 각 절기 경계 JDN 계산 (해당 연도와 전년도 모두 고려)
  // 소한(12월)은 전년도에 속할 수 있음
  const boundaries: { sajuMonth: number; jdn: number }[] = [];

  // 인월(1월)부터 축월(12월)까지 순서대로 절기 경계 계산
  for (let i = 1; i <= 12; i++) {
    const term = SOLAR_TERM_BOUNDARIES[i % 12]; // i=1→입춘, i=2→경칩, ... i=12→소한(i%12=0)
    let termYear = sajuYear;

    // 입춘(1월)~대설(11월)은 sajuYear, 소한(12월)은 sajuYear+1
    if (i >= 11) {
      // 자월(11월/대설)과 축월(12월/소한)은 양력으로 다음해일 수 있음
      const termInSajuYear = findSolarTermJDN(sajuYear, term.lng, term.searchMonth);
      const termInNextYear = findSolarTermJDN(sajuYear + 1, term.lng, term.searchMonth);

      // 현재 날짜 기준으로 올바른 연도 선택
      if (jdn >= termInNextYear) {
        termYear = sajuYear + 1;
      } else if (jdn >= termInSajuYear) {
        termYear = sajuYear;
      }
    }
    if (i === 12) {
      // 소한은 항상 다음 양력해
      termYear = sajuYear + 1;
    }

    boundaries.push({
      sajuMonth: i,
      jdn: findSolarTermJDN(termYear, term.lng, term.searchMonth),
    });
  }

  // 날짜가 어느 월에 속하는지 판정 (역순으로 확인)
  for (let i = boundaries.length - 1; i >= 0; i--) {
    if (jdn >= boundaries[i].jdn) {
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
 * 시간(0~23) → 시지 인덱스 (0=子시 ~ 11=亥시)
 * 야자시 구분: 23:00~00:00 = 당일 자시, 00:00~01:00 = 익일 자시
 */
function hourTobranchIdx(hour: number): { branchIdx: number; isNextDay: boolean } {
  if (hour === 23) return { branchIdx: 0, isNextDay: false }; // 야자시: 당일
  if (hour === 0) return { branchIdx: 0, isNextDay: true };   // 조자시: 익일
  // 1~2시 → 축시(1), 3~4시 → 인시(2), ..., 21~22시 → 해시(11)
  const branchIdx = Math.floor((hour + 1) / 2);
  return { branchIdx, isNextDay: false };
}

// ========== 메인 함수 ==========

/**
 * 양력 생년월일시로 사주 사주(四柱) 계산
 */
export function calculateFourPillars(
  year: number,
  month: number,
  day: number,
  hour: number
): FourPillars {
  // 야자시 처리
  const { branchIdx: hourBranchIdx, isNextDay } = hourTobranchIdx(hour);

  // 일주 계산 (야자시/조자시에 따라 일진 보정)
  let dayYear = year, dayMonth = month, dayDay = day;
  if (isNextDay) {
    // 00:00~01:00은 익일 일주 사용
    const nextJdn = toJDN(year, month, day) + 1;
    const nextDate = jdnToGregorian(nextJdn);
    dayYear = nextDate.year;
    dayMonth = nextDate.month;
    dayDay = nextDate.day;
  }

  const dayP = dayPillar(dayYear, dayMonth, dayDay);
  const dayStemIdx = HEAVENLY_STEMS.indexOf(dayP.stem as typeof HEAVENLY_STEMS[number]);

  // 년주/월주는 원래 생년월일 기준
  const { sajuMonth, sajuYear } = getSajuMonth(year, month, day);
  const yearP = yearPillar(sajuYear);
  const yearStemIdx = HEAVENLY_STEMS.indexOf(yearP.stem as typeof HEAVENLY_STEMS[number]);
  const monthP = monthPillar(yearStemIdx, sajuMonth);

  // 시주 계산
  const hourP = hourPillar(dayStemIdx, hourBranchIdx);

  return {
    year: yearP,
    month: monthP,
    day: dayP,
    hour: hourP,
  };
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
