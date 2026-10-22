"""Ledger landing — contrast battery on the built identity/ledger branch.

Per page (home / blog post / photography / library) x width (1440 / 390) x
mode (light / dark): walks every visible text node, composites its colour over
the background it actually sits on (ancestor chain, alpha + opacity aware) and
reports WCAG ratios split by category:

  body      every text node whose colour is --text (excluding headings)
  prose     primary reading copy: <p>/<li> inside main (target >= 6:1)
  muted     nodes coloured --text-muted (floor 4.5)
  dim       nodes coloured --text-dim (reported; floor 4.5 for small text)
  headings  text inside h1-h6
  all       every node (floor 4.5 small / 3 large)

Theme-toggle flip: for home + blog post at both widths, both directions:
  1. real-speed pass: samples ALL in-viewport text nodes on every animation frame
     for 700 ms, records the min ratio per frame and how long any node stays
     below 4.5 (and below 3).
  2. slow-motion pass: CDP Animation.setPlaybackRate(0.1) stretches CSS
     transitions 10x so intermediate frames can be screenshotted.

Run: /root/.hermes/hermes-agent/venv/bin/python3 -I design/ledger-land/battery.py \
       http://127.0.0.1:4195 design/ledger-land
"""
import json
import os
import sys

from playwright.sync_api import sync_playwright

BASE, OUT = sys.argv[1], sys.argv[2]
SHOTS = os.path.join(OUT, "shots")
os.makedirs(SHOTS, exist_ok=True)

ROUTES = {
    "home": "/",
    "blog-post": "/blog/building-quality-gated-ai-code-review-loops",
    "photography": "/photography",
    "library": "/library",
}
WIDTHS = ((1440, 900), (390, 844))

LIB = r"""
const parse = (s) => { const m = (s || '').match(/rgba?\(([^)]+)\)/); if (!m) return null;
  const p = m[1].split(/[ ,/]+/).filter(Boolean).map(Number); return [p[0], p[1], p[2], p.length > 3 ? p[3] : 1]; };
const over = (f, b) => { const a = f[3]; return [f[0]*a + b[0]*(1-a), f[1]*a + b[1]*(1-a), f[2]*a + b[2]*(1-a), 1]; };
const lin = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
const L = (c) => 0.2126*lin(c[0]) + 0.7152*lin(c[1]) + 0.0722*lin(c[2]);
const ratio = (a, b) => { const x = L(a), y = L(b); return Math.round(((Math.max(x,y)+0.05)/(Math.min(x,y)+0.05))*100)/100; };
const hex = (c) => '#' + c.slice(0,3).map(v => Math.round(v).toString(16).padStart(2,'0')).join('');
const bgOf = (el) => { const stack = []; let n = el, img = false;
  while (n && n.nodeType === 1) { const s = getComputedStyle(n);
    if (s.backgroundImage && s.backgroundImage !== 'none' && !/gradient/.test(s.backgroundImage)) img = true;
    const c = parse(s.backgroundColor); if (c && c[3] > 0) { stack.push(c); if (c[3] >= 1) break; }
    n = n.parentElement; }
  let base = [255,255,255,1]; for (let i = stack.length - 1; i >= 0; i--) base = over(stack[i], base);
  return { bg: base, img }; };
const opacityOf = (el) => { let o = 1, n = el; while (n && n.nodeType === 1) { o *= parseFloat(getComputedStyle(n).opacity); n = n.parentElement; } return o; };
const textEls = (viewportOnly) => { const out = new Set();
  const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let t; (t = w.nextNode());) { if (!t.textContent.trim()) continue; const el = t.parentElement; if (!el || out.has(el)) continue;
    if (el.closest('dialog:not([open]), [hidden], [aria-hidden="true"], script, style, noscript, svg, pre')) continue;
    const r = el.getBoundingClientRect(); if (r.width <= 1 || r.height <= 1) continue;
    if (viewportOnly && (r.bottom < 0 || r.top > innerHeight)) continue;
    const s = getComputedStyle(el); if (s.visibility === 'hidden' || s.display === 'none') continue;
    if (opacityOf(el) < 0.05) continue; out.add(el); }
  return [...out]; };
const measure = (el) => { const s = getComputedStyle(el); const { bg, img } = bgOf(el); let fg = parse(s.color); if (!fg) return null;
  fg = [fg[0], fg[1], fg[2], fg[3] * opacityOf(el)]; const eff = over(fg, bg);
  const px = parseFloat(s.fontSize), w = parseInt(s.fontWeight, 10);
  return { s, fg: eff, bg, img, px, large: px >= 24 || (px >= 18.66 && w >= 700), r: ratio(eff, bg) }; };
"""

WALK = "() => {" + LIB + r"""
  const root = getComputedStyle(document.documentElement); const tok = n => root.getPropertyValue(n).trim();
  const roles = {}; for (const n of ['--text','--text-muted','--text-dim','--accent-text']) {
    const d = document.createElement('i'); d.style.color = tok(n); document.body.appendChild(d); roles[getComputedStyle(d).color] = n; d.remove(); }
  const rows = [];
  for (const el of textEls(false)) { const m = measure(el); if (!m || m.img) continue;
    const heading = !!el.closest('h1,h2,h3,h4,h5,h6');
    const prose = !heading && !!el.closest('main p, main li') && !el.closest('nav, [class*="meta"], [class*="date"], [class*="kicker"], time');
    rows.push({ tag: el.tagName.toLowerCase(), cls: (el.className || '').toString().slice(0, 48), text: el.textContent.trim().slice(0, 40),
      role: roles[m.s.color] || null, heading, prose, fg: hex(m.fg), bg: hex(m.bg), ratio: m.r, px: Math.round(m.px*10)/10, large: m.large,
      floor: m.large ? 3 : 4.5 }); }
  const first = ff => (ff || '').split(',')[0].trim().replace(/["']/g, '');
  const pick = sel => { const el = document.querySelector(sel); return el ? first(getComputedStyle(el).fontFamily) : null; };
  return { rows, theme: document.documentElement.dataset.theme,
    tokens: Object.fromEntries(['--bg','--bg-soft','--text','--text-muted','--text-dim','--accent-text','--font-display','--font-body','--font-mono','--font-ui'].map(n => [n, tok(n)])),
    fonts: { h1: pick('main h1'), h3: pick('main h3'), body: first(getComputedStyle(document.body).fontFamily), mono: pick('main time, [class*="date"], [class*="meta"]'),
             loaded: [...new Set([...document.fonts].filter(f => f.status === 'loaded').map(f => f.family.replace(/["']/g, '')))].sort() },
    overflowX: document.documentElement.scrollWidth > innerWidth };
}"""

FLIP = "async () => {" + LIB + r"""
  const els = textEls(true);
  const sample = () => { let min = 99, who = null, below45 = 0, below3 = 0;
    for (const el of els) { const m = measure(el); if (!m || m.img) continue;
      if (m.r < min) { min = m.r; who = el.tagName.toLowerCase() + '.' + (el.className || '').toString().split(' ')[0] + ' "' + el.textContent.trim().slice(0, 24) + '"'; }
      if (m.r < 4.5) below45++; if (m.r < 3) below3++; }
    return { min, who, below45, below3 }; };
  const frames = [{ t: -1, ...sample() }]; const t0 = performance.now();
  document.getElementById('themeToggle').click();
  frames.push({ t: 0, ...sample() });
  await new Promise(res => { const tick = () => { frames.push({ t: Math.round(performance.now() - t0), ...sample() });
    if (performance.now() - t0 < 700) requestAnimationFrame(tick); else res(); }; requestAnimationFrame(tick); });
  // longest contiguous span (ms) during which any node sat below 4.5 / below 3
  const span = (key) => { let best = 0, start = null; for (const f of frames.slice(1)) {
    if (f[key] > 0) { if (start === null) start = f.t; best = Math.max(best, f.t - start); } else start = null; } return best; };
  let worst = frames[1]; for (const f of frames.slice(1)) if (f.min < worst.min) worst = f;
  const last = frames[frames.length - 1];
  return { theme: document.documentElement.dataset.theme, nodes: els.length, frames: frames.length, worst,
           ms_any_below_4_5: span('below45'), ms_any_below_3: span('below3'), settled: last,
           all: frames.map(f => ({ t: f.t, min: f.min, below45: f.below45, below3: f.below3 })) };
}"""


def settle(page):
    page.wait_for_load_state("networkidle")
    page.evaluate("async () => { await document.fonts.ready; }")
    page.evaluate("""async () => { const h = document.documentElement.scrollHeight;
        for (let y = 0; y < h; y += innerHeight * 0.8) { scrollTo(0, y); await new Promise(r => setTimeout(r, 60)); }
        scrollTo(0, 0); await new Promise(r => setTimeout(r, 250)); }""")
    page.wait_for_timeout(400)


def mn(rows):
    return min((r["ratio"] for r in rows), default=None)


def ctx_for(br, w, h, theme, reduce=True):
    ctx = br.new_context(viewport={"width": w, "height": h}, color_scheme=theme,
                         reduced_motion="reduce" if reduce else "no-preference")
    ctx.add_init_script(f"try{{localStorage.setItem('rp-theme','{theme}')}}catch(e){{}}")
    return ctx


report = {"round": "ledger-land", "base": BASE,
          "floors": {"body": 4.5, "prose_target": 6.0, "muted": 4.5, "large_text": 3.0},
          "pages": {}, "flip": {}, "summary": {}}
with sync_playwright() as p:
    br = p.chromium.launch()
    for theme in ("light", "dark"):
        for w, h in WIDTHS:
            ctx = ctx_for(br, w, h, theme)
            page = ctx.new_page()
            for name, path in ROUTES.items():
                page.goto(BASE + path)
                settle(page)
                shot = os.path.join(SHOTS, f"{name}-{w}-{theme}.png")
                page.screenshot(path=shot, full_page=True)
                page.screenshot(path=shot.replace(".png", "-fold.png"))
                d = page.evaluate(WALK)
                rows = d["rows"]
                body = [r for r in rows if r["role"] == "--text" and not r["heading"]]
                prose = [r for r in rows if r["prose"]]
                muted = [r for r in rows if r["role"] == "--text-muted" and not r["heading"]]
                dim = [r for r in rows if r["role"] == "--text-dim" and not r["heading"]]
                heads = [r for r in rows if r["heading"]]
                fails = [r for r in rows if r["ratio"] < r["floor"]]
                key = f"{name}-{w}-{theme}"
                rec = {
                    "shot": os.path.relpath(shot, OUT), "theme_attr": d["theme"], "tokens": d["tokens"], "fonts": d["fonts"],
                    "overflowX": d["overflowX"], "text_nodes": len(rows),
                    "min": {"body": mn(body), "prose": mn(prose), "muted": mn(muted), "dim": mn(dim), "headings": mn(heads), "all": mn(rows)},
                    "counts": {"body": len(body), "prose": len(prose), "muted": len(muted), "dim": len(dim), "headings": len(heads)},
                    "prose_below_6": [r for r in prose if r["ratio"] < 6][:10],
                    "fail_count": len(fails), "fails_floor": fails[:25],
                }
                rec["pass"] = {
                    "body_ge_4_5": rec["min"]["body"] is None or rec["min"]["body"] >= 4.5,
                    "prose_ge_6": rec["min"]["prose"] is None or rec["min"]["prose"] >= 6,
                    "muted_ge_4_5": rec["min"]["muted"] is None or rec["min"]["muted"] >= 4.5,
                    "no_floor_fails": not fails,
                }
                report["pages"][key] = rec
                print(f"{key}: {rec['min']} fails={len(fails)} theme={d['theme']} ox={d['overflowX']}")
            ctx.close()

    # Flip: real-speed frame sampling + slow-motion screenshots. Motion allowed here.
    for start in ("light", "dark"):
        end = "dark" if start == "light" else "light"
        for w, h in WIDTHS:
            ctx = ctx_for(br, w, h, start, reduce=False)
            page = ctx.new_page()
            cdp = ctx.new_cdp_session(page)
            cdp.send("Animation.enable")
            for name in ("home", "blog-post"):
                page.goto(BASE + ROUTES[name])
                page.wait_for_load_state("networkidle")
                page.evaluate("async () => { await document.fonts.ready; }")
                page.wait_for_timeout(300)
                cdp.send("Animation.setPlaybackRate", {"playbackRate": 1})
                f = page.evaluate(FLIP)
                key = f"{name}-{w}-{start}->{f['theme']}"
                # slow-motion pass: flip back to start, then flip again at 0.1x and shoot frames
                page.evaluate("document.getElementById('themeToggle').click()")
                page.wait_for_timeout(800)
                cdp.send("Animation.setPlaybackRate", {"playbackRate": 0.1})
                page.evaluate("document.getElementById('themeToggle').click()")
                shots = []
                for i, real_ms in enumerate((0, 300, 1000, 2000)):
                    if i:
                        page.wait_for_timeout(real_ms - (0, 300, 1000, 2000)[i - 1])
                    sp = os.path.join(SHOTS, f"flip-{name}-{w}-{start}-to-{end}-t{real_ms // 10:03d}ms.png")
                    page.screenshot(path=sp)
                    shots.append(os.path.relpath(sp, OUT))
                cdp.send("Animation.setPlaybackRate", {"playbackRate": 1})
                report["flip"][key] = {k: f[k] for k in ("theme", "nodes", "frames", "worst", "ms_any_below_4_5", "ms_any_below_3", "settled")}
                report["flip"][key]["frames_detail"] = f["all"]
                report["flip"][key]["slowmo_shots"] = shots
                print(f"flip {key}: nodes={f['nodes']} frames={f['frames']} worst={f['worst']['min']} @t={f['worst']['t']} "
                      f"({f['worst']['who']}) below4.5 span={f['ms_any_below_4_5']}ms below3 span={f['ms_any_below_3']}ms")
            ctx.close()
    br.close()

pages = report["pages"].values()
flips = report["flip"].values()


def lo(k):
    return min(p["min"][k] for p in pages if p["min"][k] is not None)


report["summary"] = {
    "captures": len(report["pages"]),
    "total_text_nodes": sum(p["text_nodes"] for p in pages),
    "total_floor_fails": sum(p["fail_count"] for p in pages),
    "min_body": lo("body"), "min_prose": lo("prose"), "min_muted": lo("muted"), "min_dim": lo("dim"),
    "min_headings": lo("headings"), "min_any": lo("all"),
    "all_body_ge_4_5": all(p["pass"]["body_ge_4_5"] for p in pages),
    "all_prose_ge_6": all(p["pass"]["prose_ge_6"] for p in pages),
    "all_muted_ge_4_5": all(p["pass"]["muted_ge_4_5"] for p in pages),
    "overflowX_any": any(p["overflowX"] for p in pages),
    "flip_worst_frame_min": min(f["worst"]["min"] for f in flips),
    "flip_settled_min": min(f["settled"]["min"] for f in flips),
    "flip_max_ms_any_below_4_5": max(f["ms_any_below_4_5"] for f in flips),
    "flip_max_ms_any_below_3": max(f["ms_any_below_3"] for f in flips),
}
json.dump(report, open(os.path.join(OUT, "battery.json"), "w"), indent=1)
print(json.dumps(report["summary"], indent=1))
