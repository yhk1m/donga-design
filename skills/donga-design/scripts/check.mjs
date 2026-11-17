#!/usr/bin/env node
// © 2026 양정고등학교 지리교사 김용현 (bgnlkim@gmail.com)
// 동아 디자인 화면 점검 (당토 디자인 점검에 .dc-content 래퍼 다크 모드를 더함)
// 쓰는 법: node check.mjs <화면.html> [--widths 390,820,1180] [--json]
// 하는 일: 헤드리스 Chrome으로 화면을 열어 라이트와 다크, 휴대폰 폭과 데스크톱 폭에서
//          글자 대비, 12px 미만 글자, 순수 검정, 이모지, 가운데 점과 긴 대시,
//          터치 영역, 채운 강조색 버튼 수, 가로 넘침(넘친 요소), viewport, 100vh,
//          휴대폰 입력 칸 글자, 아이콘만 있는 메뉴, 태블릿 글줄 폭을 찾는다.
// 필요한 것: Node 18 이상, Chrome 또는 Chromium (CHROME_PATH 환경 변수로 지정 가능)
// 끝 코드: 오류가 하나라도 있으면 1, 없으면 0

import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const target = args.find(a => !a.startsWith('--'));
if (!target || !existsSync(target)) {
  console.error('쓰는 법: node check.mjs <화면.html> [--widths 390,820,1180] [--json]');
  process.exit(2);
}
const wi = args.indexOf('--widths');
const widths = (wi >= 0 ? args[wi + 1] : '390,820,1180').split(',').map(Number).filter(Boolean);
const asJson = args.includes('--json');

function findChrome() {
  const cands = [
    process.env.CHROME_PATH,
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
    process.env.LOCALAPPDATA && join(process.env.LOCALAPPDATA, 'Google/Chrome/Application/chrome.exe'),
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Chromium.app/Contents/MacOS/Chromium',
    '/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/usr/bin/chromium', '/usr/bin/chromium-browser',
  ].filter(Boolean);
  return cands.find(p => existsSync(p));
}
const chrome = findChrome();
if (!chrome) {
  console.error('Chrome을 찾지 못했어요. CHROME_PATH 환경 변수에 Chrome 실행 파일 경로를 넣어 주세요.');
  process.exit(2);
}

// 윈도우에서 한글이 든 경로는 Chrome 옵션에서 문제가 될 수 있어 공용 폴더를 쓴다
const base = process.platform === 'win32' && process.env.PUBLIC ? process.env.PUBLIC : tmpdir();
const work = mkdtempSync(join(base, 'donga-check-'));
const targetUrl = pathToFileURL(resolve(target)).href;
const inpage = readFileSync(join(here, 'inpage-check.js'), 'utf8');

function runner(mode) {
  return `<!doctype html><html><head><meta charset="utf-8"></head><body>
<pre id="out">대기</pre>
<script>${inpage}</script>
<script>
const widths = ${JSON.stringify(widths)};
const mode = ${JSON.stringify(mode)};
const results = [];
function one(i) {
  if (i >= widths.length) { document.getElementById('out').textContent = 'RESULT:' + JSON.stringify(results); return; }
  const f = document.createElement('iframe');
  // 폭에 맞는 기기 높이: 휴대폰 844, 태블릿 세로 1180, 태블릿 가로 820
  const w = widths[i], h = w < 744 ? 844 : w < 1024 ? 1180 : w <= 1200 ? 820 : 900;
  f.style.cssText = 'border:0;height:' + h + 'px;width:' + w + 'px';
  f.onload = () => {
    try { if (mode === 'dark') { const d = f.contentDocument; d.documentElement.setAttribute('data-theme', 'dark'); d.querySelectorAll('.dc-content').forEach(n => n.setAttribute('data-theme', 'dark')); } } catch (e) {}
    setTimeout(() => {
      try { results.push(...window.__dangtoCheck(f.contentDocument, mode, widths[i])); }
      catch (e) { results.push({ level: '확인', rule: '점검 실패', mode, width: widths[i], where: '', msg: String(e) }); }
      f.remove(); one(i + 1);
    }, 1500);
  };
  f.src = ${JSON.stringify(targetUrl)};
  document.body.appendChild(f);
}
one(0);
</script></body></html>`;
}

const all = [];
try {
  for (const mode of ['light', 'dark']) {
    const page = join(work, `run-${mode}.html`);
    writeFileSync(page, runner(mode));
    const dom = execFileSync(chrome, [
      '--headless=new', '--disable-gpu', '--hide-scrollbars', '--allow-file-access-from-files',
      `--user-data-dir=${join(work, 'profile-' + mode)}`,
      `--blink-settings=preferredColorScheme=${mode === 'dark' ? 0 : 1}`,
      '--window-size=1400,1000', '--virtual-time-budget=15000', '--dump-dom',
      pathToFileURL(page).href,
    ], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, stdio: ['ignore', 'pipe', 'ignore'] });
    const m = dom.match(/RESULT:(\[[\s\S]*?\])<\/pre>/);
    if (!m) throw new Error('점검 결과를 받지 못했어요 (' + mode + ')');
    const txt = m[1].replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&amp;/g, '&');
    all.push(...JSON.parse(txt));
  }
} finally {
  rmSync(work, { recursive: true, force: true });
}

// 같은 문제가 여러 폭과 모드에서 반복되면 하나로 묶는다
const seen = new Map();
for (const r of all) {
  const key = r.level + r.rule + r.where + r.msg;
  const tag = `${r.mode === 'dark' ? '다크' : '라이트'} ${r.width}`;
  if (seen.has(key)) { const it = seen.get(key); it.count++; if (!it.at.includes(tag)) it.at.push(tag); }
  else seen.set(key, { ...r, at: [tag], count: 1 });
}
const list = [...seen.values()];
const errors = list.filter(r => r.level === '오류');
const checks = list.filter(r => r.level !== '오류');

if (asJson) {
  console.log(JSON.stringify({ errors: errors.length, checks: checks.length, items: list }, null, 2));
} else {
  console.log(`동아 디자인 점검: ${target}`);
  console.log(`오류 ${errors.length}개, 직접 확인할 것 ${checks.length}개\n`);
  for (const [title, group] of [['오류', errors], ['직접 확인할 것', checks]]) {
    if (!group.length) continue;
    console.log(`[${title}]`);
    for (const r of group.slice(0, 60)) console.log(`- ${r.rule}: ${r.where ? r.where + ' ' : ''}${r.msg} (${r.at.join(', ')}${r.count > r.at.length ? `, ${Math.round(r.count / r.at.length)}곳` : ''})`);
    if (group.length > 60) console.log(`  …외 ${group.length - 60}개`);
    console.log('');
  }
  if (!list.length) console.log('걸린 곳이 없어요.');
}
process.exit(errors.length ? 1 : 0);
