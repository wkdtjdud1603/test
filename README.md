# Life Travel · Vercel + Firebase

기록 → 생각의 지도 → 선택 질문 → One Thing → 실행 도미노 → 버킷 리스트.
생각의 지도는 키워드 분류, One Thing 제안은 선택 빈도 기반입니다. 생성형 AI 연결은 포함하지 않습니다.

## Firebase 설정

1. https://console.firebase.google.com/ 에서 프로젝트를 생성하고 웹 앱을 등록합니다.
2. Authentication → Sign-in method → Google을 활성화합니다. 지원 이메일을 지정합니다.
3. Firestore Database를 Enterprise / Native 모드로 생성합니다. 위치는 생성 시 신중하게 선택합니다.
4. Firestore Rules에 이 저장소의 `firestore.rules` 내용을 게시합니다. 또는 Firebase CLI 로그인 후 `firebase deploy --only firestore:rules --project 프로젝트ID`를 실행합니다.
5. 프로젝트 설정 → 내 앱의 웹 설정에서 apiKey, authDomain, projectId, appId를 확인합니다.
6. Vercel 배포 도메인을 Authentication → Settings → Authorized domains에 추가합니다. 미리보기 배포는 승인된 고정 도메인을 사용합니다. 로컬 테스트는 localhost도 등록합니다.

## Vercel 설정

GitHub 저장소를 Import하고 이 파일이 있는 폴더를 Root Directory로 선택합니다.
Framework Preset: Other. Build Command: `npm run build`. Output Directory: `dist`.
`vercel.json`에 같은 설정이 포함되어 있습니다. 의존 패키지는 없습니다.
Vercel 프로젝트 환경 변수에 `.env.example`의 값을 입력합니다. 앞의 네 변수는 필수입니다.
환경 변수 등록 뒤 재배포합니다. Firebase 설정값이 없어도 배포되며, Google 로그인은 비활성화되고, 기록과 목표 작성은 체험 모드로 이용할 수 있습니다.
Firebase 웹 앱 설정은 브라우저에서 사용하는 공개 식별값입니다. 서비스 계정 비공개 키는 넣지 않습니다.

## 개발 / 검증

배포 런타임은 Node.js 24.x로 고정합니다. 로컬은 Node.js 22 이상. `npm test`, `npm run build`.
로컬 환경 변수는 쉘에서 주입합니다. Node 22 이상은 `node --env-file=.env.local scripts/build.mjs`도 사용할 수 있습니다.
빌드 후 dist를 HTTP 서버로 제공합니다. ES 모듈을 사용하므로 HTML 파일 직접 열기는 지원하지 않습니다.
설정값이 없으면 체험 모드로 작동하며 sessionStorage에 현재 탭의 데이터를 임시 보관합니다. 탭을 닫기 전에 JSON으로 내보내세요.

## 저장 방식과 한계

Google 로그인 계정 UID별 서울 asia-northeast3의 `journey` 데이터베이스 내 `/users/{uid}/journey/current` 문서에 전체 여행 상태를 JSON 문자열로 저장합니다.
개인 초기 버전: UTF-8 기준 약 700KB까지. 대량 일기는 개별 문서 컬렉션으로 분리하는 후속 마이그레이션이 필요합니다.
저장은 트랜잭션으로 순차 처리하고 revision을 비교합니다. 다른 탭/기기의 변경은 자동 덮어쓰지 않고 편집을 잠급니다.
실패 시 화면의 내용을 JSON으로 내보내고 새로고침 후 필요한 데이터를 가져옵니다.
오프라인 편집/동기화와 다른 기기의 실시간 구독은 제공하지 않습니다. 체크에 따른 화면 진행률은 즉시 반영됩니다.
로그인한 계정 기록은 localStorage/sessionStorage에 저장하지 않습니다. 체험 기록만 별도 sessionStorage에 보관하며 계정에 자동 업로드하지 않습니다.
기존 로컬 버전의 내보내기 JSON은 로그인 후 '나의 기록'에서 가져올 수 있습니다. 가져오기는 현재 여행을 교체합니다.

## 배포 후 필수 확인

두 개의 서로 다른 Google 계정으로 로그인해 데이터가 분리되는지 확인합니다.
기록 저장 후 새로고침, 다른 기기 로그인, 로그아웃, 네트워크 단절, 두 탭 동시 수정 시나리오를 확인합니다.
Firebase Emulator Suite 또는 Rules Playground에서 비로그인 접근과 다른 UID 문서 읽기/쓰기가 거부되는지 확인합니다.
실제 Firebase 프로젝트가 연결되기 전에는 인증/클라우드 저장/규칙의 실서비스 검증이 완료된 것이 아닙니다.

공식 문서:
- https://firebase.google.com/docs/web/setup
- https://firebase.google.com/docs/auth/web/google-signin
- https://firebase.google.com/docs/firestore/security/rules-conditions
- https://vercel.com/docs/project-configuration/vercel-json

현재 연결 프로젝트: Test (`test-b02b6`). Firestore: `journey`, Enterprise Native, 서울 `asia-northeast3`. 운영 도메인: https://life-travel-lemon.vercel.app/ . 운영 환경 변수만 설정하며 Preview는 체험 모드를 사용합니다.
