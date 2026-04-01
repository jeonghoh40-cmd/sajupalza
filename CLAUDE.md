# 사주팔자 - 운명 캐릭터카드 프로젝트

## 프로젝트 개요
사주(四柱), 자미두수(紫微斗數), 수비학(Numerology), MBTI 4가지 시스템을 교차검증하여
통합 **운명 캐릭터카드**를 생성하는 웹 애플리케이션.

**핵심 전략**: 복잡한 역학 계산 엔진을 직접 구현하지 않고,
**Claude AI (Anthropic API, Claude Max 토큰)**에게 분석을 요청하여 결과를 받는 구조.
Claude의 사주/자미두수/수비학 도메인 지식을 활용하여 정확도와 개발 속도를 동시에 확보.

## 기술 스택
- **Frontend**: Next.js 14+ (App Router), TypeScript, Tailwind CSS, Recharts (레이더 차트)
- **Backend**: Next.js API Routes (서버리스)
- **AI 엔진**: Anthropic Claude API (`@anthropic-ai/sdk`) — Claude Max 토큰 사용
- **데이터**: Claude 응답 기반 (룩업 테이블 불필요)
- **배포**: Vercel

## 프로젝트 구조
```
sajupalza/
├── CLAUDE.md              # 이 파일
├── plan.md                # 설계 문서
├── execution.md           # 실행 계획
├── src/
│   ├── app/               # Next.js App Router
│   │   ├── page.tsx       # 메인 입력 페이지
│   │   ├── result/        # 결과 페이지
│   │   └── api/           # API 라우트
│   │       └── analyze/   # Claude AI 분석 API
│   ├── lib/
│   │   ├── claude/        # Claude API 클라이언트 & 프롬프트
│   │   │   ├── client.ts  # Anthropic SDK 클라이언트
│   │   │   ├── prompts/   # 시스템 프롬프트 (사주/자미/수비학/MBTI/통합)
│   │   │   └── parser.ts  # Claude 응답 JSON 파싱
│   │   └── types/         # TypeScript 타입 정의
│   ├── components/        # UI 컴포넌트
│   └── public/            # 정적 에셋
└── tests/                 # 테스트
```

## 핵심 규칙

### 코드 컨벤션
- TypeScript strict mode 사용
- 한국어 주석 허용, 변수/함수명은 영문 camelCase
- 도메인 용어는 한자 병기 (예: `heavenlyStem // 천간(天干)`)
- Claude 프롬프트는 `src/lib/claude/prompts/` 폴더에 분리 관리

### Claude API 사용 규칙
- 모델: `claude-sonnet-4-6` (비용 효율) 또는 `claude-opus-4-6` (최고 정확도)
- **API 키 입력 불필요**: Claude Max 구독의 OAuth 토큰(`~/.claude/.credentials.json`)을 자동 사용
- 환경변수 `ANTHROPIC_API_KEY` 설정 시 우선 사용
- 응답은 반드시 **Structured JSON** 형태로 요청
- 프롬프트에 도메인 전문 지식과 출력 스키마를 상세히 명시
- 토큰 절약을 위해 4개 시스템 분석을 **한 번의 호출**로 통합 가능
- 에러 시 재시도 로직 포함 (최대 1회)

### 도메인 용어 통일
| 한국어 | 영문 코드명 | 설명 |
|--------|------------|------|
| 사주 | saju | 四柱 (Four Pillars) |
| 자미두수 | ziwei | 紫微斗數 (Purple Star Astrology) |
| 수비학 | numerology | Numerology |
| 캐릭터카드 | characterCard | 최종 통합 결과물 |
| 통합 특성 | unifiedTraits | 8축 레이더 차트 데이터 |

### 입력 데이터
- 생년월일시 (양력 기준, 시간은 2시간 단위 시진)
- 성별
- 이름 (한글/영문)
- MBTI 유형 (선택 또는 간이 테스트)

### 빌드 & 실행
```bash
npm install        # 의존성 설치
npm run dev        # 개발 서버 (localhost:3000)
npm run build      # 프로덕션 빌드
npm run test       # 테스트 실행
```
환경 변수 설정 불필요. Claude Max OAuth 토큰을 자동으로 사용합니다.

### 주의사항
- API 키 입력 불필요 (Claude Max OAuth 토큰 자동 사용)
- Claude에게 정확한 도메인 지식을 프롬프트로 제공 (사주 절기 기준, 자미두수 납음오행 등)
- 응답 JSON 스키마를 엄격히 정의하여 파싱 에러 방지
- 토큰 사용량 모니터링 (1회 분석 ≈ 3,000~5,000 토큰)
- MBTI 간이 설문은 프론트에서 처리 (Claude 호출 불필요)
- 교차검증 시 시스템간 불일치는 결함이 아닌 "잠재특성/개발특성/내적긴장"으로 해석
