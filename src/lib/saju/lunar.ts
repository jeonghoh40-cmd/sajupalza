/**
 * 음력(陰曆) → 양력(陽曆) 변환
 * - 범위: 1900 ~ 2100
 * - 표준 Chinese Lunar Calendar 룩업 테이블 사용
 * - 각 년도 20비트 인코딩:
 *   · bits 0-3 : 윤달 위치 (0 = 윤달 없음)
 *   · bits 4-15: 각 월의 크기 (bit15 = 1월, bit4 = 12월; 1 = 큰달 30일, 0 = 작은달 29일)
 *   · bit 16   : 윤달 크기 (1 = 30일, 0 = 29일)
 */

// prettier-ignore
const LUNAR_INFO: number[] = [
  0x04bd8,0x04ae0,0x0a570,0x054d5,0x0d260,0x0d950,0x16554,0x056a0,0x09ad0,0x055d2, // 1900-1909
  0x04ae0,0x0a5b6,0x0a4d0,0x0d250,0x1d255,0x0b540,0x0d6a0,0x0ada2,0x095b0,0x14977, // 1910-1919
  0x04970,0x0a4b0,0x0b4b5,0x06a50,0x06d40,0x1ab54,0x02b60,0x09570,0x052f2,0x04970, // 1920-1929
  0x06566,0x0d4a0,0x0ea50,0x06e95,0x05ad0,0x02b60,0x186e3,0x092e0,0x1c8d7,0x0c950, // 1930-1939
  0x0d4a0,0x1d8a6,0x0b550,0x056a0,0x1a5b4,0x025d0,0x092d0,0x0d2b2,0x0a950,0x0b557, // 1940-1949
  0x06ca0,0x0b550,0x15355,0x04da0,0x0a5b0,0x14573,0x052b0,0x0a9a8,0x0e950,0x06aa0, // 1950-1959
  0x0aea6,0x0ab50,0x04b60,0x0aae4,0x0a570,0x05260,0x0f263,0x0d950,0x05b57,0x056a0, // 1960-1969
  0x096d0,0x04dd5,0x04ad0,0x0a4d0,0x0d4d4,0x0d250,0x0d558,0x0b540,0x0b5a0,0x195a6, // 1970-1979
  0x095b0,0x049b0,0x0a974,0x0a4b0,0x0b27a,0x06a50,0x06d40,0x0af46,0x0ab60,0x09570, // 1980-1989
  0x04af5,0x04970,0x064b0,0x074a3,0x0ea50,0x06b58,0x055c0,0x0ab60,0x096d5,0x092e0, // 1990-1999
  0x0c960,0x0d954,0x0d4a0,0x0da50,0x07552,0x056a0,0x0abb7,0x025d0,0x092d0,0x0cab5, // 2000-2009
  0x0a950,0x0b4a0,0x0baa4,0x0ad50,0x055d9,0x04ba0,0x0a5b0,0x15176,0x052b0,0x0a930, // 2010-2019
  0x07954,0x06aa0,0x0ad50,0x05b52,0x04b60,0x0a6e6,0x0a4e0,0x0d260,0x0ea65,0x0d530, // 2020-2029
  0x05aa0,0x076a3,0x096d0,0x04afb,0x04ad0,0x0a4d0,0x1d0b6,0x0d250,0x0d520,0x0dd45, // 2030-2039
  0x0b5a0,0x056d0,0x055b2,0x049b0,0x0a577,0x0a4b0,0x0aa50,0x1b255,0x06d20,0x0ada0, // 2040-2049
  0x14b63,0x09370,0x049f8,0x04970,0x064b0,0x168a6,0x0ea50,0x06b20,0x1a6c4,0x0aae0, // 2050-2059
  0x0a2e0,0x0d2e3,0x0c960,0x0d557,0x0d4a0,0x0da50,0x05d55,0x056a0,0x0a6d0,0x055d4, // 2060-2069
  0x052d0,0x0a9b8,0x0a950,0x0b4a0,0x0b6a6,0x0ad50,0x055a0,0x0aba4,0x0a5b0,0x052b0, // 2070-2079
  0x0b273,0x06930,0x07337,0x06aa0,0x0ad50,0x14b55,0x04b60,0x0a570,0x054e4,0x0d160, // 2080-2089
  0x0e968,0x0d520,0x0daa0,0x16aa6,0x056d0,0x04ae0,0x0a9d4,0x0a2d0,0x0d150,0x0f252, // 2090-2099
  0x0d520, // 2100
];

const BASE_YEAR = 1900;
// 음력 1900-01-01 = 양력 1900-01-31, JDN 2415051
const LUNAR_EPOCH_JDN = 2415051;

function leapMonth(year: number): number {
  return LUNAR_INFO[year - BASE_YEAR] & 0xf;
}

function leapDays(year: number): number {
  if (leapMonth(year) === 0) return 0;
  return LUNAR_INFO[year - BASE_YEAR] & 0x10000 ? 30 : 29;
}

/** 지정된 음력 년도의 지정된 월(평월)의 일수 */
function monthDays(year: number, month: number): number {
  return LUNAR_INFO[year - BASE_YEAR] & (0x10000 >> month) ? 30 : 29;
}

/** 지정된 음력 년도의 총 일수 (윤달 포함) */
function yearLunarDays(year: number): number {
  let sum = 348; // 12 * 29
  for (let i = 0x8000; i > 0x8; i >>= 1) {
    sum += LUNAR_INFO[year - BASE_YEAR] & i ? 1 : 0;
  }
  return sum + leapDays(year);
}

/** JDN → 그레고리력 */
function jdnToGregorian(jdn: number): { year: number; month: number; day: number } {
  const a = jdn + 32044;
  const b = Math.floor((4 * a + 3) / 146097);
  const c = a - Math.floor((146097 * b) / 4);
  const d = Math.floor((4 * c + 3) / 1461);
  const e = c - Math.floor((1461 * d) / 4);
  const m = Math.floor((5 * e + 2) / 153);
  const day = e - Math.floor((153 * m + 2) / 5) + 1;
  const month = m + 3 - 12 * Math.floor(m / 10);
  const year = 100 * b + d - 4800 + Math.floor(m / 10);
  return { year, month, day };
}

/**
 * 음력 날짜를 양력으로 변환
 * @param lunarYear 음력 년
 * @param lunarMonth 음력 월 (1~12)
 * @param lunarDay 음력 일
 * @param isLeap true면 해당 월이 윤달임을 지정 (기본 false)
 */
export function lunarToSolar(
  lunarYear: number,
  lunarMonth: number,
  lunarDay: number,
  isLeap: boolean = false,
): { year: number; month: number; day: number } {
  if (lunarYear < BASE_YEAR || lunarYear > BASE_YEAR + LUNAR_INFO.length - 1) {
    throw new Error(`음력 변환 지원 범위 초과: ${lunarYear}`);
  }

  let offset = 0;

  // (1) 이전 년도들의 총 일수
  for (let y = BASE_YEAR; y < lunarYear; y++) {
    offset += yearLunarDays(y);
  }

  const lm = leapMonth(lunarYear);

  // (2) 해당 년도 내 이전 월들의 일수
  for (let m = 1; m < lunarMonth; m++) {
    offset += monthDays(lunarYear, m);
    // 평월 lm 다음에 윤달 lm이 위치하므로, 목표 월이 윤달 이후라면 윤달 일수도 더함
    if (m === lm) {
      offset += leapDays(lunarYear);
    }
  }

  // (3) 목표가 윤달 자체인 경우: 평월 lm 일수를 한 번 더 더함
  if (isLeap && lunarMonth === lm) {
    offset += monthDays(lunarYear, lunarMonth);
  }

  offset += lunarDay - 1;

  return jdnToGregorian(LUNAR_EPOCH_JDN + offset);
}
