---
title: "Multiple Backgrounds with CSS background"
description: "Using multiple images and gradients in a single CSS background declaration."
date: 2021-06-30
draft: false
tags:
  - css
  - til
---

Today I discovered a clever trick with CSS background images. It's possible to have multiple images in a single `background-image` declaration, which is unique and can come in handy for many use cases.

## How to do it

```html
<section>
<section />
```

```css
section {
  background-image: url("https://source.unsplash.com/random/150x150"),
    url("https://source.unsplash.com/random/150x200"),
    url("https://source.unsplash.com/random/150x250"),
    linear-gradient(
      90deg,
      rgba(52, 130, 253, 1) 43%,
      rgba(255, 255, 255, 1) 80%
    );
  background-position: top left, bottom right, center;
  background-repeat: no-repeat;
  height: 300px;
  width: 100%;
}
```

You can also play with this on CodePen:

- https://codepen.io/ritikpatni/pen/eYWNxqr
