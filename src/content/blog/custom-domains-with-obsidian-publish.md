---
title: "Custom Domains with Obsidian Publish"
description: "In order to set a custom domain you need to create a `netlify.toml` file in your root directory and add the following"
date: "2021-09-21"
draft: false
tags:
  - "obsidian-import"
category: "blog"
---
## Custom Domains with Obsidian Publish and Netlify


In order to set a custom domain you need to create a `netlify.toml` file in your root directory and add the following

```
[[redirects]]
  from = "https://mysite.com/my-notes/*"
  to = "https://publish.obsidian.md/serve?url=mysite.com/my-notes/:splat"
  status = 200
  force = true
```

> Note: Make sure to change `https://publish.obsidian.md/serve` to your own Obsidian publish domain. Ex: [https://publish.obsidian.md/ritik](https://publish.obsidian.md/serve).
