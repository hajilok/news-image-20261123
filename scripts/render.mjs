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
  const fallback = join(ART_DIR, 'ill_08_nasa_moon.jpg');
  const resolved = existsSync(fullPath) ? fullPath : fallback;
  const b64 = readFileSync(resolved).toString('base64');
  return `data:image/jpeg;base64,${b64}`;
}

function buildWorldMapSvg(stories) {
  const w = 252;
  const h = 84;
  // Equirectangular simplified landmass polygons scaled cleanly to 252x84
  const continents = [
    // North America
    'M 14,14 L 33,11 L 53,10 L 72,13 L 85,20 L 79,27 L 70,31 L 63,36 L 59,40 L 53,39 L 49,35 L 41,31 L 34,25 L 24,21 Z',
    // Greenland
    'M 90,5 L 109,5 L 112,11 L 102,16 L 92,13 Z',
    // South America
    'M 71,42 L 85,41 L 96,47 L 101,55 L 94,65 L 85,76 L 77,79 L 73,71 L 74,60 L 68,50 Z',
    // Europe
    'M 118,16 L 132,11 L 149,10 L 160,14 L 158,21 L 149,25 L 139,25 L 130,26 L 121,23 Z',
    // Africa
    'M 119,28 L 139,27 L 152,29 L 162,37 L 164,45 L 156,56 L 148,65 L 139,64 L 133,55 L 130,45 L 120,40 L 115,34 Z',
    // Madagascar
    'M 162,54 L 165,53 L 166,60 L 162,60 Z',
    // Asia
    'M 159,12 L 188,10 L 219,12 L 236,16 L 231,24 L 220,28 L 215,36 L 207,39 L 197,43 L 189,38 L 183,34 L 173,36 L 165,32 L 155,28 L 157,20 Z',
    // Japan / SE Asia Islands
    'M 225,25 L 229,27 L 227,31 L 223,29 Z',
    'M 206,45 L 219,45 L 223,48 L 211,49 Z',
    // Australia
    'M 207,55 L 225,53 L 235,59 L 233,68 L 220,70 L 209,65 Z',
    // New Zealand
    'M 241,69 L 245,67 L 244,73 L 240,73 Z'
  ];

  const leaders = stories
    .filter((s) => s.mapPin[0] !== s.mapTarget[0] || s.mapPin[1] !== s.mapTarget[1])
    .map(
      (s) => `
      <line x1="${s.mapPin[0]}" y1="${s.mapPin[1]}" x2="${s.mapTarget[0]}" y2="${s.mapTarget[1]}" stroke="#223044" stroke-width="1.15" opacity="0.7"/>
      <circle cx="${s.mapTarget[0]}" cy="${s.mapTarget[1]}" r="1.8" fill="#223044"/>
    `
    )
    .join('');

  const pins = stories
    .map((s) => {
      const [px, py] = s.mapPin;
      const isSpace = s.id === 'nasa';
      return `
        <g>
          ${isSpace ? `<circle cx="${px}" cy="${py}" r="10.2" fill="none" stroke="${s.accent}" stroke-width="1.1" stroke-dasharray="2.4 2" opacity="0.85"/>` : ''}
          <circle cx="${px}" cy="${py}" r="6.8" fill="${s.accent}" stroke="#FBF8F2" stroke-width="1.6"/>
          <text x="${px}" y="${py + 3.1}" text-anchor="middle" font-family="Liberation Sans, sans-serif" font-size="8.6" font-weight="800" fill="#FFFFFF">${s.num}</text>
        </g>
      `;
    })
    .join('\n');

  return `
    <svg viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg" style="display:block;border-radius:4px;">
      <rect x="0.5" y="0.5" width="${w - 1}" height="${h - 1}" rx="3.5" fill="#ECE4D4" stroke="#BCAE94" stroke-width="1.2"/>
      <line x1="0" y1="${h * 0.5}" x2="${w}" y2="${h * 0.5}" stroke="rgba(22,32,48,0.12)" stroke-width="0.8" stroke-dasharray="3 3"/>
      <line x1="${w * 0.5}" y1="0" x2="${w * 0.5}" y2="${h}" stroke="rgba(22,32,48,0.12)" stroke-width="0.8" stroke-dasharray="3 3"/>
      ${continents.map((d) => `<path d="${d}" fill="#C7B99F" stroke="#96876C" stroke-width="0.8" stroke-linejoin="round"/>`).join('')}
      ${leaders}
      ${pins}
    </svg>
  `;
}

function renderMainCard(story) {
  const imgSrc = imgDataUri(story.art);
  return `
    <article style="
      background:#FBF8F2;
      border:1px solid #CFC4B0;
      border-top:4px solid ${story.accent};
      border-radius:3px;
      overflow:hidden;
      display:flex;
      flex-direction:column;
      height:248px;
      box-shadow:0 1.5px 4px rgba(24,20,14,0.08);
    ">
      <div style="position:relative;width:100%;height:150px;overflow:hidden;background:#101824;">
        <img src="${imgSrc}" style="width:100%;height:100%;object-fit:cover;display:block;${story.artStyle}" />
        <div style="
          position:absolute;top:7px;left:7px;
          width:25px;height:25px;border-radius:50%;
          background:${story.accent};color:#FFFFFF;
          border:2px solid #FBF8F2;
          display:flex;align-items:center;justify-content:center;
          font-family:'Liberation Sans',sans-serif;font-size:13.5px;font-weight:900;
          box-shadow:0 1.5px 4px rgba(0,0,0,0.45);
        ">${story.num}</div>
        <div style="
          position:absolute;bottom:7px;right:7px;
          background:rgba(11,17,28,0.92);color:#FFFFFF;
          padding:3.5px 9px;border-radius:2px;
          font-family:'Liberation Sans',sans-serif;font-size:13px;
          font-weight:800;letter-spacing:0.04em;
          border:1px solid rgba(255,255,255,0.22);
          box-shadow:0 1px 4px rgba(0,0,0,0.35);
        ">${story.badge}</div>
      </div>
      <div style="padding:7px 12px 8px;display:flex;flex-direction:column;gap:3px;flex:1;justify-content:center;">
        <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;">
          <span style="
            font-family:'Liberation Sans',sans-serif;font-size:13px;font-weight:800;
            letter-spacing:0.065em;color:${story.accent};text-transform:uppercase;
          ">${story.region}</span>
          <span style="
            font-family:'Liberation Sans',sans-serif;font-size:11.5px;font-weight:800;
            letter-spacing:0.05em;color:#1D2736;background:#EAE2D2;
            padding:1.5px 7px;border-radius:2px;text-transform:uppercase;
          ">${story.beat}</span>
        </div>
        <h2 style="
          margin:0;
          font-family:'Liberation Sans',sans-serif;
          font-size:23px;
          font-weight:900;
          line-height:1.06;
          letter-spacing:-0.015em;
          color:#0E131B;
          white-space:nowrap;
        ">${story.headline}</h2>
        <p style="
          margin:0;
          font-family:'Liberation Sans',sans-serif;
          font-size:15.5px;
          font-weight:600;
          line-height:1.22;
          color:#222B38;
        ">${story.subline}</p>
      </div>
    </article>
  `;
}

function renderBriefCard(story) {
  const imgSrc = imgDataUri(story.art);
  return `
    <article style="
      background:#FBF8F2;
      border:1px solid #CFC4B0;
      border-top:3.5px solid ${story.accent};
      border-radius:3px;
      overflow:hidden;
      display:flex;
      flex-direction:row;
      height:116px;
      box-shadow:0 1.5px 4px rgba(24,20,14,0.08);
    ">
      <div style="position:relative;width:154px;height:100%;flex-shrink:0;overflow:hidden;background:#101824;">
        <img src="${imgSrc}" style="width:100%;height:100%;object-fit:cover;display:block;${story.artStyle}" />
        <div style="
          position:absolute;top:6px;left:6px;
          width:23px;height:23px;border-radius:50%;
          background:${story.accent};color:#FFFFFF;
          border:2px solid #FBF8F2;
          display:flex;align-items:center;justify-content:center;
          font-family:'Liberation Sans',sans-serif;font-size:12.5px;font-weight:900;
          box-shadow:0 1px 4px rgba(0,0,0,0.45);
        ">${story.num}</div>
      </div>
      <div style="padding:7px 11px 7px 12px;display:flex;flex-direction:column;gap:3px;flex:1;justify-content:center;">
        <div style="display:flex;align-items:center;justify-content:space-between;gap:6px;">
          <span style="
            font-family:'Liberation Sans',sans-serif;font-size:12.5px;font-weight:800;
            letter-spacing:0.06em;color:${story.accent};text-transform:uppercase;
          ">${story.region}</span>
          <span style="
            font-family:'Liberation Sans',sans-serif;font-size:11px;font-weight:800;
            letter-spacing:0.04em;color:#1D2736;background:#EAE2D2;
            padding:1.5px 6px;border-radius:2px;text-transform:uppercase;
          ">${story.beat}</span>
        </div>
        <h2 style="
          margin:0;
          font-family:'Liberation Sans',sans-serif;
          font-size:19.5px;
          font-weight:900;
          line-height:1.06;
          letter-spacing:-0.015em;
          color:#0E131B;
          white-space:nowrap;
        ">${story.headline}</h2>
        <p style="
          margin:0;
          font-family:'Liberation Sans',sans-serif;
          font-size:14.8px;
          font-weight:600;
          line-height:1.22;
          color:#222B38;
        ">${story.subline}</p>
      </div>
    </article>
  `;
}

function buildMasterHtml(data) {
  const mainStories = data.stories.filter((s) => s.tier === 'main');
  const briefStories = data.stories.filter((s) => s.tier === 'brief');
  const mapSvg = buildWorldMapSvg(data.stories);

  return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<style>
  * { box-sizing: border-box; }
  html, body {
    margin: 0;
    padding: 0;
    width: 1024px;
    height: 1024px;
    overflow: hidden;
    background: #F4EEE2;
    -webkit-font-smoothing: antialiased;
    text-rendering: geometricPrecision;
  }
</style>
</head>
<body>
  <div style="
    width:1024px;height:1024px;
    padding:12px 16px 12px;
    display:flex;flex-direction:column;gap:10px;
    background:#F4EEE2;
  ">
    <header style="
      display:flex;align-items:center;justify-content:space-between;
      border-top:4.5px solid #141A24;
      border-bottom:2.5px solid #141A24;
      padding:6px 0 7px;
      height:104px;
      gap:14px;
    ">
      <div style="display:flex;flex-direction:column;justify-content:center;gap:2.5px;flex:1;">
        <div style="display:flex;align-items:center;gap:10px;">
          <span style="
            font-family:'Liberation Sans',sans-serif;
            font-size:14px;font-weight:900;letter-spacing:0.12em;
            color:#B83A28;text-transform:uppercase;
          ">${data.edition}</span>
          <span style="height:1.5px;flex:1;background:rgba(20,26,36,0.22);"></span>
        </div>
        <h1 style="
          margin:0;
          font-family:'C059','P052','Liberation Serif',Georgia,serif;
          font-size:44px;
          font-weight:700;
          line-height:1.0;
          letter-spacing:-0.018em;
          color:#0E131B;
        ">${data.dateLabel}</h1>
        <div style="
          font-family:'Liberation Sans',sans-serif;
          font-size:13px;font-weight:700;letter-spacing:0.035em;
          color:#364152;
        ">${data.beatsLine}</div>
      </div>
      <div style="flex-shrink:0;">
        ${mapSvg}
      </div>
    </header>

    <main style="display:flex;flex-direction:column;gap:10px;flex:1;">
      <section style="display:grid;grid-template-columns:1fr 1fr;gap:10px 14px;">
        ${mainStories.map((s) => renderMainCard(s)).join('\n')}
      </section>
      <section style="display:grid;grid-template-columns:1fr 1fr;gap:14px;">
        ${briefStories.map((s) => renderBriefCard(s)).join('\n')}
      </section>
    </main>
  </div>
</body>
</html>`;
}

function renderFinal(outImagePath, thumbPath, quality = 91) {
  const data = JSON.parse(readFileSync(STORIES_PATH, 'utf8'));
  mkdirSync(OUT_DIR, { recursive: true });
  const htmlPath = join(OUT_DIR, 'master_v2.html');
  const rawPngPath = join(OUT_DIR, 'master_v2_2x.png');

  writeFileSync(htmlPath, buildMasterHtml(data), 'utf8');

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
print("Rendered:", "${outImagePath}", im1024.size, os.path.getsize("${outImagePath}"), "bytes")
`
    ],
    { stdio: 'inherit' }
  );
}

const mode = process.argv[2] ?? 'preview';
if (mode === 'ship') {
  renderFinal(resolve(REPO_ROOT, 'entry.png'), join(OUT_DIR, 'shipped_300px.png'), 88);
} else {
  renderFinal(join(OUT_DIR, 'candidate_V2_master.jpg'), join(OUT_DIR, 'candidate_V2_master_300px.png'), 88);
}
