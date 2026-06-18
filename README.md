# Hermes Music Agent

자연어로 기분/상황을 말하면 AI가 곡을 추천하고 Spotify 플레이리스트로 저장하는 웹앱.

## 기술 스택

- Vite + React + TypeScript
- Vercel (프론트엔드 + Serverless Functions)
- Spotify Web API (Authorization Code + PKCE)
- OpenAI API (추천 두뇌 — 추후 연동)

## 로컬 개발 환경 세팅

### 1. Spotify 대시보드 설정

1. [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)에서 앱을 선택 (또는 새로 생성)
2. **Settings** → **Redirect URIs**에 추가:
   - `http://127.0.0.1:5173/callback`
   - (배포 후) `https://<배포도메인>/callback`
3. **Client ID**를 복사해둠

### 2. 환경 변수 설정

```bash
cp .env.example .env
```

`.env` 파일을 열어 값 입력:

```
VITE_SPOTIFY_CLIENT_ID=<your_client_id>
VITE_REDIRECT_URI=http://127.0.0.1:5173/callback
OPENAI_API_KEY=<your_openai_api_key>
OPENAI_MODEL=gpt-4o-mini

```

### 3. 의존성 설치 + 실행

```bash
npm install
npm run dev
```

브라우저에서 `http://127.0.0.1:5173` 접속.

### 4. OAuth 왕복 테스트

로컬에서 서버리스 함수(`/api/spotify-token`)를 사용하려면 Vercel CLI가 필요:

```bash
npm i -g vercel
vercel dev
```

`vercel dev`는 Vite 프론트 + Serverless Functions를 동시에 서빙합니다.
Vercel CLI 초기 설정 시 프로젝트를 연결하라는 안내가 나오면 따라 진행하세요.

## 프로젝트 구조

```
├── api/                    Vercel Serverless Functions
│   └── spotify-token.ts    토큰 교환 프록시
├── src/
│   ├── components/         UI 컴포넌트
│   ├── hooks/              React 훅 (useHermes)
│   ├── lib/                유틸리티 (catalog, spotify-auth, spotify-api)
│   ├── pages/              라우트 페이지 (Callback)
│   ├── styles/             CSS (design-system.css)
│   ├── App.tsx             라우터 + 인증 분기
│   └── main.tsx            엔트리포인트
├── .env.example            환경변수 템플릿
├── vercel.json             Vercel 라우팅 설정
└── README.md
```

## 보안 원칙

- **Client Secret, OpenAI API Key**는 서버리스 함수 환경변수로만 사용 (프론트 노출 금지)
- Spotify 인증은 **PKCE** 방식 (Client Secret 불필요)
- 토큰은 **sessionStorage**에만 보관 (localStorage 사용 금지)

## 사용 가능한 Spotify API

| Endpoint | 용도 |
|----------|------|
| Search | 곡 검색 |
| Create Playlist | 플레이리스트 생성 |
| Add Items to Playlist | 트랙 추가 |
| Get Current User's Profile | 사용자 확인 |
| Get User's Top Items | 취향 참고 (선택) |

> Recommendations, Audio Features, Audio Analysis, Related Artists 등은 2024-11-27 이후 신규 앱에서 403 차단됨. 사용 금지.
