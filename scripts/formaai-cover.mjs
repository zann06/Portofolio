// Render the FormaAI README (raw markdown) to a branded 1280x800 cover card.
// Usage: node scripts/formaai-cover.mjs [outfile]
const PW = "file:///C:/Users/User/AppData/Local/npm-cache/_npx/e41f203b7505f1fb/node_modules/playwright/index.mjs"
const { chromium } = await import(PW)

const out = process.argv[2] ?? "public/projects/p7-formaai.jpg"

const html = `<!doctype html>
<html><head><meta charset="utf-8"><style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{
    width:1280px;height:800px;overflow:hidden;
    font-family:"Segoe UI",system-ui,-apple-system,sans-serif;
    background:
      radial-gradient(1100px 600px at 85% -10%, #2a3f7a 0%, transparent 60%),
      radial-gradient(900px 500px at 0% 110%, #3b2a6b 0%, transparent 60%),
      #0b1120;
    color:#eef2ff;
    padding:64px 72px;
    display:flex;flex-direction:column;
  }
  .top{display:flex;align-items:center;gap:16px;margin-bottom:34px}
  .logo{
    width:56px;height:56px;border-radius:15px;
    background:linear-gradient(140deg,#6d8bff,#9b6dff);
    display:grid;place-items:center;font-size:30px;font-weight:800;color:#0b1120;
    box-shadow:0 14px 44px rgba(109,139,255,.45);
  }
  .name{font-size:42px;font-weight:800;letter-spacing:-.02em}
  .badges{display:flex;gap:8px;margin-top:8px;flex-wrap:wrap}
  .badge{
    font-size:13px;padding:3px 11px;border-radius:999px;
    border:1px solid rgba(160,180,255,.32);color:#a9bbff;background:rgba(109,139,255,.1);
  }
  h1{font-size:60px;line-height:1.06;letter-spacing:-.03em;font-weight:800;max-width:1080px}
  h1 span{background:linear-gradient(95deg,#7ee0c0,#6d8bff 45%,#b98cff);-webkit-background-clip:text;background-clip:text;color:transparent}
  p.lede{margin-top:20px;font-size:21px;line-height:1.55;color:#a9b4d0;max-width:900px}
  .cards{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-top:36px}
  .card{
    border-radius:16px;padding:18px 20px;
    background:rgba(255,255,255,.045);
    border:1px solid rgba(160,180,255,.18);
  }
  .card b{display:block;font-size:15px;color:#dfe6ff;margin-bottom:6px;font-weight:650}
  .card small{font-size:13.5px;line-height:1.5;color:#93a0bf}
  .mono{font-family:ui-monospace,"Cascadia Code",Consolas,monospace;font-size:13px;color:#7ee0c0}
  .foot{margin-top:auto;display:flex;justify-content:space-between;font-size:13px;color:#6c7a9c;font-family:ui-monospace,monospace}
</style></head><body>
  <div class="top">
    <div class="logo">F</div>
    <div>
      <div class="name">FormaAI</div>
      <div class="badges">
        <span class="badge">AGPL-3.0</span>
        <span class="badge">TypeScript</span>
        <span class="badge">Fastify + React 19</span>
        <span class="badge">Self-hosted</span>
        <span class="badge">456 tests passing</span>
      </div>
    </div>
  </div>
  <h1>Template-driven reports that <span>refuse to invent facts</span>.</h1>
  <p class="lede">Upload a DOCX template and your sources — get an editable report that keeps your exact formatting. Gaps become visible <span class="mono">[MISSING: …]</span> markers, never fabricated numbers.</p>
  <div class="cards">
    <div class="card"><b>Byte-preserving DOCX</b><small>Only the document body is rewritten; every other part of the template stays identical.</small></div>
    <div class="card"><b>Evidence, not vibes</b><small>BM25 retrieval maps sources to sections. No evidence, no sentence.</small></div>
    <div class="card"><b>Your key, your data</b><small>Bring-your-own-key, AES-256-GCM vault, strict per-user isolation.</small></div>
  </div>
  <div class="foot"><span>github.com/zann06/FormaAI</span><span>monorepo · api · web · docx-engine · ai-providers</span></div>
</body></html>`

const browser = await chromium.launch({
  executablePath:
    "C:/Users/User/AppData/Local/ms-playwright/chromium-1254/chrome-win64/chrome.exe",
})
const page = await browser.newPage({
  viewport: { width: 1280, height: 800 },
  deviceScaleFactor: 2,
})
await page.setContent(html, { waitUntil: "load" })
await page.waitForTimeout(600)
await page.screenshot({ path: out, type: "jpeg", quality: 90 })
console.log(JSON.stringify({ out }))
await browser.close()
