# 메뉴 양식 (탭 막대, 햄버거)

당토 디자인 v1.5.0의 메뉴 규칙(`dangto-design/references/responsive.md` 3절)을 그대로 따르고, 두클래스 규칙(`position: fixed` 금지, `.dc-content` 선택자, `innerHTML` 금지, 바깥 접근 금지)에 맞게 만드는 법만 바꿨다.

## 1. 먼저 메뉴가 필요한지 본다

| 자료 | 양식 |
|---|---|
| 두클래스에 올리는 한 차시 활동, 퀴즈, 시뮬레이션 | **메뉴를 만들지 않는다.** 플랫폼 뷰어가 제목, 공유, 수업 도구를 이미 보여 준다. 활동 안 흐름은 위쪽 단계 표시("1 살펴보기 2 문제 3 정리")나 세그먼트로 |
| 한 화면 안에서 같은 종류 나누기 (전체, 틀린 문제) | 위쪽 탭이나 세그먼트 |
| 독립 도구, 여러 활동을 묶은 자료의 주요 구역 2~5개 | 아래 탭 막대 |
| 메뉴가 6개 이상인 교사용 도구, 관리 화면 | 햄버거 버튼 + 펼침 메뉴 |
| 메뉴가 1~2개 | 메뉴 없이 머리 막대 버튼 |

- **탭 막대가 먼저다.** 주요 구역을 햄버거 안에 숨기면 학생이 거기 있는 줄 모른다.
- 탭 막대와 햄버거를 함께 쓰지 않는다. 같은 메뉴를 두 곳에 두지 않는다.
- 두클래스 플랫폼에 있는 버튼(제목, 공유, 전체 화면, 수업 도구)을 메뉴에 다시 넣지 않는다.
- 한 파일(`index.html`) 안의 구역을 바꾸는 메뉴다. 페이지 이동(`location`)이나 새 창을 쓰지 않고, 구역을 `hidden`으로 숨기고 보인다. 구역마다 스크롤 위치와 입력 값을 그대로 둔다.

## 2. 머리 막대

```
[뒤로 또는 화면 이름]                     [아이콘] [아이콘 또는 햄버거]
```
- 높이 `--header-h`(56px), `position: sticky; top: 0`, `z-index: var(--z-sticky)`. 바탕은 `--bg`. 빨강 바탕 머리 띠는 쓰지 않는다.
- 두클래스 자료에는 로고를 넣지 않는다(`brand.md` 4번). 독립 도구는 왼쪽에 작은 로고를 둘 수 있다.
- 오른쪽 아이콘 버튼은 2개까지. 24px 선 아이콘, 누르는 영역 `--touch`, `aria-label` 필수.

## 3. 아래 탭 막대

- 항목 3~5개. 아이콘(24px 선) 위, 이름(13px) 아래. **이름은 항상 보인다.**
- `position: sticky; bottom: 0`(fixed 아님), `z-index: var(--z-sticky)`, 높이 `--tabbar-h` + `env(safe-area-inset-bottom)`. 바탕 `--surface`, 위쪽 옅은 선 하나. 그림자, 떠 있는 둥근 막대, 가운데 튀어나온 버튼은 없다.
- 고른 탭은 `--text-strong` 글자 + 600 굵기, 나머지는 `--text-muted`. **빨강을 쓰지 않는다.** 빨강은 그 화면의 주요 버튼 몫이다.
- 고른 탭에 `aria-current="page"`. 이미 고른 탭을 다시 누르면 그 구역 맨 위로 간다.
- 하단 sticky 버튼(정답 확인하기 등)이 있는 화면에서는 탭 막대를 숨긴다. 둘을 위아래로 쌓지 않는다.
- 태블릿 가로(1024px 이상)에서는 왼쪽 세로 막대(`--rail-w` 80px)로 옮긴다. 이때 막대도 `position: sticky; top: 0`이다.

## 4. 햄버거 버튼과 펼침 메뉴

동아 디자인은 `position: fixed`를 쓰지 않으므로 화면 옆에서 미끄러져 들어오는 서랍 대신 **sticky 머리 막대 바로 아래로 펼치는 메뉴**를 쓴다. 머리 막대가 늘 화면 위에 붙어 있으니 어디까지 스크롤했든 메뉴가 버튼 바로 아래에 열린다.

- 버튼: 세 줄 선 아이콘(24px, 굵기 2px, 끝 둥글게), 머리 막대 오른쪽 끝. `aria-label="메뉴 열기"`, `aria-expanded`, `aria-controls`.
- 메뉴: 머리 막대 안의 `position: absolute; top: 100%; right`, 폭 `min(20rem, 100% - 16px)`, 최대 높이 `min(28rem, 70dvh)`, 넘치면 메뉴 안에서 스크롤(`dc-scroll`). 바탕 `--surface-raised`, 테두리 `--line`, 모서리 `--r-card`, 그림자 `--shadow-2`, `z-index: var(--z-sheet)`.
- 항목은 목록 한 줄 모양, 높이 `--touch` 이상. 지금 구역은 `--accent-weak` 바탕 + `--accent-text` 글자 + 600 굵기, `aria-current="page"`.
- 닫히는 때: 항목을 고를 때, 버튼을 다시 누를 때, Esc, 메뉴 바깥을 누를 때, 초점이 메뉴 밖으로 나갈 때. Esc로 닫으면 햄버거 버튼으로 초점을 돌린다.
- 열면 지금 구역 항목에 초점. 위아래 화살표로 항목 사이를 옮긴다.
- 열고 닫을 때 150ms 안쪽으로 살짝 내려오며 나타난다. 동작 줄이기 설정이면 바로(토큰이 처리).
- 태블릿 가로(1024px 이상)에서는 햄버거를 없애고 메뉴를 머리 막대에 펼치거나 왼쪽 막대로 둔다.

## 5. 코드 틀

모든 선택자는 `.dc-content`로 시작하고, 요소는 HTML에 써 두거나 `createElement`로 만든다. `onclick` 속성, `innerHTML`, `document` 전체에 거는 이벤트를 쓰지 않는다(바깥 누르기는 래퍼에서 받는다).

```html
<div class="dc-content" id="app">
  <div class="dc-shell has-tabbar">
    <header class="dc-header">
      <span class="dc-header-title">기후 탐구</span>
      <button class="dc-icon-btn" type="button" aria-label="메뉴 열기" aria-expanded="false" aria-controls="dc-menu">
        <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h16"/></svg>
      </button>
      <nav class="dc-menu-panel dc-scroll" id="dc-menu" aria-label="메뉴" hidden>
        <a class="dc-menu-item" href="#s1" aria-current="page">기후 그래프</a>
        <a class="dc-menu-item" href="#s2">기후 지도</a>
      </nav>
    </header>
    <main class="dc-main">
      <section id="s1">…</section>
      <section id="s2" hidden>…</section>
    </main>
    <nav class="dc-tabbar" aria-label="주요 구역">
      <button type="button" data-go="s1" aria-current="page"><svg …></svg>그래프</button>
      <button type="button" data-go="s2"><svg …></svg>지도</button>
    </nav>
  </div>
</div>
```
(예시는 두 양식을 함께 보이려고 둘 다 넣었다. 실제 화면에는 1절 기준으로 하나만 쓴다.)

```css
.dc-content .dc-header {
  position: sticky; top: 0; z-index: var(--z-sticky);
  display: flex; align-items: center; justify-content: space-between; gap: var(--sp-2);
  height: var(--header-h); padding-inline: var(--page-x); background: var(--bg);
}
.dc-content .dc-icon-btn {
  width: var(--touch); height: var(--touch); display: grid; place-items: center;
  border: 0; background: transparent; color: var(--text-strong); border-radius: var(--r-control); cursor: pointer;
}
.dc-content .dc-menu-panel {
  position: absolute; top: 100%; right: var(--sp-2); z-index: var(--z-sheet);
  width: min(20rem, calc(100% - var(--sp-4))); max-height: min(28rem, 70dvh);
  padding: var(--sp-1); background: var(--surface-raised); border: 1px solid var(--line);
  border-radius: var(--r-card); box-shadow: var(--shadow-2);
  animation: dc-menu-in var(--dur-fast) var(--ease-enter);   /* 동작 줄이기면 토큰이 0ms로 */
}
.dc-content .dc-menu-panel[hidden] { display: none; }
@keyframes dc-menu-in { from { opacity: 0; transform: translateY(-4px); } }
.dc-content .dc-menu-item {
  display: flex; align-items: center; min-height: var(--touch); padding-inline: var(--sp-3);
  border-radius: calc(var(--r-control) - 2px); color: var(--text-strong); text-decoration: none;
}
.dc-content .dc-menu-item:hover { background: var(--fill-subtle); }
.dc-content .dc-menu-item[aria-current="page"] { background: var(--accent-weak); color: var(--accent-text); font-weight: var(--fw-semibold); }

.dc-content .dc-tabbar {
  position: sticky; bottom: 0; z-index: var(--z-sticky);
  display: grid; grid-auto-flow: column; grid-auto-columns: 1fr;
  height: calc(var(--tabbar-h) + env(safe-area-inset-bottom)); padding-bottom: env(safe-area-inset-bottom);
  background: var(--surface); border-top: 1px solid var(--line);
}
.dc-content .dc-tabbar button {
  display: grid; place-items: center; align-content: center; gap: 2px;
  border: 0; background: transparent; font: inherit; font-size: var(--fs-caption); color: var(--text-muted); cursor: pointer;
}
.dc-content .dc-tabbar [aria-current="page"] { color: var(--text-strong); font-weight: var(--fw-semibold); }

/* 태블릿 세로: 머리 막대와 탭 항목을 본문 폭(44rem) 안으로 모은다 */
@media (min-width: 744px) {
  .dc-content .dc-header, .dc-content .dc-tabbar { padding-inline: max(var(--page-x), (100% - 44rem) / 2); }
}
/* 태블릿 가로: 탭 막대는 왼쪽 세로 막대, 햄버거는 없앤다 */
@media (min-width: 1024px) {
  .dc-content .dc-shell.has-tabbar { display: grid; grid-template-columns: var(--rail-w) minmax(0, 1fr); }
  .dc-content .has-tabbar > .dc-header, .dc-content .has-tabbar > .dc-main { grid-column: 2; }
  .dc-content .has-tabbar > .dc-tabbar {
    grid-column: 1; grid-row: 1 / span 2; top: 0; bottom: auto; align-self: start;
    height: auto; max-height: 100dvh; grid-auto-flow: row; grid-auto-rows: 4.5rem;
    padding: var(--sp-4) 0; border-top: 0; border-right: 1px solid var(--line);
  }
  .dc-content .dc-header [aria-controls="dc-menu"] { display: none; }
}
```

```js
(function () {
  var root = document.getElementById('app');
  var btn = root.querySelector('[aria-controls="dc-menu"]');
  var menu = root.querySelector('#dc-menu');
  function items() { return Array.prototype.slice.call(menu.querySelectorAll('.dc-menu-item')); }
  function openMenu() {
    menu.hidden = false; btn.setAttribute('aria-expanded', 'true');
    (menu.querySelector('[aria-current="page"]') || items()[0]).focus();
  }
  function closeMenu(back) {
    if (menu.hidden) return;
    menu.hidden = true; btn.setAttribute('aria-expanded', 'false');
    if (back) btn.focus();
  }
  btn.addEventListener('click', function () { menu.hidden ? openMenu() : closeMenu(true); });
  menu.addEventListener('keydown', function (e) {
    var list = items(), i = list.indexOf(document.activeElement);
    if (e.key === 'Escape') { closeMenu(true); }
    else if (e.key === 'ArrowDown') { e.preventDefault(); list[(i + 1) % list.length].focus(); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); list[(i - 1 + list.length) % list.length].focus(); }
  });
  menu.addEventListener('focusout', function (e) {
    if (!menu.contains(e.relatedTarget) && e.relatedTarget !== btn) closeMenu(false);
  });
  root.addEventListener('click', function (e) {
    if (!menu.hidden && !menu.contains(e.target) && !btn.contains(e.target)) closeMenu(false);
  });
  menu.addEventListener('click', function (e) {
    var a = e.target.closest('.dc-menu-item');
    if (!a) return;
    e.preventDefault();
    showSection(a.getAttribute('href').slice(1));
    closeMenu(true);
  });
  function showSection(id) {
    root.querySelectorAll('.dc-main > section').forEach(function (s) { s.hidden = s.id !== id; });
    root.querySelectorAll('[aria-current="page"]').forEach(function (n) { n.removeAttribute('aria-current'); });
    root.querySelectorAll('[href="#' + id + '"], [data-go="' + id + '"]').forEach(function (n) { n.setAttribute('aria-current', 'page'); });
  }
  root.querySelectorAll('.dc-tabbar [data-go]').forEach(function (b) {
    b.addEventListener('click', function () { showSection(b.getAttribute('data-go')); });
  });
})();
```

## 6. 점검

- `check.mjs`가 아이콘만 있는 메뉴 항목, `aria-expanded` 없는 햄버거 버튼을 "직접 확인할 것"으로 알려 준다.
- 메뉴를 연 상태는 점검기가 보지 않는다. 휴대폰 폭에서 메뉴를 열어 화면 밖으로 넘치지 않는지, 키보드로 열고 닫히는지 직접 본다.
- 탭 막대가 마지막 내용을 가리지 않는지 맨 아래까지 스크롤해 본다.
