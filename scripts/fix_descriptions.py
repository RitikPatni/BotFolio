#!/usr/bin/env python3
"""Rewrite the `description` frontmatter of newsletter entries that contain
raw Markdown. New description = clean list of link titles from the body's
content sections (To Read / To Explore / etc.), dropping greetings and the
'Something that made me smile' section. Idempotent: skips entries whose
description already has no Markdown syntax.

Usage: python3 scripts/fix_descriptions.py   (prints before/after, writes files)
       python3 scripts/fix_descriptions.py --dry  (print only, no writes)
"""
import re, glob, sys, os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
NEWSLETTER_DIR = os.path.join(ROOT, "src", "content", "newsletter")

MD_RE = re.compile(r'#{1,6}\s|\[[^\]]+\]\(|https?://|[📚😃✨⭐🔥💡🚀✅❌⚠️📝📖🔗👀]')
LINK_RE = re.compile(r'\[([^\]]+)\]\((https?://[^)]+)\)')
HEADING_RE = re.compile(r'^##\s+(.*)$', re.M)
FRONT_RE = re.compile(r'^(---\n.*?\n---\n)', re.S)
DESC_RE = re.compile(r'^description:\s*(.*)$', re.M)


def has_md(desc: str) -> bool:
    return bool(MD_RE.search(desc))


def clean_title(t: str) -> str:
    t = t.strip().replace("\n", " ")
    # drop leftover emoji markers / heading words that may have crept in
    t = re.sub(r'[📚😃✨⭐🔥💡🚀✅❌⚠️📝📖🔗👀]', '', t)
    t = re.sub(r'^(To Read|To Watch|Notes?|Links?|Resources?)\s*[:\-]?\s*', '', t, flags=re.I)
    return re.sub(r'\s+', ' ', t).strip()


def build_summary(body: str) -> str:
    # Take everything before the 'Something that made me smile' section,
    # then collect link titles from the whole remaining body (links appear
    # both under '##' sections and at top level in some entries).
    smile_split = re.split(r'^##\s+.*(?:smile|😃).*$', body, flags=re.M | re.I)
    content = smile_split[0] if smile_split else body

    titles: list[str] = []
    seen = set()
    for m in LINK_RE.finditer(content):
        title = clean_title(m.group(1))
        if not title:
            continue
        key = title.lower()
        if key in seen:
            continue
        seen.add(key)
        titles.append(title)
        if len(titles) >= 6:
            break

    if not titles:
        # Fallback: first clean sentence of the body (single-line, no newlines)
        flat = re.sub(r'\s+', ' ', content.replace("\n", " ")).strip()
        sent = re.split(r'(?<=[.!?])\s+', flat)
        return sent[0][:200] if sent else ""

    summary = ", ".join(titles[:6])
    if len(titles) > 6:
        summary += ", …"

    # Trim at a word boundary so we never leave a dangling partial title.
    if len(summary) > 200:
        cut = summary.rfind(", ", 0, 200)
        if cut <= 0:
            cut = summary.rfind(" ", 0, 200)
        summary = summary[: cut if cut > 0 else 200].rstrip(", ")
    return summary


def rewrite_file(path: str, dry: bool, force: bool = False) -> tuple[str, str, str] | None:
    text = open(path, encoding='utf-8').read()
    fm = FRONT_RE.match(text)
    if not fm:
        return None
    front = fm.group(1)
    dm = DESC_RE.search(front)
    if not dm:
        return None
    old = dm.group(1).strip().strip('"')
    if not has_md(old) and not force:
        return None  # not affected; leave untouched

    body = text[fm.end():]
    new = build_summary(body)
    if not new:
        new = old  # safety: never blank it out
    # YAML-safe: wrap in double quotes, escape embedded quotes/backslashes
    new_yaml = '"' + new.replace('\\', '\\\\').replace('"', '\\"') + '"'
    new_front = DESC_RE.sub(f'description: {new_yaml}', front, count=1)
    new_text = new_front + text[fm.end():]
    if not dry:
        open(path, 'w', encoding='utf-8').write(new_text)
    return (os.path.basename(path), old, new)


def main():
    dry = '--dry' in sys.argv
    force = '--force' in sys.argv
    files = sorted(glob.glob(os.path.join(NEWSLETTER_DIR, '*.md')))
    changed = 0
    for f in files:
        res = rewrite_file(f, dry, force)
        if not res:
            continue
        changed += 1
        name, old, new = res
        print(f"### {name}")
        print(f"  OLD: {old[:120]}")
        print(f"  NEW: {new}")
        print()
    print(f"{'DRY RUN — ' if dry else ''}Rewrote {changed} of {len(files)} newsletter descriptions.")


if __name__ == '__main__':
    main()
