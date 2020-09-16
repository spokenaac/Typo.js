<p align="center">
<a href="https://www.npmjs.com/package/typo-js-ts">📖 🆃🆈🅿🅾.🅹🆂 📖</h1></a>
</ br>
</p>
<p align="center">
<a href="https://snyk.io/test/github/Amourspirit/Typo.js?targetFile=package.json">
<img src="https://snyk.io/test/github/Amourspirit/Typo.js/badge.svg?targetFile=package.json" /></a>
<img src="https://img.shields.io/github/package-json/v/Amourspirit/Typo.js.svg" />
<a href="https://github.com/badges/stability-badges"> <img src="https://badges.github.io/stability-badges/dist/stable.svg" /></a>
</p>

# Type.js

**Typo.js** is a JavaScript spellchecker that uses Hunspell-style dictionaries.

## Node install

````txt
npm install --save typo-js-ts
````

## Usage

Type implements a Ready pattern that returns a [Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise).

````javascript
var dict = new Typo("en_US");
dict.Ready.then(()=>{
  // Promise that dictionary is loaded
  // do work
  let spellSuggest = dict.suggest("speling");
  console.log(spellSuggest);
  // output [ "spelling", "spieling", "spewing", "peeling", "selling" ]

  spellSuggest = dict.suggest("speling", 1);
  console.log(spellSuggest);
  // output: ["spelling"]
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
    // do worl
    // test if mispelled is the corect spelling for en_US
    console.log(dictionary.check("mispelled"));
  })
  .catch((error) => {
    // dictionary was not loaded
    console.error(error);
  });
````

or using callback

````javascript
new Typo('en_US, null, null, {
  loadedCallback: function (err, dict) {
    if(err) {
      console.error(err);
      return;
    }
    let spellSuggest = dict.suggest("spitting")
    console.log(spellSuggest);
    // Correctly spelled words receive no suggestions.
    // output [ ]

    spellSuggest = dict.suggest("speling", 1);
    console.log(dict.check("Alex")); // true
    console.log(dict.check("alex")); // false
);
````

To use **Typo.js** in a Chrome extension, simply include the *typo.js* file in your extension's background page, and then initialize the dictionary like so:

```javascript
var dictionary = await new Typo("en_US").ready;
```

By default **Typo.js** looks for dictionaries to be in `typo/dictionaries` path.

The dictionary path for `us_US` would contain the following:

* `en_US/en_US.aff`
* `en_US/en_US.dic`

The default paths for `us_US` would be as follows:

* `typo/dictionaries/en_US/en_US.aff`
* `typo/dictionaries/en_US/en_US.dic`

if your dictionaries are stored in a different path then this can be pass to **Typo.js** by way of the settings.

```javascript
var dictionary = new Typo("en_US", null, null, {
  dictionaryPath: "hunspell/dictionaries"
  });
dictionary.Ready.then(()=>{
  // Promise that dictionary is loaded
  // do work
  console.log(dict.check("1st")); // true
  console.log(dict.check("1th")); // false
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

**Typo.js** has full support for the following Hunspell affix flags:

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

**Typo.js** is free software, licensed under the Modified BSD License.
