---
title: "TIL: Adding custom scripts with templater"
description: "I learned how we can create custom scripts in Obsidian with templater and now it opens another set of possible things that I can do with..."
date: 2021-06-23
draft: false
tags:
  - obsidian-import
  - blog
source_path: "legacy-vault/🖋️ Blog/TIL/Adding custom scripts with templater.md"
---

I learned how we can create custom scripts in Obsidian with templater and now it opens another set of possible things that I can do with obsidian.

## How to do it

### Create a script with whatever you want to do

For my case I needed to strip first character of File named with an @ which I usually use for naming humans/companies/organizations.

- **Step 1**: Create a script file with name humanSnip.js or whatever you want
```js
function humanSnip(human) {
	const fileName = human.file.title;
	return fileName.slice(1, fileName.length);
}
module.exports = humanSnip;
```
- **Step 2**: Put this file in some place of your vault except `.obsidian` folder as this folder is not accessible via templater plugin.
- **Step 3**: Add the folder location in templater script locations
	
(Screenshot reference from original Obsidian note omitted in this web import.)
- **Step 4**: Use the script as `tp.user.humanSnip(tp)` or whatever the name of your script was


---
## Additional Metadata

Suggested by:: [@Ximena](🧔%20Private/Uncategorized%20Notes/@Ximena.md)
