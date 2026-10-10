#!/usr/bin/env node
/**
 * Bath flow test — اختبار تدفق الاستحمام الكامل في Baby Care World.
 *
 * يشغّل index.html في Chromium (headless)، ينتقل إلى غرفة الاستحمام (BathroomScene)،
 * ثم يقود الأطوار الأربعة بأحداث فأرة حقيقية (Mouse events) وفق docs/bath-activity-flow.md:
 *
 *   ENTER  : سحب الطفل وإفلاته داخل الحوض
 *   FILL   : ضغط مطوّل على الصنبور لملء الحوض
 *   SOAP   : سحب الصابون وفركه فوق جسم الطفل
 *   RINSE  : سحب رأس الدش فوق الطفل للشطف
 *   DONE   : الطفل نظيف (نجاح)
 *
 * يلتقط لقطات شاشة في محطات التدفق، ويفشل (exit 1) إن لم يصل إلى DONE بالترتيب الصحيح.
 *
 * المتطلبات (خارج المستودع):
 *   npm i puppeteer-core
 *   متصفح Chrome/Chromium عبر متغير البيئة CHROME_PATH
 *
 * التشغيل (بعد تشغيل خادم ثابت في جذر المستودع، مثل: python3 -m http.server 8080):
 *   CHROME_PATH=/path/to/chrome BATH_URL=http://127.0.0.1:8080/index.html \
 *     node tools/bath_flow_test.mjs [مجلد_اللقطات]
 *
 * ملاحظة: index.html يحمّل Phaser من CDN؛ الاختبار يعترض هذا الطلب ويقدّم
 * vendor/phaser.min.js (نفس الإصدار 3.80.1) حتى يعمل دون إنترنت.
 */

import { readFile, mkdir } from 'node:fs/promises';
import { dirname, resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, '..');
const BATH_URL = process.env.BATH_URL || 'http://127.0.0.1:8080/index.html';
const CHROME_PATH = process.env.CHROME_PATH;
const SHOT_DIR = resolve(process.argv[2] || join(repoRoot, 'docs', 'screenshots'));
const W = 1920, H = 1080;
const ORDER = ['ENTER', 'FILL', 'SOAP', 'RINSE', 'DONE'];

if (!CHROME_PATH) {
  console.error('CHROME_PATH غير محدد');
  process.exit(2);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  const phaserSrc = await readFile(join(repoRoot, 'vendor', 'phaser.min.js'));
  await mkdir(SHOT_DIR, { recursive: true });

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'],
    defaultViewport: { width: 1600, height: 900 },
  });
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });

  // 1) الالتقاط: كائن Phaser.Game يُلتقط عند إنشائه لاستخدامه في الاختبار فقط
  await page.evaluateOnNewDocument(() => {
    let P;
    Object.defineProperty(window, 'Phaser', {
      configurable: true,
      get() { return P; },
      set(v) {
        P = v;
        const G = v.Game;
        v.Game = function (cfg) { const g = new G(cfg); window.__game = g; return g; };
        v.Game.prototype = G.prototype;
      },
    });
  });

  // 2) Phaser المحلي بدل CDN
  await page.setRequestInterception(true);
  page.on('request', (req) => {
    const url = req.url();
    if (url.includes('cdn.jsdelivr.net') && url.includes('phaser')) {
      req.respond({ status: 200, contentType: 'application/javascript', body: phaserSrc });
    } else if (url.startsWith('http://127.0.0.1') || url.startsWith('http://localhost')) {
      req.continue();
    } else {
      req.abort();
    }
  });

  await page.goto(BATH_URL, { waitUntil: 'load' });
  await page.waitForFunction(() => window.__game && window.__game.scene, { timeout: 60000 });

  // 3) انتظار انتهاء التحميل ثم الانتقال إلى الحمام
  await page.waitForFunction(() => {
    const sm = window.__game.scene;
    return sm.getScene('MenuScene') && sm.getScene('MenuScene').sys.isActive();
  }, { timeout: 60000 });
  await page.evaluate(() => window.__game.scene.start('BathroomScene'));
  await page.waitForFunction(() => {
    const s = window.__game.scene.getScene('BathroomScene');
    return s && s.sys.isActive() && s.step === 'ENTER' && s.baby && s.soap && s.shower;
  }, { timeout: 60000 });

  // أدوات مساعدة داخل الصفحة
  const info = () => page.evaluate(() => {
    const s = window.__game.scene.getScene('BathroomScene');
    const c = window.__game.canvas.getBoundingClientRect();
    const k = c.width / window.__game.scale.width;
    return {
      step: s.step, progress: Math.round(s.progress || 0),
      baby: { x: s.baby.x, y: s.baby.y }, soap: { x: s.soap.x, y: s.soap.y }, shower: { x: s.shower.x, y: s.shower.y },
      canvas: { left: c.left, top: c.top, k, gw: window.__game.scale.width, gh: window.__game.scale.height },
    };
  });
  const toScreen = (st, x, y) => ({ x: st.canvas.left + x * st.canvas.k, y: st.canvas.top + y * st.canvas.k });

  const seen = [];
  const log = async (label) => {
    const st = await info();
    if (seen[seen.length - 1] !== st.step) seen.push(st.step);
    console.log(`[${label}] step=${st.step} progress=${st.progress}`);
    return st;
  };
  const shot = async (name) => {
    const p = join(SHOT_DIR, name);
    await page.screenshot({ path: p });
    console.log('screenshot ->', p);
  };
  const waitStep = async (step, timeoutMs) => {
    await page.waitForFunction((st) => window.__game.scene.getScene('BathroomScene').step === st, { timeout: timeoutMs }, step);
  };
  // سحب عنصر من (fx,fy) إلى (tx,ty) بخطوات صغيرة (تحقق منطق الحد الأدنى/الأقصى لكل حركة)
  const dragPath = async (fromG, toG, stepPx = 12) => {
    const st = await info();
    const a = toScreen(st, fromG.x, fromG.y), b = toScreen(st, toG.x, toG.y);
    await page.mouse.move(a.x, a.y);
    await page.mouse.down();
    const n = Math.max(2, Math.ceil(Math.hypot(toG.x - fromG.x, toG.y - fromG.y) / stepPx));
    await page.mouse.move(b.x, b.y, { steps: n });
    await page.mouse.up();
  };

  await log('start');
  await shot('bath-flow-01-start.png');

  // ---- ENTER: إسقاط الطفل داخل الحوض ----
  {
    const st = await info();
    // الإسقاط داخل القطع الإهليلجي (dropZone) مركزه (1320, 600)
    await dragPath(st.baby, { x: 1320, y: 600 }, 14);
    await waitStep('FILL', 15000);
  }
  await log('after ENTER');
  await shot('bath-flow-02-baby-in-tub.png');

  // ---- FILL: ضغط مطوّل على الصنبور ----
  {
    const st = await info();
    const f = toScreen(st, 1521, 512);
    await page.mouse.move(f.x, f.y);
    await page.mouse.down();
    await waitStep('SOAP', 20000);
    await page.mouse.up();
  }
  await log('after FILL');
  await shot('bath-flow-03-filled.png');

  // ---- SOAP: فرك الجسم بالصابون (حركات أفقية فوق الطفل) ----
  {
    // ضغطة واحدة متصلة: الإمساك بالصابون ثم حركات ذهاب وإياب فوق الطفل
    // (الصابون يعود إلى مكانه عند الإفلات، لذلك لا نفلت حتى انتهاء الطور)
    const st = await info();
    const sx = st.baby.x;
    const row = st.baby.y - 80;
    const grab = toScreen(st, st.soap.x, st.soap.y);
    await page.mouse.move(grab.x, grab.y);
    await page.mouse.down();
    const first = toScreen(st, sx - 150, row);
    await page.mouse.move(first.x, first.y, { steps: 30 });
    for (let pass = 0; pass < 60; pass++) {
      const s2 = await info();
      if (s2.step !== 'SOAP') break;
      const from = pass % 2 === 0 ? sx - 150 : sx + 150;
      const to = pass % 2 === 0 ? sx + 150 : sx - 150;
      const p0 = toScreen(s2, from, row), p1 = toScreen(s2, to, row);
      await page.mouse.move(p0.x, p0.y);
      await page.mouse.move(p1.x, p1.y, { steps: 40 });
      if (pass === 3) await shot('bath-flow-04-soap-mid.png');
    }
    await page.mouse.up();
  }
  await waitStep('RINSE', 30000);
  await log('after SOAP');

  // ---- RINSE: رأس الدش فوق الطفل ----
  {
    const st = await info();
    const a = toScreen(st, st.shower.x, st.shower.y);
    await page.mouse.move(a.x, a.y);
    await page.mouse.down();
    const sx = st.baby.x, row = st.baby.y - 120;
    const p0 = toScreen(await info(), sx - 140, row);
    await page.mouse.move(p0.x, p0.y, { steps: 10 });
    for (let pass = 0; pass < 60; pass++) {
      const s2 = await info();
      if (s2.step !== 'RINSE') break;
      const from = pass % 2 === 0 ? sx - 140 : sx + 140;
      const to = pass % 2 === 0 ? sx + 140 : sx - 140;
      const p1 = toScreen(s2, to, row);
      await page.mouse.move(p1.x, p1.y, { steps: 36 });
      if (pass === 3) await shot('bath-flow-05-rinse-mid.png');
    }
    await page.mouse.up();
  }
  await waitStep('DONE', 30000);
  await log('after RINSE');
  await sleep(1500); // انتهاء تأثيرات الاحتفال
  await shot('bath-flow-06-done.png');

  // ---- التحقق من الترتيب ----
  const order = seen.filter((s) => ORDER.includes(s));
  const expected = ORDER.filter((s) => order.includes(s));
  const ok = JSON.stringify(order) === JSON.stringify(ORDER);
  console.log('observed steps:', order.join(' -> '));
  if (errors.length) console.log('browser errors:\n  ' + errors.slice(0, 10).join('\n  '));
  await browser.close();
  if (!ok || expected.length !== ORDER.length) {
    console.error('FAIL: التدفق لم يمر بالأطوار الخمسة بالترتيب');
    process.exit(1);
  }
  console.log('PASS: bath flow ENTER → FILL → SOAP → RINSE → DONE');
}

main().catch((e) => {
  console.error('FAIL:', e.message);
  process.exit(1);
});
