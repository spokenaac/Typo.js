<p align="center">
<a href="https://github.com/Amourspirit/Typo.js">📖 🆃🆈🅿🅾 📖</h1></a>
</ br>
</p>
<p align="center">
<a href="https://snyk.io/test/github/Amourspirit/Typo.js?targetFile=package.json">
<img src="https://snyk.io/test/github/Amourspirit/Typo.js/badge.svg?targetFile=package.json" /></a>
<img src="https://img.shields.io/github/package-json/v/Amourspirit/Typo.js.svg" />
<img src="https://img.shields.io/github/license/Amourspirit/Typo.js.svg" />
<a href="https://github.com/badges/stability-badges"> <img src="https://badges.github.io/stability-badges/dist/experimental.svg" /></a>
</p>

# Type.js

**Typo** is a JavaScript spellchecker that uses Hunspell-style dictionaries.

## Usage

Type implements a Ready pattern that returns a [Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise).

````javascript
var dictionary = new Typo("en_US");
    dictionary.Ready.then(()=>{
      // Promise that dictionary is loaded
      // do work
    })
    .catch((error) => {
      // dictionary was not loaded
      console.error(error);
    });
````

or

````javascript
new Typo("en_US")
  .Ready.then(dictionary => {
    // Promise that dictionary is loaded
    // do work
    console.log(dictionary.check("mispelled"));
  })
  .catch((error) => {
    // dictionary was not loaded
    console.error(error);
  });
````

To use **Typo** in a Chrome extension, simply include the *typo.js* file in your extension's background page, and then initialize the dictionary like so:

```javascript
var dictionary = new Typo("en_US");
```

By default **Typo** looks for dictionaries to be in `typo/dictionaries` path.

The dictionary path for `us_US` would contain the following:

* `en_US/en_US.aff`
* `en_US/en_US.dic`

The default paths for `us_US` would be as follows:

* `typo/dictionaries/en_US/en_US.aff`
* `typo/dictionaries/en_US/en_US.dic`

if your dictionaries are stored in a different path then this can be pass to **Typo** by way of the settings.

```javascript
var dictionary = new Typo("en_US", null, null, { dictionaryPath: "hunspell/dictionaries" });
dictionary.Ready.then(()=>{
  // Promise that dictionary is loaded
  // do work
});
```

If using in node.js, load it like so:

```javascript
var Typo = require("typo-js-ts");
var dictionary = new Typo([...]);
```

Node as ES Module

````javascript
import {Typo} from "typo-js-ts";
var dictionary = new Typo([...]);
````

To check if a word is spelled correctly, do this:

```javascript
var is_spelled_correctly = dictionary.check("mispelled");
```

To get suggested corrections for a misspelled word, do this:

```javascript
var array_of_suggestions = dictionary.suggest("mispeling");

// array_of_suggestions == ["misspelling", "dispelling", "misdealing", "misfiling", "misruling"]
```

**Typo** has full support for the following Hunspell affix flags:

* PFX
* SFX
* REP
* FLAG
* COMPOUNDMIN
* COMPOUNDRULE
* ONLYINCOMPOUND
* KEEPCASE
* NOSUGGEST
* NEEDAFFIX

## Licensing

**Typo** is free software, licensed under the Modified BSD License.
