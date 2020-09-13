function run() {
	let promiseAffData = fetchAndDecode(geturl(DIC_DIR + "/en_US/en_US.aff"), 'text');
	let promiseWordData = fetchAndDecode(geturl(DIC_DIR + "/en_US/en_US.dic"), 'text');
	var affData = '';
	var wordData = '';
	Promise.all([promiseAffData, promiseWordData]).then(values => {
		affData = values[0];
		wordData = values[1];
		var hashDict = new Typo("fr_FR", affData, wordData);
		testDictionary(hashDict);

		var dict = new Typo("fr_FR", null, null, {
			dictionaryPath: DIC_DIR, asyncLoad: true, loadedCallback: function () {
				testDictionary(dict);
			}
		});
	});
}
function testDictionary(dict) {
	test("Dictionary object attributes are properly set", function () {
		equal(dict.dictionary, "fr_FR");
	});

	test("Correct checking of words with affixes", function () {
		equal(dict.check("marchons"), false);
	});

	test("KEEPCASE flag is respected", function () {
		equal(dict.check("Bq"), false);
		equal(dict.check("BQ"), false);
		equal(dict.check("pH"), true);
		equal(dict.check("mmHg"), false);
		equal(dict.check("MMHG"), false);
		equal(dict.check("Mmhg"), false);
	});

	test("Contractions are recognized", function () {
		equal(dict.check("j'espère"), false);
		equal(dict.check("j'espére"), false);
		equal(dict.check("c'est"), false);
		equal(dict.check("C'est"), false);
	});

	test("Continuation classes", function () {
		equal(dict.check("l'impedimentum"), false);
		equal(dict.check("d'impedimentum"), false);
		equal(dict.check("d'impedimenta"), false);
		equal(dict.check("espérés"), false);
		equal(dict.check("espérée"), false);
		equal(dict.check("espérées"), false);
		equal(dict.check("qu'espérés"), false);
		equal(dict.check("qu'espérée"), false);
		equal(dict.check("qu'espérées"), false);
	});

	test("NEEDAFFIX is respected", function () {
		// Not flagged with NEEDAFFIX
		equal(dict.check("espressivo"), false);

		// Is flagged with NEEDAFFIX, but has an empty affix rule
		equal(dict.check("espérance"), false);
		equal(dict.check("esperluette"), false);
	});
}

addEventListener("load", run, false);