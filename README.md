# 실전 기업인증 마스터 과정 - 랜딩페이지

B2B 강의/서비스 문의용 랜딩페이지입니다. Meta 광고 유입 → 문의 폼 제출 전환 목적으로 제작되었습니다.

## 파일 구조

```
landing_260129/
├── index.html          # 메인 랜딩페이지
├── styles.css          # 스타일시트
├── script.js           # JavaScript (Pixel, 폼, UI)
├── config.js           # 설정 파일 (Pixel ID, Script URL)
├── google-apps-script.js  # Google Sheets 연동 코드
└── README.md           # 설명서
```

## 빠른 시작

### 1. 로컬에서 테스트

```bash
# 정적 서버로 실행
npx serve .

# 또는 Python 사용
python -m http.server 8080
```

브라우저에서 `http://localhost:8080` 접속

### 2. 배포 (Vercel)

```bash
# Vercel CLI 설치
npm i -g vercel

# 배포
vercel
```

## 설정

### Meta Pixel 설정

1. [Meta Business Suite](https://business.facebook.com/events_manager)에서 Pixel ID 확인
2. `config.js` 파일의 `PIXEL_ID` 수정:

```javascript
const CONFIG = {
  PIXEL_ID: '여기에_픽셀_ID_입력',
  // ...
};
```

### Google Sheets 연동

#### 1. Google Sheets 생성

새 스프레드시트를 만들고 다음 두 시트를 생성합니다:

**시트1: 일정**
| 강의ID | 강의명 | 날짜 | 시간 | 신청자수 | 정원 | 상태 |
|--------|--------|------|------|----------|------|------|
| COURSE-001 | 실전 기업인증 마스터 과정 35기 | 2026년 2월 14일 ~ 16일 | 10:00 ~ 18:00 | 0 | 20 | 모집중 |

**시트2: 리드**
| 타임스탬프 | 이름 | 연락처 | 회사명 | 선택강의 | 주관식응답 |
|------------|------|--------|--------|----------|------------|

#### 2. Apps Script 배포

1. Google Sheets에서 **확장 프로그램 > Apps Script** 클릭
2. `google-apps-script.js` 내용 전체 복사하여 붙여넣기
3. **배포 > 새 배포** 클릭
4. 유형: **웹 앱** 선택
5. 실행 사용자: **나**
6. 액세스 권한: **모든 사용자**
7. **배포** 클릭 후 URL 복사

#### 3. URL 설정

`config.js` 파일의 `SCRIPT_URL` 수정:

```javascript
const CONFIG = {
  // ...
  SCRIPT_URL: 'https://script.google.com/macros/s/여기에_스크립트_ID/exec',
};
```

## 페이지 구조

| 섹션 | 내용 |
|------|------|
| Hero | 핵심 베네핏, 통계, CTA |
| Problem | 타겟 페인포인트 3가지 |
| Solution | 4가지 해결책 + 3일 커리큘럼 |
| Reviews | 수강생 후기 + 숫자 증거 |
| Instructor | 강사 프로필 및 자격 |
| Schedule | 동적 강의 일정 (Sheets 연동) |
| Price | 가격 + 포함 내역 + 환불 보장 |
| FAQ | 예상 반론 5가지 |
| Contact | 문의 폼 |
| Footer | 연락처 + 개인정보처리방침 |

## 주요 기능

### Meta Pixel 이벤트

- **PageView**: 페이지 로드 시 자동 전송
- **Lead**: 폼 제출 성공 시 전송

### 강의 일정 (동적)

- Google Sheets에서 일정 데이터 로드
- 잔여석 실시간 표시
- 마감 임박(3석 이하) 시 빨간색 배지

### 폼 제출

- 입력 데이터 → Google Sheets 자동 저장
- 선택 강의 신청자수 자동 증가
- 이메일 알림 (선택적)

### 반응형 디자인

- 모바일 퍼스트 설계
- 플로팅 CTA 버튼 (모바일)
- 터치 타겟 44px 이상

## 콘텐츠 수정

### 회사/강사 정보

`config.js`의 `COMPANY` 객체 수정:

```javascript
COMPANY: {
  name: '행정사사무소 천안',
  instructor: '김성일',
  phone: '010-xxxx-xxxx',
  email: 'your@email.com',
  kakao: 'https://pf.kakao.com/_xxxxx'
}
```

### 이미지 교체

`index.html`에서 이미지 경로 수정. 권장 폴더 구조:

```
images/
├── instructor.jpg     # 강사 프로필 (400x533)
├── hero-bg.jpg       # 히어로 배경 (선택)
└── og-image.jpg      # 소셜 공유 이미지 (1200x630)
```

### 후기 추가

`index.html`의 `.reviews-grid` 섹션에서 `.review-card` 추가:

```html
<div class="review-card">
  <div class="review-content">
    <p>"후기 내용"</p>
  </div>
  <div class="review-meta">직함 또는 회사</div>
</div>
```

## 체크리스트

### 배포 전

- [ ] `config.js`에 실제 Pixel ID 입력
- [ ] `config.js`에 실제 Apps Script URL 입력
- [ ] 회사/강사 연락처 정보 확인
- [ ] 강사 프로필 이미지 교체
- [ ] Google Sheets에 실제 강의 일정 입력
- [ ] 개인정보처리방침 내용 확인

### 마케팅 최적화

- [x] 폴드 위에 CTA 버튼
- [x] 스크롤 중 플로팅 CTA (모바일)
- [x] 폼 필드 5개 이하
- [x] 터치 타겟 44px 이상
- [ ] 로딩 3초 미만 (이미지 최적화 필요)

## 기술 스택

- **Frontend**: 순수 HTML/CSS/JavaScript
- **호스팅**: Vercel, Netlify, 또는 기타 정적 호스팅
- **Backend**: Google Sheets + Apps Script
- **분석**: Meta Pixel

## 문의

기술 지원이 필요하시면 contact@example.com으로 연락 주세요.

---

© 2026 행정사사무소 천안
