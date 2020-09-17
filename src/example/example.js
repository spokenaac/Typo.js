var Typo = require('../../dist/commonjs/typo').Typo;
new Typo('en_US')
  .ready.then(dict => {
    console.log(dict.check('mispelled')); // false
    console.log(dict.check("1st")); // true
    console.log(dict.check("1th")); // false
    console.log(dict.check("Alex")); // true
    console.log(dict.check("alex")); // false

    let spellSuggest = dict.suggest("spitting");
    console.log(spellSuggest);
    // Correctly spelled words receive no suggestions.
    // output [ ]

    spellSuggest = dict.suggest("speling");
    console.log(spellSuggest);
    // output [ "spelling", "spieling", "spewing", "peeling", "selling" ]

    spellSuggest = dict.suggest("speling", 1);
    // output [ 'spelling' ]
    console.log(spellSuggest);

  /* Expected console log
    false
    true
    false
    true
    false
    []
    [ 'spelling', 'spieling', 'spewing', 'peeling', 'selling' ]
    [ 'spelling' ]
  */
});