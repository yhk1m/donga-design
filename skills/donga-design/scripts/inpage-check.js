// © 2026 양정고등학교 지리교사 김용현 (bgnlkim@gmail.com)
// 당토 디자인 화면 점검 (브라우저 안에서 실행)
// check.mjs가 이 파일을 점검용 페이지에 넣는다. 직접 고칠 일은 거의 없다.
(function () {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 1;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });

  // 어떤 CSS 색 문자열이든 [r,g,b,a(0~1)]로
  function rgba(str) {
    if (!str || str === 'transparent') return [0, 0, 0, 0];
    ctx.clearRect(0, 0, 1, 1);
    ctx.fillStyle = '#000';
    ctx.fillStyle = str;
    ctx.fillRect(0, 0, 1, 1);
    const d = ctx.getImageData(0, 0, 1, 1).data;
    // 반투명 색은 캔버스가 미리 곱해 두므로 알파로 되돌린다
    const a = d[3] / 255;
    if (a === 0) return [0, 0, 0, 0];
    return [d[0] / a, d[1] / a, d[2] / a, a].map((v, i) => (i < 3 ? Math.min(255, Math.round(v)) : v));
  }
  function over(top, under) {
    const a = top[3] + under[3] * (1 - top[3]);
    if (a === 0) return [0, 0, 0, 0];
    return [0, 1, 2].map(i => (top[i] * top[3] + under[i] * under[3] * (1 - top[3])) / a).concat(a);
  }
  function lum(c) {
    const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
    return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]);
  }
  function ratio(a, b) {
    const x = lum(a), y = lum(b);
    return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
  }
  function hex(c) { return '#' + c.slice(0, 3).map(v => Math.round(v).toString(16).padStart(2, '0')).join(''); }

  function bgOf(el, win) {
    const chain = [];
    let unknown = false;
    for (let n = el; n && n.nodeType === 1; n = n.parentElement) {
      const cs = win.getComputedStyle(n);
      if (cs.backgroundImage && cs.backgroundImage !== 'none') unknown = true;
      const c = rgba(cs.backgroundColor);
      if (c[3] > 0) chain.push(c);
      if (c[3] >= 1) break;
    }
    let bg = [255, 255, 255, 1];
    for (let i = chain.length - 1; i >= 0; i--) bg = over(chain[i], bg);
    return { bg, unknown };
  }

  function label(el) {
    let s = el.tagName.toLowerCase();
    if (el.id) s += '#' + el.id;
    else if (el.classList.length) s += '.' + [...el.classList].slice(0, 2).join('.');
    return s;
  }
  function textOf(el) {
    let t = '';
    for (const n of el.childNodes) if (n.nodeType === 3) t += n.textContent;
    return t.replace(/\s+/g, ' ').trim();
  }
  function visible(el, win) {
    const cs = win.getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden' || parseFloat(cs.opacity) === 0) return false;
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  }

  const EMOJI = /\p{Extended_Pictographic}/u;

  // doc: 점검할 문서, mode: 'light' | 'dark', width: 화면 폭
  window.__dangtoCheck = function (doc, mode, width) {
    const win = doc.defaultView;
    const out = [];
    const add = (level, rule, el, msg) => out.push({ level, rule, mode, width, where: el ? label(el) : '', msg });

    const all = [...doc.body.querySelectorAll('*')].filter(el => !['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEMPLATE'].includes(el.tagName));
    let accentFilled = 0;
    const rootAccent = rgba(win.getComputedStyle(doc.documentElement).getPropertyValue('--accent').trim());

    for (const el of all) {
      if (!visible(el, win)) continue;
      const cs = win.getComputedStyle(el);
      const text = textOf(el);
      const size = parseFloat(cs.fontSize);
      const weight = parseInt(cs.fontWeight, 10) || 400;

      if (text) {
        // 1. 글자 크기
        if (size < 12) add('오류', '글자 크기', el, `${size}px "${text.slice(0, 20)}" (12px 이상)`);
        // 2. 대비
        const { bg, unknown } = bgOf(el, win);
        const fg = over(rgba(cs.color), bg);
        const r = ratio(fg, bg);
        const large = size >= 24 || (size >= 18.66 && weight >= 700);
        const need = large ? 3 : 4.5;
        const disabled = el.closest('[disabled],[aria-disabled="true"]');
        if (r < need && !disabled) {
          add(unknown ? '확인' : '오류', '대비', el, `${r.toFixed(2)} (${hex(fg)} / ${hex(bg)}) "${text.slice(0, 20)}" 기준 ${need}${unknown ? ', 배경 이미지가 있어 직접 확인' : ''}`);
        }
        // 3. 순수 검정
        if (hex(rgba(cs.color)) === '#000000' && rgba(cs.color)[3] === 1) add('오류', '순수 검정', el, `글자색 #000 "${text.slice(0, 20)}"`);
        // 4. 이모지, 가운데 점, 긴 대시
        if (EMOJI.test(text)) add('오류', '이모지', el, `"${text.slice(0, 30)}"`);
        if (/[·—]/.test(text)) add('오류', '가운데 점, 긴 대시', el, `"${text.slice(0, 30)}"`);
        if (/추시/.test(text)) add('확인', '오타', el, `"추시" → "추천"? "${text.slice(0, 30)}"`);
      }
      // 5. 순수 검정 바탕
      const bgc = rgba(cs.backgroundColor);
      if (bgc[3] === 1 && hex(bgc) === '#000000') add('오류', '순수 검정', el, '바탕색 #000');
      // 6. 터치 영역 (휴대폰 폭에서만)
      const interactive = el.matches('button, a[href], input:not([type=hidden]), select, textarea, [role=button], [role=tab], [role=switch], summary');
      if (interactive && width <= 480) {
        const host = el.matches('input') && el.closest('label') ? el.closest('label') : el;
        const rc = host.getBoundingClientRect();
        if (rc.height < 40 || rc.width < 40) add('확인', '터치 영역', el, `${Math.round(rc.width)}×${Math.round(rc.height)}px (44px 권장, 감싼 영역이 넓으면 괜찮음)`);
      }
      // 7. 채운 강조색 버튼 수
      if (rootAccent[3] > 0 && el.matches('button, a, [role=button]')) {
        if (hex(bgc) === hex(rootAccent) && bgc[3] === 1) accentFilled++;
      }
    }
    if (accentFilled > 1) add('확인', '강조 버튼 수', null, `채운 강조색 버튼 ${accentFilled}개 (화면마다 하나가 원칙. 숨은 화면, 다른 탭의 버튼이면 괜찮음)`);
    // 8. 가로 넘침
    const sw = doc.documentElement.scrollWidth;
    if (sw > width + 1) add('오류', '가로 넘침', null, `문서 폭 ${sw}px가 화면 폭 ${width}px보다 넓음`);
    return out;
  };
})();
