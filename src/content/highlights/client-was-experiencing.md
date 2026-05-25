---
title: "Client Was Experiencing..."
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

- Client was experiencing a FOUC with a third party that looked a little like this. Seems like a JS kinda problem, right? Kind of… https://t.co/0xi5s7EvVe ([View Tweet](https://twitter.com/csswizardry/status/1446080825481736195))

- Their markup looked like this. The HTML and its styles were right there in the HTML, with a link out to the third party script between the two. The FOUC lasted as long as the script took to fetch and execute. Again, a JS problem, right?
  ![](https://pbs.twimg.com/media/FBGAmbqXsAUEMI3.jpg) ([View Tweet](https://twitter.com/csswizardry/status/1446080828363231238))

- Wrong! Remember, HTML is synchronous and parsed line by line. The problem isn’t with the JS—it’s that the browser can’t even SEE that there’s a style tag until the JS is fully dealt with. ([View Tweet](https://twitter.com/csswizardry/status/1446080830569320448))

- The browser can parse and render the plugin’s HTML right away but then is halted while it solves the end-to-end JS, at which point it discovers the style and then has to restyle the already-rendered HTML. The fix? ([View Tweet](https://twitter.com/csswizardry/status/1446080832662278144))

- Nudge the style information BEFORE the HTML that needs it [note: always do this]. Now we have both the markup and its CSS available before the browser needs to pause.
  ![](https://pbs.twimg.com/media/FBGAuZvWYBAzvqB.jpg) ([View Tweet](https://twitter.com/csswizardry/status/1446080837464772613))

- A much less jarring experience, just by nudging a couple of lines around. https://t.co/Q2BlQDlMTn ([View Tweet](https://twitter.com/csswizardry/status/1446080847736680458))

- Bonus points: because we’re able to statically render the plugin without JS, we can also make the JS asynchronous:
  ![](https://pbs.twimg.com/media/FBGBroTWUAYWz2_.jpg) ([View Tweet](https://twitter.com/csswizardry/status/1446080852170092545))

- Now we don’t even need to block any subsequent content, either! https://t.co/b1Nh8NF7Fs ([View Tweet](https://twitter.com/csswizardry/status/1446080862383222789))

- This is, of course, a grossly oversimplified demo of a much more specific problem my client was having, but the point still stands: HTML is parsed line-by-line, and while the parser is ‘stuck’ on line x, it can’t even see line x+n. ([View Tweet](https://twitter.com/csswizardry/status/1446080865063292932))

- Interestingly, I recently (as)used this behaviour to demonstrate the impact of a late-loading modal on LCP, without actually having to build a late-loading modal:
  ![](https://pbs.twimg.com/media/FBGKcFHXMAMluaP.jpg) ([View Tweet](https://twitter.com/csswizardry/status/1446089179184631808))

- Also:
  ![](https://pbs.twimg.com/media/FBGLuLFXIAcQd9S.jpg) ([View Tweet](https://twitter.com/csswizardry/status/1446090621022781445))
