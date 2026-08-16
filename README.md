# 농가온

축산 피해 현장에서 사진과 음성으로 상황을 기록하고, 피해정보 구조화부터 증빙·문서 준비까지 돕는 모바일 웹앱 MVP입니다.

## 배포된 MVP

- 서비스 URL: https://nonggaon-farm-aid.ysyoon2013.chatgpt.site
- 상태: 공개 배포 완료

## 최종 제출 자료

| 자료 | 위치 | 상태 |
| --- | --- | --- |
| 발표자료 | [`presentation/`](presentation/) | 최종 PPT/PDF 업로드 필요 |
| 데모/MVP | [공개 서비스](https://nonggaon-farm-aid.ysyoon2013.chatgpt.site) | 배포 완료 |
| Codex Build Log | [`codex-build-logs/22_윤연서_2284.md`](codex-build-logs/22_윤연서_2284.md) | 작성 완료 |
| 디자인 명세 | [`MAIN_DESIGN.md`](MAIN_DESIGN.md) | 작성 완료 |

## 현재 구현 범위

- 축산 농가 회원가입 온보딩 및 로그인 데모
- 고령 사용자를 고려한 모바일 중심 UI와 큰 조작 영역
- 피해 사진 등록 및 현장 기록 흐름
- 브라우저 음성 녹음과 OpenAI 음성 인식
- 피해 내용 구조화 및 누락정보 중심의 대화형 추가 질문
- 피해 요약 확인
- 증빙자료 체크리스트와 문서 준비 화면
- 피해 문서 초안 및 PDF 저장 흐름
- 모든 사용자가 접근 가능한 URL 배포

현재 MVP에서 실제로 연동하지 않은 범위는 지자체 공고 실시간 검색, 공식 자격 판정, 행정기관 제출, 공식 피해율·지원금 산정 및 영구 데이터베이스 저장입니다. 해당 결과는 데모 데이터 또는 신청 준비용 보조 정보로 표시합니다.

## 기술 구성

- React / TypeScript
- vinext / Vite
- Cloudflare Workers 기반 API 실행 환경
- OpenAI API: 음성 인식, 피해정보 구조화, 후속 질문 생성
- 브라우저 MediaRecorder API

## 로컬 실행

```bash
npm install
npx vinext dev
```

프로젝트 루트의 `.env.local`에 다음 환경변수를 설정해야 AI 기능을 사용할 수 있습니다.

```dotenv
OPENAI_API_KEY=your_api_key_here
```

API 키는 Git에 올리지 않습니다. 배포 환경에서는 호스팅 서비스의 Secret으로 별도 등록합니다.

## 빌드

```bash
npx vinext build
```

## 주요 API

- `POST /api/voice/transcribe`: 녹음 음성을 텍스트로 변환
- `POST /api/voice/chat`: 피해정보 구조화, 누락정보 확인, 다음 질문 생성

## 주요 디렉터리

```text
app/                    화면 및 API 코드
public/                 이미지·아이콘 등 정적 자산
codex-build-logs/       팀원별 Codex 작업 로그
presentation/           최종 발표자료
tests/                  테스트 코드
```

## 보안 안내

- `.env.local`과 실제 OpenAI API 키는 저장소에 커밋하지 않습니다.
- Codex Build Log에는 API 키, 인증 토큰 및 불필요한 개인정보를 기록하지 않습니다.
- AI 결과는 공식 피해 판정이나 지원 자격 확정이 아닌 신고·신청 준비용 초안입니다.
