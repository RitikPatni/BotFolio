---
title: "Simple Yet Significant T..."
description: "Author: @csswizardry on Twitter"
date: "2021-01-01"
draft: false
tags:
  - "highlights"
  - "obsidian-import"
source_url: ""
category: "readwise-tweets"
---
![rw-book-cover](https://pbs.twimg.com/profile_images/1265585417849634816/OqwdR83A.jpg)

## Highlights

- Simple yet significant thing all developers should keep in mind: CSS resources (fonts, background images) are not requested by your CSS, but by the DOM node that needs them [Note: slight oversimplification, but the correct way to think about it.] ([View Tweet](https://twitter.com/csswizardry/status/1436361516534620168))

- It’s not until the browser finds e.g. an H1 that needs Open Sans that it will dispatch the request. Ergo, it’s often the speed of the DOM that determines CSS-resource discovery, and not the speed of the CSS itself. ([View Tweet](https://twitter.com/csswizardry/status/1436361519885955077))

- While there is no catch-all fix for this, it does help to explain why you might see waterfalls like this: It looks like the font was requested by the JS, right? But actually, the JS was blocking the discovery/construction of the DOM node that needed the font.
  ![](https://pbs.twimg.com/media/E-752xkX0AYAoUL.png) ([View Tweet](https://twitter.com/csswizardry/status/1436361535882940417))

- I’m not really sure what you’re meant to do with that information, but, err… have a nice weekend! ([View Tweet](https://twitter.com/csswizardry/status/1436361543818547201))

- People asking about or suggesting ‘fixes’. There is no fix because this isn’t a problem—it’s clever design, but design developers are seldom aware of. ([View Tweet](https://twitter.com/csswizardry/status/1436723943864512519))
