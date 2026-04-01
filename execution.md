# 운명 캐릭터카드 - 실행 계획 (Execution)

## 전체 로드맵

```
Phase 1: 프로젝트 셋업 & Claude 연동
Phase 2: 프롬프트 엔지니어링 & API 구현
Phase 3: Frontend UI 구현
Phase 4: 통합 테스트 & 마무리
```

> 기존 5단계에서 4단계로 축소.
> 복잡한 계산 엔진(만세력, 납음오행표, 광도표 등) 직접 구현 불필요.
> Claude AI가 사주/자미두수/수비학 계산과 교차검증을 모두 수행.

---

## Phase 1: 프로젝트 셋업 & Claude 연동

### 1.1 프로젝트 초기화
- [ ] Next.js 14+ 프로젝트 생성 (TypeScript, Tailwind CSS, App Router)
- [ ] ESLint, Prettier 설정
- [ ] 디렉토리 구조 생성
  ```
  src/
  ├── app/
  │   ├── page.tsx
  │   ├── result/page.tsx
  │   ├── mbti-test/page.tsx
  │   └── api/analyze/route.ts
  ├── lib/
  │   ├── claude/
  │   │   ├── client.ts
  │   │   ├── prompts/
  │   │   │   ├── system.ts
  │   │   │   └── schema.ts
  │   │   └── parser.ts
  │   └── types/
  │       ├── input.ts
  │       ├── response.ts
  │       └── character-card.ts
  └── components/
  ```
- [ ] TypeScript 타입 정의 (입력, Claude 응답, 캐릭터카드)

### 1.2 의존성 설치
- [ ] `@anthropic-ai/sdk` — Claude API 클라이언트
- [ ] `recharts` — 레이더 차트
- [ ] `framer-motion` — 애니메이션
- [ ] `html2canvas` — 카드 이미지 저장
- [ ] `zod` — 응답 JSON 유효성 검증

### 1.3 Claude API 연동
- [x] Claude Max OAuth 토큰 자동 사용 (API 키 입력 불필요)
  - `~/.claude/.credentials.json`에서 OAuth accessToken 자동 읽기
  - 환경변수 `ANTHROPIC_API_KEY` 설정 시 우선 사용
- [x] `src/lib/claude/client.ts` — Anthropic SDK 초기화
  ```typescript
  import Anthropic from '@anthropic-ai/sdk';
  const client = new Anthropic({ apiKey: getApiKey() });
  ```
- [x] 기본 호출 테스트 완료
- [x] 에러 핸들링 & 재시도 로직 (429 rate limit, 파싱 실패 재시도)

---

## Phase 2: 프롬프트 엔지니어링 & API 구현

### 2.1 시스템 프롬프트 작성 (`src/lib/claude/prompts/system.ts`)
- [ ] 전문가 역할 정의 (사주/자미두수/수비학/MBTI)
- [ ] 사주 분석 규칙 명시 (절기 기준, 년간→월간, 일간→시간 산출법)
- [ ] 자미두수 분석 규칙 명시 (명궁 산출, 납음오행, 사화 배당표)
- [ ] 수비학 분석 규칙 명시 (Pythagorean 매핑, 마스터넘버 보존)
- [ ] 교차검증 규칙 명시 (8축 정의, 갈등 유형 4가지)
- [ ] 핵심 참조 테이블 포함 (지장간, 사화배당표 등)

### 2.2 응답 스키마 정의 (`src/lib/claude/prompts/schema.ts`)
- [ ] `ClaudeResponse` 인터페이스 정의
- [ ] Zod 스키마로 런타임 유효성 검증
- [ ] Claude에게 전달할 JSON 스키마 문자열 생성

### 2.3 프롬프트 조립 함수
- [ ] `buildUserPrompt(input: AnalysisInput): string`
  - 입력 데이터를 포맷팅하여 프롬프트 생성
  - 시진 이름 변환 (14시 → "미시(未時, 13:00~15:00)")
  - 현재 연도 정보 포함 (올해 운세용)
- [ ] 프롬프트 토큰 수 최적화 (불필요한 반복 제거)

### 2.4 API 라우트 구현 (`src/app/api/analyze/route.ts`)
- [ ] POST 핸들러 구현
- [ ] 입력 데이터 유효성 검증 (Zod)
- [ ] Claude API 호출 (시스템 프롬프트 + 사용자 프롬프트)
  ```typescript
  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userPrompt }],
  });
  ```
- [ ] 응답 JSON 파싱 & Zod 유효성 검증
- [ ] 파싱 실패 시 재시도 (1회)
- [ ] 에러 응답 처리 (400/500)

### 2.5 프롬프트 품질 테스트
- [ ] 테스트 케이스 5개 이상 실행
  - 다양한 생년월일/시간/성별/이름 조합
  - 모든 MBTI 유형 그룹 (NT/NF/ST/SF)
  - 결과 JSON 스키마 준수 여부 확인
- [ ] 사주 계산 정확도 검증 (알려진 사주 사이트와 비교)
- [ ] 자미두수 명궁/주성 검증
- [ ] 수비학 숫자 계산 검증
- [ ] 교차검증 일관성 확인 (같은 입력 → 유사한 결과)

### 2.6 스트리밍 응답 (선택)
- [ ] `client.messages.stream()` 사용
- [ ] SSE(Server-Sent Events)로 프론트에 실시간 전달
- [ ] 부분 응답 파싱하여 단계별 표시

---

## Phase 3: Frontend UI 구현

### 3.1 공통 컴포넌트 (`src/components/`)
- [ ] `Layout.tsx` — 전체 레이아웃 (헤더, 배경)
- [ ] `RadarChart.tsx` — 8축 레이더 차트 (Recharts 래핑)
- [ ] `TraitBar.tsx` — 특성 점수 바
- [ ] `SystemBadge.tsx` — 시스템별 결과 뱃지

### 3.2 입력 페이지 (`src/app/page.tsx`)
- [ ] 생년월일 입력 (DatePicker 또는 select 3개)
- [ ] 출생 시간 선택 (시진 단위 드롭다운: 자시~해시, 12개)
- [ ] 성별 선택 (남/여 버튼)
- [ ] 이름 입력 (한글 필수, 영문 선택)
- [ ] MBTI 입력 방식 선택
  - 직접 선택: 4축 버튼 (E/I, S/N, T/F, J/P)
  - 간이 설문: `/mbti-test`로 이동
  - "모름" 선택 시: Claude에게 사주/자미 기반 추정 요청
- [ ] 폼 유효성 검사 & 제출

### 3.3 MBTI 설문 페이지 (`src/app/mbti-test/page.tsx`)
- [ ] 20문항 순차 표시 (각 축 5문항, 5점 리커트)
- [ ] 진행률 바
- [ ] 프론트엔드에서 점수 합산 → 유형 결정
- [ ] 결과 확인 후 메인 폼으로 자동 복귀

### 3.4 로딩 상태
- [ ] Claude API 호출 중 로딩 UI
- [ ] 단계별 메시지 전환 애니메이션
  - "사주팔자를 풀어보고 있습니다..."
  - "자미두수 명반을 배치하고 있습니다..."
  - "수비학 운명수를 계산하고 있습니다..."
  - "네 가지 운명을 교차검증하고 있습니다..."
- [ ] 타임아웃 처리 (30초)

### 3.5 결과 페이지 (`src/app/result/page.tsx`)
- [ ] `CharacterCardView.tsx` — 메인 캐릭터카드
  - 아키타입 이름 & 부제 (대표 색상 배경)
  - 8축 레이더 차트
  - 핵심 특성 태그 (3개)
  - 대표 오행 & 색상
- [ ] `StrengthWeakness.tsx` — 강점/약점 리스트
- [ ] `HiddenSide.tsx` — 숨겨진 면 섹션
- [ ] `SystemDetail.tsx` — 시스템별 상세 (접이식)
  - 사주: 사주 기둥 시각화 (4주 × 천간/지지), 오행 분포 바 차트
  - 자미두수: 명궁 주성, 주요 궁 요약
  - 수비학: 각 숫자 & 의미 카드
  - MBTI: 유형 설명 & 인지기능
- [ ] `CrossCheckView.tsx` — 교차검증 결과
  - 일치도 게이지 (원형 프로그레스)
  - 갈등 지점 카드 (잠재/개발/이중성/긴장)
- [ ] `FortuneSection.tsx` — 인생 조언 & 올해 운세
- [ ] `ShareButton.tsx` — 카드 이미지 저장/공유 (html2canvas)

### 3.6 반응형 디자인
- [ ] 모바일 최적화 (카드 세로 레이아웃)
- [ ] 태블릿/데스크톱 레이아웃

---

## Phase 4: 통합 테스트 & 마무리

### 4.1 테스트
- [ ] API 엔드투엔드 테스트 (다양한 입력 조합)
- [ ] Claude 응답 파싱 안정성 테스트
- [ ] UI 컴포넌트 렌더링 테스트
- [ ] 모바일/데스크톱 크로스 브라우저 테스트
- [ ] 실제 사용자 3~5명 피드백 수집

### 4.2 최적화
- [ ] Claude 프롬프트 토큰 최적화
- [ ] 동일 입력 결과 캐싱 (선택, localStorage 또는 서버)
- [ ] 이미지/폰트 최적화
- [ ] SEO 메타 태그 (OG 이미지)
- [ ] 에러 페이지 (API 실패, 잘못된 입력 등)

### 4.3 배포
- [ ] Vercel 배포 설정
- [ ] 환경변수 설정 (ANTHROPIC_API_KEY 또는 Claude Max OAuth 토큰 자동 사용)
- [ ] 도메인 연결 (선택)

---

## 구현 우선순위 & 의존성

```
Phase 1 (셋업) ──→ Phase 2 (프롬프트 & API)
                         ↓
                   Phase 3 (Frontend) ← 입력 UI는 Phase 2와 병렬 가능
                         ↓
                   Phase 4 (테스트 & 배포)
```

### 병렬 작업 가능 영역
- Phase 2 프롬프트 작성 중 Phase 3 입력 UI 병렬 개발
- Phase 3 결과 UI는 목업 JSON으로 선행 개발 가능
- MBTI 설문 페이지는 완전히 독립적으로 개발 가능

---

## 기존 방식 대비 변경점

| 항목 | 기존 (자체 엔진) | 변경 (Claude AI) |
|------|----------------|-----------------|
| 만세력 데이터 | JSON 파일 구축 필요 | 불필요 (Claude 지식) |
| 납음오행표/광도표 | 룩업 테이블 구현 | 불필요 (Claude 지식) |
| 사주 계산 로직 | 직접 알고리즘 구현 | Claude가 계산 |
| 자미두수 성반 배치 | 복잡한 배치 로직 구현 | Claude가 배치 |
| 수비학 계산 | 직접 구현 | Claude가 계산 |
| 교차검증 | 점수 정규화/가중평균 구현 | Claude가 통합 판단 |
| 해석 텍스트 | 템플릿 기반 조합 | Claude가 자연어 생성 |
| 데이터 파일 수 | ~15개 | 0개 |
| 구현 복잡도 | 매우 높음 | 낮음 (프롬프트 중심) |
| 핵심 작업 | 계산 엔진 코딩 | 프롬프트 엔지니어링 |
| 비용 | 서버 비용만 | Claude API 토큰 비용 |
| 정확도 리스크 | 구현 버그 | 프롬프트 품질 |

---

## 핵심 리스크 & 대응

| 리스크 | 영향도 | 대응 |
|--------|-------|------|
| Claude 사주 계산 오류 | 높음 | 프롬프트에 핵심 참조표 포함, 5건 이상 검증 |
| 응답 JSON 파싱 실패 | 중간 | Zod 스키마 검증, 재시도 1회, fallback UI |
| API 응답 지연 (>10초) | 중간 | 스트리밍 응답, 단계별 로딩 UI |
| 토큰 비용 | 낮음 | Claude Max OAuth 토큰 자동 사용, sonnet 모델 우선 |
| 동일 입력 다른 결과 | 중간 | temperature 0으로 설정, 핵심 수치는 프롬프트에서 고정 |

---

## MVP 범위 (최소 기능)

**MVP에 포함:**
- 입력 폼 (생년월일시, 성별, 이름, MBTI 직접 선택)
- Claude API 1회 호출 → 4개 시스템 통합 분석
- 캐릭터카드 1장 출력 (아키타입, 레이더 차트, 강점/약점)
- 시스템별 요약 (접이식 패널)
- 교차검증 일치도

**MVP에서 제외 (후속 구현):**
- MBTI 간이 설문
- 카드 이미지 저장/공유
- 스트리밍 응답
- 대운/세운 흐름 분석
- 궁합/호환성 비교
- 결과 캐싱
