/**
 * 타로 78장 덱 (메이저 22 + 마이너 56)
 */

export type Arcana = "major" | "minor";
export type Suit = "wands" | "cups" | "swords" | "pentacles";

export interface TarotCard {
  id: number;
  name: { en: string; ko: string };
  arcana: Arcana;
  suit?: Suit;
  number?: number | string; // 1-10 또는 Page/Knight/Queen/King
  keywords: string[];
  meaning: string; // 정방향 의미 (1문장)
}

// ── 메이저 아르카나 (22장) ───────────────────────────
const MAJOR: TarotCard[] = [
  { id: 0, name: { en: "The Fool", ko: "바보" }, arcana: "major", keywords: ["새 시작", "순수", "모험"], meaning: "미지의 세계로 향하는 순수한 출발과 자유로운 도약." },
  { id: 1, name: { en: "The Magician", ko: "마법사" }, arcana: "major", keywords: ["창조", "의지", "실행"], meaning: "의지와 자원을 결합해 무엇이든 만들어낼 수 있는 창조의 힘." },
  { id: 2, name: { en: "The High Priestess", ko: "여사제" }, arcana: "major", keywords: ["직관", "비밀", "내면"], meaning: "내면의 지혜와 무의식의 메시지에 귀 기울여야 할 시기." },
  { id: 3, name: { en: "The Empress", ko: "여황제" }, arcana: "major", keywords: ["풍요", "모성", "창조성"], meaning: "풍요로움과 사랑이 넘쳐 결실을 맺는 시기." },
  { id: 4, name: { en: "The Emperor", ko: "황제" }, arcana: "major", keywords: ["권위", "질서", "안정"], meaning: "구조와 규율을 세워 안정된 기반을 다지는 힘." },
  { id: 5, name: { en: "The Hierophant", ko: "교황" }, arcana: "major", keywords: ["전통", "가르침", "신념"], meaning: "전통과 가르침을 따라 정통의 길을 걷는다." },
  { id: 6, name: { en: "The Lovers", ko: "연인" }, arcana: "major", keywords: ["사랑", "선택", "조화"], meaning: "마음을 다한 결합과 중대한 선택의 순간." },
  { id: 7, name: { en: "The Chariot", ko: "전차" }, arcana: "major", keywords: ["승리", "의지", "전진"], meaning: "강한 의지로 장애를 뚫고 나아가는 전진과 승리." },
  { id: 8, name: { en: "Strength", ko: "힘" }, arcana: "major", keywords: ["용기", "인내", "온화함"], meaning: "부드러운 힘과 인내로 내면의 야성을 다스린다." },
  { id: 9, name: { en: "The Hermit", ko: "은둔자" }, arcana: "major", keywords: ["성찰", "지혜", "고독"], meaning: "내면을 깊이 성찰하며 진리를 찾는 고독의 시기." },
  { id: 10, name: { en: "Wheel of Fortune", ko: "운명의 수레바퀴" }, arcana: "major", keywords: ["전환", "운명", "순환"], meaning: "운명의 큰 흐름이 변화를 가져오는 전환점." },
  { id: 11, name: { en: "Justice", ko: "정의" }, arcana: "major", keywords: ["공정", "균형", "진실"], meaning: "원인과 결과의 공정한 균형, 진실이 드러난다." },
  { id: 12, name: { en: "The Hanged Man", ko: "매달린 사람" }, arcana: "major", keywords: ["희생", "관점 전환", "기다림"], meaning: "관점을 뒤집어 새로운 통찰을 얻기 위한 멈춤." },
  { id: 13, name: { en: "Death", ko: "죽음" }, arcana: "major", keywords: ["종결", "변화", "재생"], meaning: "한 단계의 끝과 새로운 시작을 위한 본질적 변화." },
  { id: 14, name: { en: "Temperance", ko: "절제" }, arcana: "major", keywords: ["조화", "인내", "치유"], meaning: "상반된 것을 조화시키며 치유와 균형을 찾는다." },
  { id: 15, name: { en: "The Devil", ko: "악마" }, arcana: "major", keywords: ["속박", "유혹", "집착"], meaning: "욕망과 집착에 사로잡힌 그림자, 자각이 필요한 때." },
  { id: 16, name: { en: "The Tower", ko: "탑" }, arcana: "major", keywords: ["붕괴", "충격", "해방"], meaning: "거짓된 구조의 갑작스런 붕괴와 해방의 충격." },
  { id: 17, name: { en: "The Star", ko: "별" }, arcana: "major", keywords: ["희망", "치유", "영감"], meaning: "어둠 뒤에 찾아오는 희망과 영감의 빛." },
  { id: 18, name: { en: "The Moon", ko: "달" }, arcana: "major", keywords: ["불안", "환상", "직관"], meaning: "불확실함 속에서 직관과 무의식이 길을 비춘다." },
  { id: 19, name: { en: "The Sun", ko: "태양" }, arcana: "major", keywords: ["기쁨", "성공", "활력"], meaning: "밝은 성공과 기쁨, 모든 것이 명료하게 드러난다." },
  { id: 20, name: { en: "Judgement", ko: "심판" }, arcana: "major", keywords: ["부활", "각성", "소명"], meaning: "지난 삶을 돌아보고 새로운 소명에 응답한다." },
  { id: 21, name: { en: "The World", ko: "세계" }, arcana: "major", keywords: ["완성", "성취", "통합"], meaning: "한 사이클의 완성과 통합, 다음 단계로의 진입." },
];

// ── 마이너 아르카나 (56장) ───────────────────────────
// 4 슈트 × (Ace, 2~10, Page, Knight, Queen, King) = 14장씩

interface SuitMeta {
  suit: Suit;
  ko: string;
  en: string;
  themes: Record<string | number, { keywords: string[]; meaning: string }>;
}

const SUIT_DATA: SuitMeta[] = [
  {
    suit: "wands",
    ko: "지팡이",
    en: "Wands",
    themes: {
      1: { keywords: ["영감", "출발", "열정"], meaning: "새로운 열정과 영감이 솟아나는 출발점." },
      2: { keywords: ["계획", "선택", "전망"], meaning: "원대한 비전을 그리며 다음 행보를 계획한다." },
      3: { keywords: ["확장", "기회", "진취"], meaning: "기회가 넓어지고 사업·여정이 확장된다." },
      4: { keywords: ["축하", "안정", "기반"], meaning: "노력의 결실을 함께 축하하는 안정된 기반." },
      5: { keywords: ["경쟁", "갈등", "도전"], meaning: "이해관계의 충돌과 경쟁의 긴장." },
      6: { keywords: ["승리", "인정", "성취"], meaning: "노력이 결실을 맺어 인정과 승리를 얻는다." },
      7: { keywords: ["방어", "용기", "도전"], meaning: "자신의 입장을 지키며 도전에 맞서는 용기." },
      8: { keywords: ["속도", "전개", "메시지"], meaning: "상황이 빠르게 전개되며 소식이 도착한다." },
      9: { keywords: ["인내", "경계", "마지막 고비"], meaning: "지친 가운데서도 마지막 고비를 견뎌내는 끈기." },
      10: { keywords: ["부담", "책임", "과중"], meaning: "짊어진 책임이 무겁지만 목표가 가까이 있다." },
      Page: { keywords: ["호기심", "탐색", "메시지"], meaning: "새로운 가능성에 대한 호기심과 탐색의 시작." },
      Knight: { keywords: ["행동", "추진", "모험"], meaning: "거침없는 추진력과 모험심으로 돌진한다." },
      Queen: { keywords: ["카리스마", "자신감", "활력"], meaning: "따뜻한 카리스마로 주위를 이끄는 활기." },
      King: { keywords: ["리더십", "비전", "결단"], meaning: "원대한 비전과 결단력으로 사람들을 이끈다." },
    },
  },
  {
    suit: "cups",
    ko: "컵",
    en: "Cups",
    themes: {
      1: { keywords: ["사랑", "감정", "충만"], meaning: "감정의 새로운 시작과 사랑의 충만함." },
      2: { keywords: ["결합", "조화", "관계"], meaning: "두 마음이 어우러지는 결합과 상호 이해." },
      3: { keywords: ["축하", "우정", "공동체"], meaning: "기쁜 일을 함께 나누는 축하와 우정." },
      4: { keywords: ["권태", "재평가", "성찰"], meaning: "현재에 만족하지 못하고 의미를 다시 묻는다." },
      5: { keywords: ["상실", "후회", "회복의 씨앗"], meaning: "잃은 것에 슬퍼하지만 남은 가능성도 분명하다." },
      6: { keywords: ["추억", "순수", "재회"], meaning: "옛 인연·추억과의 따스한 재회." },
      7: { keywords: ["선택", "환상", "혼란"], meaning: "여러 가능성 앞에서 진실을 분별해야 한다." },
      8: { keywords: ["떠남", "성숙", "전환"], meaning: "지금을 떠나 더 깊은 의미를 찾아 나선다." },
      9: { keywords: ["만족", "행복", "성취"], meaning: "바라던 것을 이룬 깊은 만족과 행복." },
      10: { keywords: ["가족", "조화", "완성"], meaning: "정서적 충만함과 가정·관계의 완성." },
      Page: { keywords: ["감수성", "메시지", "영감"], meaning: "마음이 열리고 따뜻한 영감과 소식이 찾아온다." },
      Knight: { keywords: ["로맨스", "제안", "진심"], meaning: "진심 어린 제안과 로맨틱한 행보." },
      Queen: { keywords: ["공감", "직관", "포용"], meaning: "깊은 공감과 직관으로 상대를 품는다." },
      King: { keywords: ["성숙", "균형", "감정 통제"], meaning: "감정을 다스리며 안정된 따뜻함을 유지한다." },
    },
  },
  {
    suit: "swords",
    ko: "검",
    en: "Swords",
    themes: {
      1: { keywords: ["통찰", "결단", "진실"], meaning: "명료한 통찰과 결단의 검이 솟아오른다." },
      2: { keywords: ["딜레마", "균형", "회피"], meaning: "선택을 미루며 균형 속에 갇혀 있다." },
      3: { keywords: ["상심", "이별", "고통"], meaning: "마음을 베는 상실과 고통의 시기." },
      4: { keywords: ["휴식", "회복", "명상"], meaning: "잠시 멈춰 회복과 재정비가 필요한 시기." },
      5: { keywords: ["갈등", "패배", "대가"], meaning: "이겨도 잃는 것이 많은 갈등의 결말." },
      6: { keywords: ["이행", "이주", "전환"], meaning: "어려움을 뒤로하고 더 평온한 곳으로 이동." },
      7: { keywords: ["전략", "기만", "회피"], meaning: "정공법보다 우회와 전략이 필요한 상황." },
      8: { keywords: ["속박", "두려움", "제한"], meaning: "스스로 만든 두려움에 묶여 있는 상태." },
      9: { keywords: ["불안", "악몽", "근심"], meaning: "마음 속 불안과 근심에 잠 못 드는 밤." },
      10: { keywords: ["바닥", "종결", "재시작"], meaning: "최악의 끝, 그러나 새로운 시작의 전조." },
      Page: { keywords: ["호기심", "관찰", "기민함"], meaning: "예리하게 관찰하며 진실을 탐구한다." },
      Knight: { keywords: ["돌진", "결단", "성급함"], meaning: "거침없이 돌진하지만 신중함도 필요하다." },
      Queen: { keywords: ["명료", "독립", "냉철"], meaning: "감정을 절제한 명료한 판단과 독립." },
      King: { keywords: ["권위", "논리", "공정"], meaning: "이성과 논리로 공정한 결정을 내린다." },
    },
  },
  {
    suit: "pentacles",
    ko: "동전",
    en: "Pentacles",
    themes: {
      1: { keywords: ["기회", "물질", "기반"], meaning: "물질적 기회와 안정된 기반이 시작된다." },
      2: { keywords: ["균형", "조정", "유연성"], meaning: "여러 일을 동시에 다루며 균형을 잡는다." },
      3: { keywords: ["협력", "기술", "성장"], meaning: "협업과 숙련으로 성과를 만들어간다." },
      4: { keywords: ["보존", "안정", "집착"], meaning: "안정을 지키려는 마음이 때로 집착이 된다." },
      5: { keywords: ["결핍", "고립", "재정난"], meaning: "물질적·정서적 결핍 속의 고립감." },
      6: { keywords: ["나눔", "균형", "관대함"], meaning: "주고받음의 균형과 관대한 나눔." },
      7: { keywords: ["기다림", "재평가", "투자"], meaning: "장기적 결실을 위해 인내하며 평가한다." },
      8: { keywords: ["숙련", "노력", "장인정신"], meaning: "묵묵한 노력으로 실력을 다지는 시기." },
      9: { keywords: ["풍요", "독립", "여유"], meaning: "스스로 일군 풍요와 우아한 여유." },
      10: { keywords: ["유산", "안정", "가문"], meaning: "장기적 안정과 가족·유산의 풍요." },
      Page: { keywords: ["배움", "기회", "착실함"], meaning: "새로운 배움과 착실한 기회의 시작." },
      Knight: { keywords: ["성실", "근면", "꾸준함"], meaning: "느리지만 확실한 성실함의 행보." },
      Queen: { keywords: ["풍요", "돌봄", "현실감"], meaning: "현실적 감각으로 풍요와 돌봄을 베푼다." },
      King: { keywords: ["성공", "안정", "관리"], meaning: "물질적 성공과 안정된 경영의 위엄." },
    },
  },
];

const COURT_NAMES: Record<string, string> = {
  Page: "시종",
  Knight: "기사",
  Queen: "여왕",
  King: "왕",
};

function buildMinor(): TarotCard[] {
  const cards: TarotCard[] = [];
  let id = 22;
  for (const suit of SUIT_DATA) {
    for (const key of [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, "Page", "Knight", "Queen", "King"] as const) {
      const t = suit.themes[key];
      const enNumber = key === 1 ? "Ace" : String(key);
      const koNumber = key === 1 ? "에이스" : typeof key === "number" ? `${key}` : COURT_NAMES[key];
      cards.push({
        id: id++,
        name: {
          en: `${enNumber} of ${suit.en}`,
          ko: `${suit.ko} ${koNumber}`,
        },
        arcana: "minor",
        suit: suit.suit,
        number: key,
        keywords: t.keywords,
        meaning: t.meaning,
      });
    }
  }
  return cards;
}

export const TAROT_DECK: TarotCard[] = [...MAJOR, ...buildMinor()];

/** 덱 셔플 (Fisher–Yates) */
export function shuffleDeck<T>(deck: T[], seed?: number): T[] {
  const arr = [...deck];
  let rand = seed !== undefined ? mulberry32(seed) : Math.random;
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** 5장 스프레드 위치 의미 */
export const SPREAD_POSITIONS = [
  { idx: 0, label: "과거", en: "Past", desc: "현재 상황의 뿌리" },
  { idx: 1, label: "현재", en: "Present", desc: "지금 마주한 핵심" },
  { idx: 2, label: "미래", en: "Future", desc: "흐름이 향하는 방향" },
  { idx: 3, label: "원인", en: "Cause", desc: "근본 동인 또는 숨은 영향" },
  { idx: 4, label: "결과", en: "Outcome", desc: "최종 도달 가능한 결말" },
] as const;
