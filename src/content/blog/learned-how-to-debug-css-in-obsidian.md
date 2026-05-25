---
title: "TIL: Learned about debugging in Obsidian and adding custom CSS"
description: "Today when I was checking out preview mode for one of my notes I noticed that emojis were taking complete line instead of staying in the ..."
date: "2021-06-03"
draft: false
tags:
  - "obsidian-import"
  - "til"
source_path: "legacy-vault/🖋️ Blog/TIL/Learned how to debug CSS in Obsidian.md"
source_url: ""
category: "blog"
---
Today when I was checking out preview mode for one of my notes I noticed that emojis were taking complete line instead of staying in the same line which annoyed me because it was looking really weird. After a bit of googling I figured out that it was because the emojis in Obsidian are rendered as `<image>` tags as it was currently taking `display: block`.

## Fix for the problem

```css
.emoji{
    display: inline-block
}
```
 
Adding the above snippet solves the problem as it makes the display `inline-block` which doesn't use separate line.
