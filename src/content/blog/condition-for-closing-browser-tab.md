---
title: "Condition for closing browser tab"
description: "The below excerpt is from official [w3 spec reference](https://www.w3.org/TR/html51/browsers.html#script-closable)"
date: 2021-07-08
draft: false
tags:
  - obsidian-import
  - blog
source_path: "legacy-vault/🖋️ Blog/TIL/Condition for closing browser tab.md"
---

The below excerpt is from official [w3 spec reference](https://www.w3.org/TR/html51/browsers.html#script-closable)
> A [browsing context](https://www.w3.org/TR/html51/browsers.html#browsing-context) is script-closable if it is an [auxiliary browsing context](https://www.w3.org/TR/html51/browsers.html#auxiliary-browsing-contexts) that was created by a script (as opposed to by an action of the user), or if it is a [top-level browsing context](https://www.w3.org/TR/html51/browsers.html#top-level-browsing-context) whose [session history](https://www.w3.org/TR/html51/browsers.html#session-history) contains only one `[Document](https://html.spec.whatwg.org/multipage/dom.html#document)`.

> The `closed` attribute on `Window` objects must return true if the `Window` object’s [browsing context](https://www.w3.org/TR/html51/browsers.html#browsing-context) has been [discarded](https://www.w3.org/TR/html51/browsers.html#a-browsing-context-is-discarded), and false otherwise.

## When does it work then
If the above excerpt was not clear then it works in following conditions
- When user has opened a new tab using `window.open` method
- When it's the top level page on browser meaning it is a **new tab** or a link was opened in a new tab.

---
**Learned on** : [08-Jul-2021](🧔%20Private/Planners/Day%20Planners/08-Jul-2021.md)
**Source** : [w3 Org#script-closable](https://www.w3.org/TR/html51/browsers.html#script-closable)
