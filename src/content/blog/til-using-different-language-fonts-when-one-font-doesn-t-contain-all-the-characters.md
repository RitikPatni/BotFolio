---
title: "TIL Using different language fonts when one font doesn't contain all the characters"
description: "You can use different font files for different languages in the following way"
date: 2021-09-20
draft: false
tags:
  - obsidian-import
source_path: "legacy-vault/🧔 private/Uncategorized Notes/TIL Using different language fonts when one font doesn't contain all the characters.md"
---

You can use different font files for different languages in the following way

## Importing multilanguage fonts

```css
@font-face {
font-family: "Myriad Pro";
src: url("./assets/fonts/MyriadPro-Regular.otf") format("opentype");\
font-display: swap;\
}

@font-face {
font-family: "Myriad Pro";
font-weight: bold;
src: url("./assets/fonts/MyriadPro-Bold.otf") format("opentype");
font-display: swap;
}

@font-face {
font-family: "Myriad Pro";
font-weight: 600;
src: url("./assets/fonts/MyriadPro-SemiBold.otf") format("opentype");
font-display: swap;
}

@font-face {
font-family: "Mangal";
src: url("./assets/fonts/Mangal\ Regular.ttf") format("truetype");
font-display: swap;
}
```

## Font Declarations

```css
font-family: Myriad Pro, Mangal, sans-serif;
```

## TODO: Add Codepen Demo
