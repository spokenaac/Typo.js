# JS Directory

The JS Directory contains compiled JavaScript of this project. This files can be used directly in your web page to load **Typo.js**  

## Legacy

The `js/legacy` directory contains [IIFE](https://developer.mozilla.org/en-US/docs/Glossary/IIFE) formated libaries that can be run in browser that do not support [Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise) and [Async/Wait](https://developer.mozilla.org/en-US/docs/Learn/JavaScript/Asynchronous/Async_await).  
It is recommended to use the *Modern* library whenever possible as it is faster.

### Legacy CDN Links

Here are the links for the complete Legacy library and minified library respectively.

````html
https://cdn.jsdelivr.net/gh/Amourspirit/Typo.js/js/legacy/typo.js
https://cdn.jsdelivr.net/gh/Amourspirit/Typo.js/js/legacy/typo.min.js
````

## Modern

The `js/es/` directory contains file for more modern browsers see [Browser compatibility](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API) section.  
It is recommonded to use this over the *legacy* library whenever possible. This library is faster due to built in support of modern browser.

### Modern CDN Links

````html
https://cdn.jsdelivr.net/gh/Amourspirit/Typo.js/js/es/typo.js
https://cdn.jsdelivr.net/gh/Amourspirit/Typo.js/js/es/typo.min.js
````
