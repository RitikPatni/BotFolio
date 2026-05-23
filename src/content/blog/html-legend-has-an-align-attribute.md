---
title: "TIL: HTML legend has an align attribute"
description: "Had a unique use case today where I needed a title in the middle of border and while I was aware that something like `<fieldset><legend><..."
date: 2021-06-23
draft: false
tags:
  - obsidian-import
  - blog
source_path: "legacy-vault/🖋️ Blog/TIL/HTML legend has an align attribute.md"
---

Had a unique use case today where I needed a title in the middle of border and while I was aware that something like `<fieldset><legend></legend></fieldset>` exists but then I needed that title and wasn't sure the best approach to do it. After some browsing I came across `align` attribute for `<legend>` tag which can help you center the text and I learned how to center the `<legend>` tag.

## How to do it

```html
<fieldset>
	<legend align='center'>Title</legend>
	<p>Add Content here</p>
</fieldset>
```
