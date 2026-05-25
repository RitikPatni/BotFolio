---
title: "CSS read-only attribute"
description: "Why `:read-only` helped when disabled fields were not an option in a form flow."
date: "2021-06-05"
draft: false
tags:
  - "css"
  - "html"
  - "til"
source_path: "legacy-vault/🖋️ Blog/TIL/CSS read-only attribute.md"
source_url: ""
category: "blog"
---
While working on a no-framework HTML page (FTL page), I realized I couldn't use the disabled HTML attribute because disabled fields don't pass value through form submission.

After looking for options, I discovered HTML `readonly`. But I had already styled disabled states and had never looked into styling read-only fields.

My first thought was selectors like `.class-name[readonly]`. That works, but I had to handle both forms used in HTML:

- `.class[readonly]`
- `.class[readonly="readonly"]`

I wanted a cleaner approach similar to `:disabled`, then came across `:read-only`.

Another useful selector is `:read-write`, which can help when styling editable content such as a `<p>` tag with `contenteditable`.
