---
title: "Array Splice Method also alters the original array"
description: "Array splice method will alter the actual array. Usually I use the splice approach as in most cases the original array is not required bu..."
date: 2021-07-10
draft: false
tags:
  - obsidian-import
  - til
source_path: "legacy-vault/🖋️ Blog/TIL/Array Splice Method also alters the original array.md"
---

Array splice method will alter the actual array. Usually I use the splice approach as in most cases the original array is not required but in case that is required you can create a copy of original Array using 
```javascript 
const clonedArray = JSON.Parse(JSON.stringify(array));
``` 
and then apply splice on `clonedArray` like
```javascript
const firstEightArrayKeys = clonedArray.splice(0,8);
```

---
**Learned on** : [10-Jul-2021](🧔%20Private/Planners/Day%20Planners/10-Jul-2021.md)
**Source** :
