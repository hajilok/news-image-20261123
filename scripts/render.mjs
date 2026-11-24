import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(SCRIPT_DIR, '..');
const STORIES_PATH = resolve(SCRIPT_DIR, 'stories.json');
const ART_DIR = process.env.ART_DIR ?? '/tmp/news-art';
const OUT_DIR = process.env.CANDIDATES_DIR ?? '/tmp/news-candidates';

function imgDataUri(fileName) {
  const fullPath = join(ART_DIR, fileName);
  if (!existsSync(fullPath)) {
    throw new Error(`Missing staged illustration: ${fullPath}`);
  }
  const b64 = readFileSync(fullPath).toString('base64');
  return `data:image/jpeg;base64,${b64}`;
}

function buildMasthead(data, height = 92, dateSize = 51) {
  return `
    <header style="
      background:#111C2D;
      border-top:4.5px solid #C83E2B;
      padding:11px 20px 9px;
      height:${height}px;
      display:flex;flex-direction:column;justify-content:center;align-items:center;
      gap:4.5px;
      flex-shrink:0;
    ">
      <div style="display:flex;align-items:center;gap:14px;width:100%;">
        <span style="height:1.2px;flex:1;background:rgba(243,220,158,0.52);"></span>
        <span style="
          font-family:'Liberation Sans',sans-serif;
          font-size:16.5px;font-weight:900;letter-spacing:0.16em;
          color:#F3DC9E;text-transform:uppercase;line-height:1;
        ">${data.edition}</span>
        <span style="height:1.2px;flex:1;background:rgba(243,220,158,0.52);"></span>
      </div>
      <h1 style="
        margin:0;
        font-family:'C059','P052','Liberation Serif',Georgia,serif;
        font-size:${dateSize}px;font-weight:700;line-height:1.0;
        letter-spacing:0.01em;color:#FAF6EE;
        white-space:nowrap;
      ">${data.dateLabel}</h1>
    </header>
  `;
}

function renderStoryBlock(story, opts) {
  const {
    artHeight,
    kickerSize = 14.5,
    headlineSize = 22.5,
    subSize = 16,
    useLines = false,
    useShortSub = false,
    pinNum = null,
    singleLineHeadline = false
  } = opts;
  const imgSrc = imgDataUri(story.art);
  const titleHtml = useLines && story.headlineLines ? story.headlineLines.join('<br/>') : story.headline;
  const subText = useShortSub && story.sublineShort ? story.sublineShort : story.subline;

  const pinBadge =
    pinNum !== null
      ? `<div style="
          position:absolute;top:7px;left:7px;
          width:26px;height:26px;border-radius:50%;
          background:${story.accent};color:#FFFFFF;
          border:2px solid #FAF6EE;
          display:flex;align-items:center;justify-content:center;
          font-family:'Liberation Sans',sans-serif;font-size:14.5px;font-weight:900;
          box-shadow:0 1.5px 4px rgba(0,0,0,0.45);
        ">${pinNum}</div>`
      : '';

  return `
    <article style="display:flex;flex-direction:column;gap:6px;height:100%;">
      <div style="
        position:relative;
        width:100%;height:${artHeight}px;overflow:hidden;
        background:#111926;border:1px solid #B6A78C;flex-shrink:0;
      ">
        <img src="${imgSrc}" style="width:100%;height:100%;object-fit:cover;display:block;${story.artStyle}" />
        ${pinBadge}
      </div>
      <div style="display:flex;flex-direction:column;gap:3.5px;padding-top:1px;">
        <div style="display:flex;align-items:center;gap:6px;">
          <span style="width:12px;height:3.5px;background:${story.accent};display:inline-block;flex-shrink:0;"></span>
          <span style="
            font-family:'Liberation Sans',sans-serif;
            font-size:${kickerSize}px;font-weight:900;letter-spacing:0.065em;
            color:${story.accent};text-transform:uppercase;line-height:1;
            white-space:nowrap;
          ">${story.kicker}</span>
        </div>
        <h2 style="
          margin:0;
          font-family:'Liberation Sans',sans-serif;
          font-size:${headlineSize}px;font-weight:900;line-height:1.06;
          letter-spacing:-0.022em;color:#0B1018;
          ${singleLineHeadline ? 'white-space:nowrap;' : ''}
        ">${titleHtml}</h2>
        <p style="
          margin:0;
          font-family:'Liberation Sans',sans-serif;
          font-size:${subSize}px;font-weight:600;line-height:1.19;
          color:#141D29;
        ">${subText}</p>
      </div>
    </article>
  `;
}

// Architecture R3-X: Asymmetric 57%/43% Hero Museum Broadsheet (7 Stories)
function buildArchX(data) {
  const s = data.stories;
  return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<style>
  * { box-sizing: border-box; }
  html, body {
    margin: 0; padding: 0; width: 1024px; height: 1024px; overflow: hidden;
    background: #F5EFE2; -webkit-font-smoothing: antialiased; text-rendering: geometricPrecision;
  }
</style>
</head>
<body>
  <div style="
    width:1024px;height:1024px;
    padding:12px 16px 12px;
    display:flex;flex-direction:column;
    background:#F5EFE2;
  ">
    ${buildMasthead(data, 92, 51)}

    <main style="display:flex;flex-direction:column;flex:1;margin-top:10px;border-bottom:3px solid #111C2D;padding-bottom:8px;">
      <!-- Row 1: Asymmetric 57% / 43% Commanding Hero Band -->
      <section style="
        display:grid;
        grid-template-columns:568px 1px 1fr;
        column-gap:12px;
        height:336px;
        padding-bottom:10px;
        border-bottom:1.5px solid #C6B9A0;
      ">
        ${renderStoryBlock(s.cop31, {
          artHeight: 224,
          kickerSize: 15,
          headlineSize: 31,
          subSize: 17.5,
          singleLineHeadline: true
        })}
        <div style="background:#C6B9A0;width:1px;height:100%;"></div>
        ${renderStoryBlock(s.nvidia, {
          artHeight: 192,
          kickerSize: 15,
          headlineSize: 27,
          subSize: 17,
          useLines: true
        })}
      </section>

      <!-- Row 2: Three-Column World Dispatch -->
      <section style="
        display:grid;
        grid-template-columns:1fr 1px 1fr 1px 1fr;
        column-gap:10px;
        height:312px;
        padding-top:10px;
        padding-bottom:10px;
        border-bottom:1.5px solid #C6B9A0;
      ">
        ${renderStoryBlock(s.corvette, { artHeight: 150, kickerSize: 14.5, headlineSize: 22, subSize: 16, useLines: true })}
        <div style="background:#C6B9A0;width:1px;height:100%;"></div>
        ${renderStoryBlock(s.india_nepal, { artHeight: 150, kickerSize: 14.5, headlineSize: 22, subSize: 16, useLines: true })}
        <div style="background:#C6B9A0;width:1px;height:100%;"></div>
        ${renderStoryBlock(s.drc, { artHeight: 150, kickerSize: 14.5, headlineSize: 22, subSize: 16, useLines: true })}
      </section>

      <!-- Row 3: Two-Column Wide World Band -->
      <section style="
        display:grid;
        grid-template-columns:1fr 1px 1fr;
        column-gap:12px;
        flex:1;
        padding-top:10px;
      ">
        ${renderStoryBlock(s.uk_rohingya, {
          artHeight: 148,
          kickerSize: 14.5,
          headlineSize: 22,
          subSize: 16.2,
          singleLineHeadline: true
        })}
        <div style="background:#C6B9A0;width:1px;height:100%;"></div>
        ${renderStoryBlock(s.fifa, {
          artHeight: 148,
          kickerSize: 14.5,
          headlineSize: 22,
          subSize: 16.2,
          singleLineHeadline: true
        })}
      </section>
    </main>
  </div>
</body>
</html>`;
}

// Architecture R3-Y: Unified Illustrated World-Map Editorial Mural (7 Stories)
function buildWorldMapCenterpiece(data) {
  const s = data.stories;
  const copImg = imgDataUri(s.cop31.art);
  const w = 992;
  const h = 326;

  // Clean simplified Natural-Earth-style world landmasses projected onto 992x326
  const continents = [
    // North America
    'M 64,52 L 138,34 L 214,32 L 284,48 L 326,78 L 298,108 L 266,126 L 238,148 L 222,166 L 198,162 L 182,144 L 154,126 L 128,98 L 92,82 Z',
    // Greenland
    'M 342,16 L 418,14 L 430,38 L 392,58 L 352,46 Z',
    // South America
    'M 262,174 L 316,170 L 358,194 L 378,228 L 352,272 L 316,306 L 286,316 L 270,286 L 274,242 L 250,204 Z',
    // Europe
    'M 456,64 L 512,38 L 578,34 L 620,52 L 612,84 L 578,100 L 538,102 L 502,106 L 468,94 Z',
    // UK
    'M 464,62 L 478,56 L 484,74 L 466,78 Z',
    // Africa
    'M 460,114 L 538,110 L 588,120 L 626,154 L 634,186 L 602,232 L 572,268 L 538,264 L 514,228 L 502,186 L 464,166 L 444,142 Z',
    // Madagascar
    'M 626,222 L 640,218 L 644,246 L 628,248 Z',
    // Asia
    'M 616,44 L 732,34 L 856,42 L 924,62 L 902,94 L 860,114 L 840,148 L 806,162 L 768,178 L 736,158 L 712,140 L 672,148 L 640,130 L 602,114 L 608,82 Z',
    // Japan / SE Asia
    'M 880,98 L 898,106 L 888,126 L 872,118 Z',
    'M 802,182 L 858,184 L 874,200 L 822,202 Z',
    // Australia
    'M 808,228 L 878,220 L 920,244 L 912,282 L 860,290 L 816,270 Z',
    // New Zealand
    'M 944,284 L 960,276 L 956,302 L 940,304 Z'
  ];

  // Pins matching Top [1,2,3] & Bottom [4,5,6]
  const pins = [
    { num: 1, x: 186, y: 98, color: s.nvidia.accent, label: 'USA' },
    { num: 2, x: 474, y: 68, color: s.uk_rohingya.accent, label: 'UK' },
    { num: 3, x: 742, y: 132, color: s.india_nepal.accent, label: 'INDIA · NEPAL' },
    { num: 4, x: 242, y: 146, color: s.fifa.accent, label: 'AMERICAS' },
    { num: 5, x: 540, y: 122, color: s.corvette.accent, label: 'BENGHAZI' },
    { num: 6, x: 568, y: 184, color: s.drc.accent, label: 'DR CONGO' }
  ];

  // Ukraine (580, 74) -> Benghazi (540, 122) dashed strike arc
  // Antalya pin (586, 102)
  return `
    <section style="
      position:relative;
      width:992px;height:${h}px;
      border:1.5px solid #B5A68A;
      background:#EAE2D0;
      overflow:hidden;
      flex-shrink:0;
    ">
      <svg viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg" style="display:block;">
        <!-- Subtle map graticules -->
        <line x1="0" y1="81" x2="${w}" y2="81" stroke="rgba(17,28,45,0.09)" stroke-width="1" stroke-dasharray="4 4"/>
        <line x1="0" y1="163" x2="${w}" y2="163" stroke="rgba(17,28,45,0.13)" stroke-width="1.1"/>
        <line x1="0" y1="245" x2="${w}" y2="245" stroke="rgba(17,28,45,0.09)" stroke-width="1" stroke-dasharray="4 4"/>
        <line x1="248" y1="0" x2="248" y2="${h}" stroke="rgba(17,28,45,0.08)" stroke-width="1" stroke-dasharray="4 4"/>
        <line x1="496" y1="0" x2="496" y2="${h}" stroke="rgba(17,28,45,0.08)" stroke-width="1" stroke-dasharray="4 4"/>
        <line x1="744" y1="0" x2="744" y2="${h}" stroke="rgba(17,28,45,0.08)" stroke-width="1" stroke-dasharray="4 4"/>

        ${continents.map((d) => `<path d="${d}" fill="#D2C3A3" stroke="#9A8968" stroke-width="1.2" stroke-linejoin="round"/>`).join('')}

        <!-- Ukraine to Benghazi 2,400 km strike arc -->
        <path d="M 578 76 Q 542 86 540 122" fill="none" stroke="#B83220" stroke-width="2.6" stroke-dasharray="5 3.5"/>
        <circle cx="578" cy="76" r="4.5" fill="#B83220"/>

        <!-- Leader line from Antalya (588, 102) to COP31 Hero Box -->
        <line x1="588" y1="102" x2="656" y2="188" stroke="#A32A1A" stroke-width="2.4"/>
        <circle cx="588" cy="102" r="7.5" fill="#A32A1A" stroke="#FAF6EE" stroke-width="2.2"/>

        ${pins
          .map(
            (p) => `
          <g>
            <circle cx="${p.x}" cy="${p.y}" r="14.5" fill="${p.color}" stroke="#FAF6EE" stroke-width="2.6"/>
            <text x="${p.x}" y="${p.y + 5.5}" text-anchor="middle" font-family="Liberation Sans, sans-serif" font-size="16" font-weight="900" fill="#FFFFFF">${p.num}</text>
          </g>
        `
          )
          .join('')}
      </svg>

      <!-- Embedded COP31 Centerpiece Card anchored cleanly over Indian Ocean / Southern Hemisphere empty ocean -->
      <div style="
        position:absolute;
        right:14px;bottom:14px;
        width:438px;height:142px;
        background:#FAF6EE;
        border:1.5px solid #A32A1A;
        border-left:5.5px solid #A32A1A;
        display:flex;flex-direction:row;
        box-shadow:0 4px 14px rgba(17,28,45,0.22);
      ">
        <div style="width:176px;height:100%;flex-shrink:0;overflow:hidden;background:#111926;">
          <img src="${copImg}" style="width:100%;height:100%;object-fit:cover;display:block;${s.cop31.artStyle}" />
        </div>
        <div style="padding:9px 11px;display:flex;flex-direction:column;justify-content:center;gap:4px;flex:1;">
          <span style="
            font-family:'Liberation Sans',sans-serif;font-size:13.5px;font-weight:900;
            letter-spacing:0.06em;color:#A32A1A;text-transform:uppercase;line-height:1;
          ">LEAD · CLIMATE · TÜRKIYE</span>
          <h2 style="
            margin:0;font-family:'Liberation Sans',sans-serif;
            font-size:21.5px;font-weight:900;line-height:1.06;
            letter-spacing:-0.02em;color:#0B1018;
          ">COP31 ENDS WITH<br/>NO CLIMATE PACT</h2>
          <p style="
            margin:0;font-family:'Liberation Sans',sans-serif;
            font-size:14.8px;font-weight:600;line-height:1.18;color:#1B2432;
          ">UN Antalya talks collapse over fossil fuels; nations urge reform</p>
        </div>
      </div>

      <!-- Crisp Top-Left Legend Tag over North Pacific -->
      <div style="
        position:absolute;left:12px;bottom:12px;
        background:rgba(17,28,45,0.92);color:#FAF6EE;
        padding:6px 11px;border-left:3.5px solid #E8C170;
        font-family:'Liberation Sans',sans-serif;font-size:14px;font-weight:800;letter-spacing:0.05em;
      ">GLOBAL DISPATCH · 5 CONTINENTS · 7 BEATS</div>
    </section>
  `;
}

function buildArchY(data) {
  const s = data.stories;
  return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<style>
  * { box-sizing: border-box; }
  html, body {
    margin: 0; padding: 0; width: 1024px; height: 1024px; overflow: hidden;
    background: #F5EFE2; -webkit-font-smoothing: antialiased; text-rendering: geometricPrecision;
  }
</style>
</head>
<body>
  <div style="
    width:1024px;height:1024px;
    padding:12px 16px 12px;
    display:flex;flex-direction:column;gap:9px;
    background:#F5EFE2;
  ">
    ${buildMasthead(data, 88, 50)}

    <!-- Top 3 Illustrated Dispatches [1, 2, 3] -->
    <section style="
      display:grid;
      grid-template-columns:1fr 1px 1fr 1px 1fr;
      column-gap:10px;
      height:274px;
    ">
      ${renderStoryBlock(s.nvidia, { artHeight: 132, kickerSize: 14, headlineSize: 21, subSize: 15.2, useLines: true, useShortSub: true, pinNum: 1 })}
      <div style="background:#C6B9A0;width:1px;height:100%;"></div>
      ${renderStoryBlock(s.uk_rohingya, { artHeight: 132, kickerSize: 14, headlineSize: 21, subSize: 15.2, useLines: true, useShortSub: true, pinNum: 2 })}
      <div style="background:#C6B9A0;width:1px;height:100%;"></div>
      ${renderStoryBlock(s.india_nepal, { artHeight: 132, kickerSize: 14, headlineSize: 21, subSize: 15.2, useLines: true, useShortSub: true, pinNum: 3 })}
    </section>

    <!-- Center Unified World Map + COP31 Hero -->
    ${buildWorldMapCenterpiece(data)}

    <!-- Bottom 3 Illustrated Dispatches [4, 5, 6] -->
    <section style="
      display:grid;
      grid-template-columns:1fr 1px 1fr 1px 1fr;
      column-gap:10px;
      height:274px;
    ">
      ${renderStoryBlock(s.fifa, { artHeight: 132, kickerSize: 14, headlineSize: 21, subSize: 15.2, useLines: true, useShortSub: true, pinNum: 4 })}
      <div style="background:#C6B9A0;width:1px;height:100%;"></div>
      ${renderStoryBlock(s.corvette, { artHeight: 132, kickerSize: 14, headlineSize: 21, subSize: 15.2, useLines: true, useShortSub: true, pinNum: 5 })}
      <div style="background:#C6B9A0;width:1px;height:100%;"></div>
      ${renderStoryBlock(s.drc, { artHeight: 132, kickerSize: 14, headlineSize: 21, subSize: 15.2, useLines: true, useShortSub: true, pinNum: 6 })}
    </section>
  </div>
</body>
</html>`;
}

// Architecture R3-Z: Max-Breadth 8-Story Museum Broadsheet (2-3-3 including NASA Space/Science)
function buildArchZ(data) {
  const s = data.stories;
  return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<style>
  * { box-sizing: border-box; }
  html, body {
    margin: 0; padding: 0; width: 1024px; height: 1024px; overflow: hidden;
    background: #F5EFE2; -webkit-font-smoothing: antialiased; text-rendering: geometricPrecision;
  }
</style>
</head>
<body>
  <div style="
    width:1024px;height:1024px;
    padding:12px 16px 12px;
    display:flex;flex-direction:column;
    background:#F5EFE2;
  ">
    ${buildMasthead(data, 90, 50)}

    <main style="display:flex;flex-direction:column;flex:1;margin-top:9px;border-bottom:3px solid #111C2D;padding-bottom:6px;">
      <!-- Row 1: Dual Hero Leads -->
      <section style="
        display:grid;
        grid-template-columns:1fr 1px 1fr;
        column-gap:12px;
        height:308px;
        padding-bottom:7px;
        border-bottom:1.5px solid #C6B9A0;
      ">
        ${renderStoryBlock(s.cop31, { artHeight: 186, kickerSize: 14.5, headlineSize: 28, subSize: 17, singleLineHeadline: true })}
        <div style="background:#C6B9A0;width:1px;height:100%;"></div>
        ${renderStoryBlock(s.nvidia, { artHeight: 186, kickerSize: 14.5, headlineSize: 27, subSize: 17, singleLineHeadline: true })}
      </section>

      <!-- Row 2: Three-Column Dispatch -->
      <section style="
        display:grid;
        grid-template-columns:1fr 1px 1fr 1px 1fr;
        column-gap:10px;
        height:290px;
        padding-top:8px;
        padding-bottom:7px;
        border-bottom:1.5px solid #C6B9A0;
      ">
        ${renderStoryBlock(s.corvette, { artHeight: 132, kickerSize: 14.2, headlineSize: 21, subSize: 16, useLines: true, useShortSub: true })}
        <div style="background:#C6B9A0;width:1px;height:100%;"></div>
        ${renderStoryBlock(s.india_nepal, { artHeight: 132, kickerSize: 14.2, headlineSize: 21, subSize: 16, useLines: true, useShortSub: true })}
        <div style="background:#C6B9A0;width:1px;height:100%;"></div>
        ${renderStoryBlock(s.drc, { artHeight: 132, kickerSize: 14.2, headlineSize: 21, subSize: 16, useLines: true, useShortSub: true })}
      </section>

      <!-- Row 3: Three-Column Dispatch (Law, Sports, Space) -->
      <section style="
        display:grid;
        grid-template-columns:1fr 1px 1fr 1px 1fr;
        column-gap:10px;
        flex:1;
        padding-top:8px;
      ">
        ${renderStoryBlock(s.uk_rohingya, { artHeight: 132, kickerSize: 14.2, headlineSize: 21, subSize: 16, useLines: true, useShortSub: true })}
        <div style="background:#C6B9A0;width:1px;height:100%;"></div>
        ${renderStoryBlock(s.fifa, { artHeight: 132, kickerSize: 14.2, headlineSize: 21, subSize: 16, useLines: true, useShortSub: true })}
        <div style="background:#C6B9A0;width:1px;height:100%;"></div>
        ${renderStoryBlock(s.nasa, { artHeight: 132, kickerSize: 14.2, headlineSize: 21, subSize: 16, useLines: true, useShortSub: true })}
      </section>
    </main>
  </div>
</body>
</html>`;
}

function renderArch(data, arch, outImagePath, thumbPath, quality = 90) {
  mkdirSync(OUT_DIR, { recursive: true });
  const htmlPath = join(OUT_DIR, `r3_${arch}.html`);
  const rawPngPath = join(OUT_DIR, `r3_${arch}_2x.png`);

  const html = arch === 'X' ? buildArchX(data) : arch === 'Y' ? buildArchY(data) : buildArchZ(data);
  writeFileSync(htmlPath, html, 'utf8');

  execFileSync(
    'chromium',
    [
      '--headless=new',
      '--no-sandbox',
      '--disable-gpu',
      '--disable-dev-shm-usage',
      '--hide-scrollbars',
      '--window-size=1024,1024',
      '--force-device-scale-factor=2',
      `--screenshot=${rawPngPath}`,
      `file://${htmlPath}`
    ],
    { stdio: 'pipe', timeout: 30000 }
  );

  execFileSync(
    'python3',
    [
      '-c',
      `
import os
from PIL import Image
im = Image.open("${rawPngPath}").convert("RGB")
im1024 = im.resize((1024, 1024), Image.Resampling.LANCZOS)
im1024.save("${outImagePath}", format="JPEG", quality=${quality}, subsampling=0, optimize=True)
im300 = im1024.resize((300, 300), Image.Resampling.LANCZOS)
im300.save("${thumbPath}", format="PNG", optimize=True)
print("Rendered R3-${arch}:", "${outImagePath}", im1024.size, os.path.getsize("${outImagePath}"), "bytes")
`
    ],
    { stdio: 'inherit' }
  );
}

const data = JSON.parse(readFileSync(STORIES_PATH, 'utf8'));
const cmd = process.argv[2] ?? 'compare';

if (cmd === 'compare') {
  renderArch(data, 'X', join(OUT_DIR, 'r3_X_asymmetric7.jpg'), join(OUT_DIR, 'r3_X_asymmetric7_300px.png'), 90);
  renderArch(data, 'Y', join(OUT_DIR, 'r3_Y_worldmap7.jpg'), join(OUT_DIR, 'r3_Y_worldmap7_300px.png'), 90);
  renderArch(data, 'Z', join(OUT_DIR, 'r3_Z_breadth8.jpg'), join(OUT_DIR, 'r3_Z_breadth8_300px.png'), 90);
} else if (cmd === 'ship-X' || cmd === 'ship-Y' || cmd === 'ship-Z') {
  const arch = cmd.split('-')[1];
  renderArch(data, arch, resolve(REPO_ROOT, 'entry.png'), join(OUT_DIR, 'r3_shipped_300px.png'), 90);
} else {
  throw new Error(`Unknown command: ${cmd}`);
}
