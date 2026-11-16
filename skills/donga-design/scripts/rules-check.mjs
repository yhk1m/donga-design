#!/usr/bin/env node
// 동아 디자인 구조, 보안 규칙 점검 (코드만 읽고 실행하지 않는다)
// 쓰는 법: node rules-check.mjs <index.html 또는 제출 폴더> [--json]
// 하는 일: 두클래스 탑재 규칙(단일 index.html, .dc-content 래퍼, 금지 API, 외부 자원, 겹침 순서 등)을 어긴 곳을 찾는다.
//          화면 디자인 점검은 check.mjs가 맡는다.
// 끝 코드: 오류가 하나라도 있으면 1, 없으면 0
// 한계: 글자 맞추기 점검이라 담당자 보안 검사기(htmlcheck.dongapublishing.com)를 대신하지 못한다.

import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { basename, extname, join, relative } from 'node:path';

const args = process.argv.slice(2);
const target = args.find(a => !a.startsWith('--'));
const asJson = args.includes('--json');
if (!target || !existsSync(target)) {
  console.error('쓰는 법: node rules-check.mjs <index.html 또는 제출 폴더> [--json]');
  process.exit(2);
}

const items = [];
const add = (level, rule, file, line, msg) => items.push({ level, rule, file, line, msg });

// ----- 폴더 점검 -----
let root = target, html = target;
if (statSync(target).isDirectory()) {
  html = join(target, 'index.html');
  if (!existsSync(html)) { add('오류', '구조', basename(target), 0, '폴더 맨 위에 index.html이 없어요. 바깥 폴더를 한 겹 더 만들지 않아요.'); }
  const walk = d => readdirSync(d).flatMap(n => {
    const p = join(d, n);
    return statSync(p).isDirectory() ? [p + '/', ...walk(p)] : [p];
  });
  for (const p of walk(target)) {
    const rel = relative(target, p).replace(/\\/g, '/');
    if (/(^|\/)(node_modules|\.git|\.vscode|\.idea)\//.test(rel)) { add('오류', '제출물', rel, 0, '제출하지 않는 폴더예요.'); continue; }
    if (/(^|\/)\.env|\.key$|\.pem$|(^|\/)\.DS_Store$|Thumbs\.db$|~$|\.tmp$|\.log$/i.test(rel)) add('오류', '제출물', rel, 0, '비밀 정보나 임시 파일은 넣지 않아요.');
    const ext = extname(p).toLowerCase();
    if (rel !== 'index.html' && ['.js', '.mjs', '.css', '.html', '.htm'].includes(ext)) add('오류', '구조', rel, 0, 'CSS와 JS는 index.html 안에만 둬요. 따로 둔 파일이에요.');
  }
} else {
  root = join(html, '..');
  if (basename(html).toLowerCase() !== 'index.html') add('확인', '구조', basename(html), 0, '제출 파일 이름은 index.html이어야 해요.');
}
if (!existsSync(html)) finish();

const src = readFileSync(html, 'utf8');
const lines = src.split(/\r?\n/);
const file = basename(html);
const lineOf = idx => src.slice(0, idx).split(/\r?\n/).length;

const blank = s => s.replace(/[^\n]/g, ' ');
const noHtmlComments = s => s.replace(/<!--[\s\S]*?-->/g, blank);
// style, script 구간 나누기
const blocks = (tag) => [...noHtmlComments(src).matchAll(new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'gi'))].map(m => ({ body: m[1], at: m.index + m[0].indexOf(m[1]) }));
const styles = blocks('style');
const scripts = blocks('script').filter(b => b.body.trim());

function scan(text, offset, re, level, rule, msg) {
  for (const m of text.matchAll(re)) add(level, rule, file, lineOf(offset + m.index), `${msg} (${m[0].trim().slice(0, 50)})`);
}
// 주석 지우기 (줄 수는 유지)
const noCssComments = s => s.replace(/\/\*[\s\S]*?\*\//g, blank);
const noJsComments = s => s.replace(/\/\*[\s\S]*?\*\//g, blank).replace(/(^|[^:\\'"])\/\/[^\n]*/g, (m, a) => a + blank(m.slice(a.length)));

const page = noHtmlComments(src);

// ----- 외부 자원 -----
scan(page, 0, /<script\b[^>]*\bsrc\s*=/gi, '오류', '외부 자원', 'script src로 파일을 불러오지 않아요. JS는 index.html 안에');
scan(page, 0, /<link\b[^>]*rel\s*=\s*["']?(stylesheet|preload|modulepreload|import)[^>]*>/gi, '오류', '외부 자원', 'link로 CSS나 글꼴을 불러오지 않아요');
scan(page, 0, /<(iframe|object|embed|frame|portal)\b/gi, '오류', '외부 자원', 'iframe, object, embed를 쓰지 않아요');
scan(page, 0, /<meta\b[^>]*http-equiv\s*=\s*["']?refresh/gi, '오류', '이동', '자동 이동을 쓰지 않아요');
scan(page, 0, /\b(?:src|href|action|poster|data)\s*=\s*["']\s*(?:https?:)?\/\/[^"']+/gi, '오류', '외부 자원', '외부 주소를 쓰지 않아요. 자료는 ./ 상대 경로로');
scan(page, 0, /\b(?:src|href|action)\s*=\s*["']\s*(?:javascript|data|blob|vbscript):/gi, '오류', '링크', 'javascript:, data:, blob: 주소를 쓰지 않아요');
scan(page, 0, /\s(on[a-z]+)\s*=\s*["']/gi, '오류', '이벤트 속성', 'onclick 같은 이벤트 속성 대신 addEventListener');
scan(page, 0, /<a\b[^>]*target\s*=\s*["']?_blank/gi, '확인', '이동', '새 창 열기 링크예요. 출처 표시 외에는 쓰지 않아요');
scan(page, 0, /<form\b[^>]*action\s*=/gi, '오류', '이동', '폼을 다른 주소로 보내지 않아요');

// ----- 래퍼 -----
if (!/class\s*=\s*["'][^"']*\bdc-content\b/.test(page)) add('오류', '래퍼', file, 0, '화면 전체를 <div class="dc-content">로 감싸지 않았어요');

// ----- CSS -----
for (const { body, at } of styles) {
  const css = noCssComments(body);
  scan(css, at, /!important/gi, '오류', 'CSS', '!important 대신 클래스를 겹쳐 우선순위를 올려요');
  scan(css, at, /position\s*:\s*fixed/gi, '오류', 'CSS', 'position:fixed 대신 래퍼 안 absolute나 sticky');
  for (const m of css.matchAll(/z-index\s*:\s*(-?\d+)/gi)) if (Math.abs(+m[1]) > 100) add('오류', 'CSS', file, lineOf(at + m.index), `z-index는 100 이하 (${m[1]})`);
  scan(css, at, /@import\b/gi, '오류', '외부 자원', '@import로 CSS를 불러오지 않아요');
  scan(css, at, /url\(\s*["']?\s*(?:https?:)?\/\//gi, '오류', '외부 자원', '외부 글꼴, 그림 주소를 쓰지 않아요');
  scan(css, at, /url\(\s*["']?\s*(?:data|blob):/gi, '확인', '외부 자원', 'data: 주소예요. 검사기에서 걸릴 수 있어 파일로 두는 편이 안전해요');
  // 선택자 점검: 규칙 머리만 본다
  const flat = css.replace(/@(font-face|keyframes|-webkit-keyframes)[^{]*\{(?:[^{}]*|\{[^{}]*\})*\}/gi, blank).replace(/@(media|supports|container|layer)[^{]*\{/gi, blank);
  for (const m of flat.matchAll(/([^{}@;]+)\{/g)) {
    const sel = m[1].trim();
    if (!sel || /^(from|to|\d+%)/.test(sel)) continue;
    for (const part of sel.split(',').map(s => s.trim())) {
      if (!/^\.dc-content\b/.test(part)) add('오류', '선택자', file, lineOf(at + m.index), `.dc-content로 시작하지 않는 선택자 "${part.slice(0, 40)}"`);
    }
  }
}

// ----- JS -----
for (const { body, at } of scripts) {
  const js = noJsComments(body);
  const rules = [
    [/\.(innerHTML|outerHTML)\s*[+]?=/g, 'HTML 문자열 넣기 대신 createElement와 textContent'],
    [/\binsertAdjacentHTML\s*\(/g, 'insertAdjacentHTML 대신 createElement'],
    [/\bdocument\.write(ln)?\s*\(/g, 'document.write를 쓰지 않아요'],
    [/\bDOMParser\b|\bcreateContextualFragment\b|\bsrcdoc\b/g, '문자열을 HTML로 바꾸지 않아요'],
    [/\beval\s*\(|\bnew\s+Function\s*\(|\bsetTimeout\s*\(\s*["'`]|\bsetInterval\s*\(\s*["'`]/g, 'eval, new Function, 문자열 타이머를 쓰지 않아요'],
    [/\bfetch\s*\(|\bXMLHttpRequest\b|\bWebSocket\b|\bEventSource\b|\bnavigator\.sendBeacon\b/g, '외부 통신을 하지 않아요 (공공기관 API 예외는 담당자 확인)'],
    [/\bnew\s+(Shared)?Worker\s*\(|\bimportScripts\b|\bimport\s*\(/g, 'Worker, 동적 import를 쓰지 않아요'],
    [/\bwindow\.open\s*\(|\blocation\s*(\.href\s*)?=|\blocation\.(assign|replace|reload)\s*\(|\bhistory\.(push|replace)State\b/g, '페이지를 옮기거나 새 창을 열지 않아요'],
    [/\b(window\.)?(parent|top|opener)\s*\.|\bpostMessage\s*\(/g, '부모 페이지에 접근하지 않아요'],
    [/\bdocument\.cookie\b/g, 'cookie를 쓰지 않아요'],
    [/\.setAttribute\s*\(\s*["']on[a-z]+["']/gi, '이벤트 속성을 넣지 않아요. addEventListener'],
    [/URL\.createObjectURL\s*\(|\.toDataURL\s*\(|\bdownload\s*=|\.download\s*=/g, '이미지, PDF 바로 저장 기능은 두지 않아요. 인쇄 창의 PDF 저장을 안내'],
  ];
  for (const [re, msg] of rules) scan(js, at, re, '오류', 'JS', msg);
  scan(js, at, /\bdocument\.(querySelector(All)?|getElementsBy\w+)\s*\(/g, '확인', 'JS', 'DOM 찾기는 래퍼 요소 안에서 (root.querySelector). getElementById로 래퍼 하나를 잡는 건 괜찮아요');
  scan(js, at, /\b(local|session)Storage\b|\bindexedDB\b/g, '확인', '저장', '저장은 기본으로 하지 않아요. 쓴다면 개인정보 아님, 고유 키, try/catch, 초기화 방법을 적어요');
  scan(js, at, /\bdocument\.(body|documentElement)\b/g, '확인', 'JS', '래퍼 밖(body, html)을 건드리지 않아요');
  scan(js, at, /\bnavigator\.(mediaDevices|geolocation)\b/g, '확인', '권한', '카메라, 마이크, 위치는 https에서 권한을 받아야 하고 개인정보를 남기지 않아요');
}

// ----- 접근성, 모바일 -----
if (!/<meta\b[^>]*name\s*=\s*["']viewport/i.test(page)) add('오류', '접근성', file, 0, 'viewport meta가 없어요');
scan(page, 0, /user-scalable\s*=\s*(no|0)|maximum-scale\s*=\s*1(\.0)?\b/gi, '오류', '접근성', '확대를 막지 않아요');
if (!/<html\b[^>]*\blang\s*=/i.test(page)) add('확인', '접근성', file, 0, '<html lang="ko">를 적어요');
for (const m of page.matchAll(/<img\b[^>]*>/gi)) if (!/\balt\s*=/.test(m[0])) add('오류', '접근성', file, lineOf(m.index), '이미지에 alt가 없어요');
scan(page, 0, /\bdraggable\s*=\s*["']?true|\bdragstart\b|\bpointermove\b/gi, '확인', '접근성', '끌기 동작에는 누르기, 키보드 대안을 함께 둬요');

finish();

function finish() {
  const errors = items.filter(i => i.level === '오류');
  const checks = items.filter(i => i.level !== '오류');
  if (asJson) console.log(JSON.stringify({ errors: errors.length, checks: checks.length, items }, null, 2));
  else {
    console.log(`동아 디자인 규칙 점검: ${target}`);
    console.log(`오류 ${errors.length}개, 직접 확인할 것 ${checks.length}개\n`);
    for (const [t, g] of [['오류', errors], ['직접 확인할 것', checks]]) {
      if (!g.length) continue;
      console.log(`[${t}]`);
      for (const i of g.slice(0, 80)) console.log(`- ${i.rule}: ${i.file}${i.line ? ':' + i.line : ''} ${i.msg}`);
      if (g.length > 80) console.log(`  …외 ${g.length - 80}개`);
      console.log('');
    }
    if (!items.length) console.log('걸린 곳이 없어요.');
    console.log('이 점검은 글자 맞추기라 두클래스 보안 검사기를 대신하지 못해요. 제출 전에 검사기도 돌려 주세요.');
  }
  process.exit(errors.length ? 1 : 0);
}
