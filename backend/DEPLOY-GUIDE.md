# Team Runner 배포 가이드

이 문서는 다음 2가지를 한 번에 다룹니다.

- 운영 배포: `frontend`(Vercel) + `backend`(Node 서버) + `Supabase`(Postgres)
- 로컬 개발: Docker 기반 로컬 Supabase 연결

---

## 1) 전체 아키텍처

- **Frontend**: Vercel에 Next.js 배포
- **Backend**: Node.js/Express 서버를 Render/Railway/Fly.io 등 "지속 실행 서버"에 배포
- **DB**: Supabase Postgres 사용
- **주의**: 현재 업로드 이미지는 `UPLOADS_DIR`(로컬 디스크)에 저장됩니다.
  - 서버리스/ephemeral 디스크 환경에서는 이미지 유실 가능
  - 운영에서는 **persistent volume**이 있는 백엔드 호스팅을 쓰거나, 추후 Supabase Storage/S3로 업로드 로직 이전 권장

---

## 2) 사전 준비

- Supabase 프로젝트 생성
- Kakao Developers 앱 생성 및 Redirect URI 설정
- 백엔드 배포 플랫폼 계정(Render/Railway/Fly.io 중 택1)
- Vercel 프로젝트 생성

---

## 3) Supabase(운영) 설정

### 3-1. 스키마 생성

Supabase SQL Editor에서 아래 파일 내용을 실행합니다.

- `backend/supabase/schema.sql`

### 3-2. 키 확인

Supabase 프로젝트 Settings > API에서 다음 값 확보:

- `SUPABASE_URL` (예: `https://xxxx.supabase.co`)
- `SUPABASE_SERVICE_ROLE_KEY` (서버 전용 비밀키)

`SUPABASE_SERVICE_ROLE_KEY`는 절대 프론트엔드에 노출하면 안 됩니다.

---

## 4) 기존 JSON 데이터 이관(선택)

기존 `backend/data/*.json` 데이터를 Supabase로 옮기려면:

```bash
cd backend
npm install
npm run migrate:supabase
```

마이그레이션 스크립트:

- `backend/src/scripts/migrate-json-to-supabase.ts`

---

## 5) 백엔드 배포

## 5-1. 필수 환경변수

`backend/.env.example` 기준으로 배포 환경에 입력합니다.

- `PORT` (플랫폼이 자동 주입하면 생략 가능)
- `NODE_ENV=production`
- `FRONTEND_URL=https://<vercel-domain>`
- `SUPABASE_URL=...`
- `SUPABASE_SERVICE_ROLE_KEY=...`
- `KAKAO_CLIENT_ID=...`
- `KAKAO_CLIENT_SECRET=...`
- `KAKAO_REDIRECT_URI=https://<backend-domain>/api/auth/kakao/callback`
- `JWT_ACCESS_SECRET` (32자 이상)
- `JWT_REFRESH_SECRET` (32자 이상, access와 다르게)
- `JWT_ACCESS_EXPIRES_IN=15m`
- `JWT_REFRESH_EXPIRES_IN=7d`
- `ANTHROPIC_API_KEY=...`
- `UPLOADS_DIR=./data/uploads`
- `MAX_UPLOAD_SIZE_MB=10`

### 5-2. 빌드/실행 커맨드

- Build: `npm run build`
- Start: `npm run start`

### 5-3. 헬스 체크

배포 후 아래 흐름을 확인:

1. `/api/auth/kakao` 접근 시 카카오 로그인 이동
2. 로그인 후 `/api/auth/kakao/callback` 정상 처리
3. `/api/users/me` 호출 가능

---

## 6) 프론트(Vercel) 배포

`frontend`를 Vercel에 연결하고 환경변수 설정:

- `NEXT_PUBLIC_API_URL=https://<backend-domain>`

배포 후 실제 도메인 기준으로 로그인/콜백 동작 확인:

1. 로그인 버튼 클릭
2. 카카오 인증
3. 신규 유저면 온보딩으로 이동
4. 기존 유저면 업로드/대시보드 진입

---

## 7) Kakao Redirect URI 체크리스트

Kakao Developers에 반드시 아래 URI들이 등록되어야 합니다.

- 로컬: `http://127.0.0.1:8080/api/auth/kakao/callback` (백엔드 로컬 주소 기준)
- 운영: `https://<backend-domain>/api/auth/kakao/callback`

`KAKAO_REDIRECT_URI` 환경변수 값과 정확히 일치해야 합니다.

---

## 8) 로컬 개발: Docker Supabase 사용 가이드

로컬에서도 JSON 없이 Supabase 방식으로 개발할 수 있습니다.

### 8-1. 준비물

- Docker Desktop
- Supabase CLI

Supabase CLI 설치(예: macOS):

```bash
brew install supabase/tap/supabase
```

### 8-2. 로컬 Supabase 시작

프로젝트 루트에서:

```bash
supabase start
```

실행 후 로컬 기본 엔드포인트:

- Supabase URL: `http://127.0.0.1:54321`

키/URL 확인:

```bash
supabase status
```

또는 env 포맷 확인:

```bash
supabase status -o env
```

### 8-3. 로컬 DB에 스키마 반영

`backend/supabase/schema.sql` 내용을 로컬 DB에 적용합니다.

방법 A: Supabase Studio(SQL Editor)에서 실행  
방법 B: `psql`로 직접 실행

### 8-4. 백엔드 로컬 `.env` 예시

`backend/.env`:

```env
PORT=8080
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

SUPABASE_URL=http://127.0.0.1:54321
SUPABASE_SERVICE_ROLE_KEY=<supabase status 에서 service_role 키>

KAKAO_CLIENT_ID=...
KAKAO_CLIENT_SECRET=...
KAKAO_REDIRECT_URI=http://127.0.0.1:8080/api/auth/kakao/callback

JWT_ACCESS_SECRET=your_very_long_random_secret_32chars_min
JWT_REFRESH_SECRET=your_different_very_long_random_secret
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

ANTHROPIC_API_KEY=...
UPLOADS_DIR=./data/uploads
MAX_UPLOAD_SIZE_MB=10
```

### 8-5. 실행

```bash
cd backend
npm install
npm run build
npm run dev
```

프론트:

```bash
cd frontend
npm install
echo "NEXT_PUBLIC_API_URL=http://127.0.0.1:8080" > .env.local
npm run dev
```

---

## 9) 운영 전 최종 점검

- [ ] Supabase 스키마 적용 완료
- [ ] 백엔드 `SUPABASE_*` 환경변수 설정 완료
- [ ] 프론트 `NEXT_PUBLIC_API_URL` 설정 완료
- [ ] Kakao Redirect URI 운영/로컬 모두 등록
- [ ] 로그인(신규/기존), 온보딩, 업로드, 통계 플로우 점검
- [ ] 업로드 파일 보존 전략(볼륨 or 외부 스토리지) 결정

---

## 10) 트러블슈팅

- **`DB_ERROR` / Supabase 연결 실패**
  - `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` 오타 확인
  - 프로젝트 일시정지/네트워크 차단 여부 확인
- **카카오 로그인 후 실패**
  - `KAKAO_REDIRECT_URI`와 Kakao 등록 URI 정확히 일치하는지 확인
- **이미지가 사라짐**
  - 배포 플랫폼 디스크가 ephemeral인지 확인
  - persistent volume 또는 외부 스토리지로 전환 필요

