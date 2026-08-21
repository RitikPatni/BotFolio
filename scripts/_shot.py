import sys, subprocess, time, os
from playwright.sync_api import sync_playwright

# Usage: python3 shot.py <url-path> <outfile> [mobile|desktop] [light|dark]
# Serves dist/ via a simple http server started by caller; we just navigate.

URL_PATH = sys.argv[1]
OUT = sys.argv[2]
MODE = sys.argv[3] if len(sys.argv) > 3 else "desktop"
THEME = sys.argv[4] if len(sys.argv) > 4 else "dark"
PERSONA = sys.argv[5] if len(sys.argv) > 5 else "studio"

BASE = "http://localhost:4327"

with sync_playwright() as p:
    browser = p.chromium.launch(
        executable_path="/root/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome",
        args=["--no-sandbox"],
    )
    if MODE == "mobile":
        ctx = browser.new_context(
            viewport={"width": 390, "height": 844},
            device_scale_factor=2,
            is_mobile=True,
        )
    else:
        ctx = browser.new_context(viewport={"width": 1280, "height": 900})
    page = ctx.new_page()
    # set theme via localStorage before load
    page.add_init_script(
        "try { localStorage.setItem('rp-theme', '%s'); localStorage.setItem('rp-persona', '%s'); } catch(e){}"
        % (THEME, PERSONA)
    )
    page.goto(BASE + URL_PATH, wait_until="networkidle")
    time.sleep(0.8)
    page.screenshot(path=OUT, full_page=False)
    browser.close()
    print("shot ->", OUT)
