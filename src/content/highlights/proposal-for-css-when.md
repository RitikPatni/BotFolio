---
title: "Proposal for CSS @when"
description: "Author: Chris Coyier"
date: "2021-01-01"
draft: false
tags:
  - "highlights"
  - "obsidian-import"
source_path: "legacy-vault/📝 Readwise/Articles/Proposal for CSS @when.md"
source_url: ""
category: "readwise-articles"
---
# Proposal for CSS @when

![rw-book-cover](https://readwise-assets.s3.amazonaws.com/static/images/article2.74d541386bbf.png)

## Metadata
- Author: Chris Coyier
- Full Title: Proposal for CSS @when
- Category: #type/articles
- URL: https://css-tricks.com/proposal-for-css-when/

## Highlights
- CSS is on a tear lately. Again, I’ve heard of a brand new thing I’ve never seen before, and again it’s via Miriam: CSS Conditionals.
  🎉 CSSWG just resolved to adopt @tabatkins when/else proposal into the next level of CSS Conditionals. Here's the proposal:https://t.co/IXEOK7xKcL
  — Miriam (But Terrible) (@TerribleMia) September 15, 2021
  There is already such a thing as logic in media queries. In fact, a media query is already logic.
  @media (min-width: 600px) {
  /* WHEN this media query is true, do these styles. */
  }
  And if you want to have styles that are mutually exclusive to the above, you’d write two media queries:
  @media (min-width: 600px) {
  /* ... */ 
  }
  @media (max-width: 599px) {
  /* ... */
  }
  That’s a little… fidgety. The syntax is much cleaner in this new proposal:
  @when media(min-width: 600px) {
  /* ... */ 
  }
  @else {
  /* ... */ 
  }
  Looks like you can do multiple conditions via and, have a waterfall logic stack with multiple @else statements, and not just use @media, but @supports as well.
  @when media(width >= 400px) and media(pointer: fine) and supports(display: flex) {
  /* A */
  } @else supports(caret-color: pink) and supports(background: double-rainbow()) {
  /* B */
  } @else {
  /* C */
  }
  Looks very logical and handy to me!
  I saw one little squabble about the naming. @if could be a logical name here too. But Sass uses @if and it would be super annoying to a ton of developers if they had to refactor all their Sass logic to something new or however that would fall out. Should CSS cede to any preprocessor out there? Nah, but Sass has been around a long time and is super popular, and there is a perfectly good alternative, so why cause the pain? In that thread, it’s not just about Sass either — some folks think @when is a better name anyway.
