// 사용: node check_layout.js <index.html 경로> [폭,폭,...]
// 폭마다 가로 스크롤, 깨진 이미지, 콘솔 에러, 잘린 요소(탭·버튼·글자)를 찾는다.
// 일부러 넘치게 만든 영역(마퀴, 슬라이더 트랙)은 감싸는 요소에 훅 클래스 __overflow 를 붙이면 검사에서 빠진다.
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

const cache = path.join(process.env.HOME, '.cache/figma-to-web-fonts');
const nm = path.join(cache, 'node_modules');
if (!fs.existsSync(path.join(nm, 'jquery'))) {
    execSync(`npm i --silent --prefix ${cache} pretendard-std@1.3.9 @boxicons/core@1.0.6 jquery@3.7.1`, { stdio: 'inherit' });
}
const { chromium } = require('playwright');

const file = path.resolve(process.argv[2] || 'index.html');
const widths = (process.argv[3] || '1920,1600,1440,1281,1280,1024,800,640,445,390,360').split(',').map(Number);
const b64 = (p) => fs.readFileSync(p).toString('base64');

let pretendard = '';
[['Regular', 400], ['Medium', 500], ['SemiBold', 600], ['Bold', 700], ['ExtraBold', 800]].forEach(([w, n]) => {
    const f = path.join(nm, `pretendard-std/dist/web/static/woff2/PretendardStd-${w}.woff2`);
    if (fs.existsSync(f)) {
        pretendard += `@font-face{font-family:"Pretendard Std";font-weight:${n};src:url(data:font/woff2;base64,${b64(f)}) format("woff2")}`;
    }
});
const bxDir = path.join(nm, '@boxicons/core/fonts/basic');
const boxicons = fs.readFileSync(path.join(bxDir, 'boxicons.min.css'), 'utf8')
    .replace(/@font-face\{[^}]*\}/, `@font-face{font-family:"boxicons";src:url(data:font/woff2;base64,${b64(path.join(bxDir, 'boxicons.woff2'))}) format("woff2")}`);
const jquery = fs.readFileSync(path.join(nm, 'jquery/dist/jquery.min.js'), 'utf8');

function inspect() {
    const docW = document.documentElement.clientWidth;
    const name = (el) => {
        const c = typeof el.className === 'string' ? el.className : (el.className && el.className.baseVal) || '';
        return el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') + (c ? '.' + c.trim().split(/\s+/).join('.') : '');
    };
    const visible = (el) => {
        const r = el.getBoundingClientRect();
        const s = getComputedStyle(el);
        return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none';
    };
    const intentional = (el) => !!el.closest('.__overflow, .swiper, .slick-list, [class*="marquee"], [class*="slider"], [class*="track"], [class*="glow"], [aria-hidden="true"]');
    const res = { scrollWidth: document.documentElement.scrollWidth, broken: [], wide: [], clipped: [], tabs: [] };

    document.querySelectorAll('img').forEach((img) => {
        if (img.getAttribute('src') && img.complete && img.naturalWidth === 0) res.broken.push(img.getAttribute('src'));
    });

    const hiddenText = (el) => !!el.closest('.sr-only, .blind, .visually-hidden, [aria-hidden="true"]');
    const moving = (el, stop) => {
        for (let n = el; n && n !== stop; n = n.parentElement) {
            if (n.getAnimations && n.getAnimations().some((an) => an.playState === 'running')) return true;
            if (n !== el && getComputedStyle(n).transform !== 'none' && n.scrollWidth > n.parentElement.clientWidth * 1.5) return true;
        }
        return false;
    };
    document.querySelectorAll('body *').forEach((el) => {
        if (!visible(el) || intentional(el)) return;
        const s = getComputedStyle(el);
        const r = el.getBoundingClientRect();
        if (s.position !== 'fixed' && r.right > docW + 1 && res.wide.length < 8) res.wide.push(name(el));
        const hasText = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
        if (!hasText || hiddenText(el) || res.clipped.length >= 12) return;
        const label = `${name(el)} "${el.textContent.trim().slice(0, 20)}"`;
        if ((['hidden', 'clip'].includes(s.overflowX) || s.textOverflow === 'ellipsis') && el.scrollWidth > el.clientWidth + 1) {
            res.clipped.push(`${label} 글자가 자기 칸에서 잘림`);
            return;
        }
        let clipper = null;
        for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) {
            const ps = getComputedStyle(p);
            if (ps.overflowX === 'visible') continue;
            clipper = p;
            const pr = p.getBoundingClientRect();
            const out = r.left < pr.left - 1 || r.right > pr.right + 1;
            const fullyOut = r.right <= pr.left + 1 || r.left >= pr.right - 1;
            if (out && !fullyOut && !moving(el, p)) {
                res.clipped.push(`${label} ${name(p)} 경계에 걸려 일부만 보임`);
            }
            break;
        }
        if (!clipper && s.whiteSpace.includes('nowrap') && (r.right > docW + 1 || r.left < -1)) {
            res.clipped.push(`${label} 한 줄 고정 글자가 화면 밖으로 나감`);
        }
    });

    document.querySelectorAll('[role="tablist"], [class*="tab-list"], [class*="tabs"], [class*="tab_list"]').forEach((list) => {
        if (!visible(list)) return;
        const lr = list.getBoundingClientRect();
        const items = [...list.querySelectorAll('[role="tab"], button, a')].filter(visible);
        const cut = items.filter((t) => {
            const r = t.getBoundingClientRect();
            return r.left < lr.left - 1 || r.right > lr.right + 1 || r.left < -1 || r.right > docW + 1 || t.scrollWidth > t.clientWidth + 1;
        });
        const scrolls = list.scrollWidth > list.clientWidth + 1;
        if (cut.length || scrolls) {
            res.tabs.push(`${name(list)}: 탭 ${items.length}개 중 ${cut.length}개가 잘리거나 넘침${scrolls ? ', 목록이 가로 스크롤됨' : ''} → 탭 목록 규칙(rules-interaction.md) 확인`);
        }
    });
    return res;
}

(async () => {
    const browser = await chromium.launch();
    let problems = 0;
    for (const w of widths) {
        const ctx = await browser.newContext({ viewport: { width: w, height: 900 }, reducedMotion: 'reduce' });
        const page = await ctx.newPage();
        await page.route(/cdn\.jsdelivr\.net\/npm\/pretendard/, (r) => r.fulfill({ contentType: 'text/css', body: pretendard }));
        await page.route(/cdn\.boxicons\.com/, (r) => r.fulfill({ contentType: 'text/css', body: boxicons }));
        await page.route(/code\.jquery\.com/, (r) => r.fulfill({ contentType: 'application/javascript', body: jquery }));
        await page.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
        const errors = [];
        page.on('pageerror', (e) => errors.push(e.message));
        page.on('console', (m) => { if (m.type() === 'error' && !/net::ERR/.test(m.text())) errors.push(m.text()); });
        await page.goto('file://' + file);
        await page.waitForTimeout(800);
        const r = await page.evaluate(inspect);
        const lines = [];
        if (r.scrollWidth > w) lines.push(`가로 스크롤: 문서 폭 ${r.scrollWidth} > 화면 ${w}`, ...r.wide.map((x) => '  넘친 요소 ' + x));
        r.broken.forEach((x) => lines.push('깨진 이미지 ' + x));
        r.tabs.forEach((x) => lines.push(x));
        r.clipped.forEach((x) => lines.push('잘림 ' + x));
        errors.forEach((x) => lines.push('스크립트 에러 ' + x));
        problems += lines.length;
        console.log(`[${w}] ${lines.length ? '' : '문제 없음'}`);
        lines.forEach((l) => console.log('  ' + l));
        await ctx.close();
    }
    await browser.close();
    console.log(problems ? `\n확인할 항목 ${problems}개` : '\n모든 폭에서 문제 없음');
})();
