# 서체

> **동아 디자인에서는:** 외부 CDN을 쓰지 않으므로 아래 1번(인터넷 주소)은 쓰지 않는다. 늘 2번처럼 `assets/fonts/`의 파일을 제출 폴더 `assets/fonts/`에 넣고, `tokens.css` 맨 위의 `@font-face`로 불러온다. 브랜드 제목 서체도 파일을 동봉할 수 있고 이용 허락이 분명한 것만 쓴다.

## 1. 본문과 기본 제목: Pretendard

모든 화면의 기본 서체다. 당근(SEED)이 윈도우에서 쓰고, 원티드, 쏘카 등 여러 회사가 쓰는 한국어 UI 서체다. SIL Open Font License 1.1이라 상업적 사용과 파일 동봉 배포가 모두 된다.

**불러오는 방법 (둘 중 하나)**

1. 인터넷 주소(CDN). 대부분의 웹 프로젝트.
   ```html
   <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css">
   ```
2. 스킬에 들어 있는 파일. 인터넷이 막힌 곳(학교 전산실, 오프라인 수업, 사내망), 외부 요청을 줄이고 싶을 때.
   - `assets/fonts/`의 `Pretendard-Regular/Medium/SemiBold/Bold.woff2`(400, 500, 600, 700)와 `OFL-Pretendard.txt`를 프로젝트의 `fonts/` 폴더로 복사한다. 라이선스 파일도 꼭 함께 복사한다.
   - `assets/fonts.css`를 복사해서 `tokens.css`보다 먼저 불러온다. 경로가 다르면 `url()`만 고친다.

서체가 안 불러와져도 `tokens.css`의 글꼴 목록이 Apple SD Gothic Neo, 맑은 고딕 순서로 대신한다.

## 2. 브랜드 개성의 제목 서체 (하나만 고른다)

개성 다이얼이 `브랜드`일 때만 쓴다. **큰 제목, 숫자, 홍보 띠에만** 쓰고 본문, 버튼, 표, 입력 칸은 Pretendard를 그대로 둔다. 모두 무료이고 Google Fonts에서 바로 불러올 수 있다(SIL OFL).

| 성격 | 서체 | 어울리는 곳 | 불러오기 (`family=` 값) |
|---|---|---|---|
| 단정한 명조 | 고운바탕 Gowun Batang | 잡지, 독서, 전시, 차분한 기록 | `Gowun+Batang:wght@700` |
| 고전적 명조 | 나눔명조 Nanum Myeongjo | 공식 안내, 상장, 역사 | `Nanum+Myeongjo:wght@800` |
| 굵은 고딕 | 검은고딕 Black Han Sans | 행사, 대회, 강한 제목 | `Black+Han+Sans` |
| 각진 고딕 | 도현 Do Hyeon | 게임, 순위, 숫자 강조 | `Do+Hyeon` |
| 둥근 고딕 | 고운돋움 Gowun Dodum | 어린이, 가족, 다정한 서비스 | `Gowun+Dodum` |
| 손글씨 | 개구 Gaegu | 동아리, 메모, 가벼운 홍보 | `Gaegu:wght@700` |

```html
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Gowun+Batang:wght@700&display=swap">
```
```css
[data-personality="brand"] { --font-display: "Gowun Batang", serif; }
```

고르는 기준: 서비스 성격 하나에 맞춰 하나만. 두 개 이상 섞지 않는다. 손글씨는 제목 한 줄까지만 쓴다(길면 읽기 어렵다).

## 3. 공통 규칙

- 한 화면에 서체는 최대 2개(Pretendard + 제목 서체 하나).
- 토스 전용 서체(Toss Product Sans)는 공개되지 않았으므로 쓰지 않는다.
- 제목 서체에도 글자 크기 규칙(12px 이상)과 대비 4.5:1을 똑같이 적용한다.
- `font-display: swap`을 써서 서체를 받는 동안에도 글자가 보이게 한다.
