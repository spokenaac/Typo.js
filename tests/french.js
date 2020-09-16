function run() {
	let dic = 'fr_FR';
	let promiseAffData = fetchTextAff(dic, true);
	let promiseWordData = fetchTextDic(dic, true);
	var affData = '';
	var wordData = '';
	Promise.all([promiseAffData, promiseWordData]).then(values => {
		affData = values[0];
		wordData = values[1];
		if (TEST_ORIG === true) {
			new Typo(dic, affData, wordData)
				.ready.then(dict => testDictionary(dict))
				.catch(err => console.error(err));

			new Typo(dic)
				.ready.then(dict => testDictionary(dict))
				.catch(err => console.error(err));

			new Typo(dic, null, null, {
				dictionaryPath: DIC_DIR, loadedCallback: function (err, dict) {
					if (err) {
						//pushFailure(err);
						console.error(err);
					} else {
						testDictionary(dict);
					}
				}
			});
		} else {
			var hashDict = new Typo(dic, affData, wordData);
			testDictionary(hashDict);

			var dict = new Typo(dic, null, null, {
				dictionaryPath: DIC_DIR, asyncLoad: true, loadedCallback: function () {
					testDictionary(dict);
				}
			});
		}

	});
}

function testDictionary(dict) {
	test("Dictionary object attributes are properly set", function () {
		equal(dict.dictionary, "fr_FR");
	});

	test("Correct checking of words with affixes", function () {
		try {
			equal(dict.check("marchons"), true);
		} catch (err) {
			QUnit.pushFailure(err)
		}
	});

	test("KEEPCASE flag is respected", function () {
		try {
			equal(dict.check("Bq"), true);
			equal(dict.check("BQ"), false);
			equal(dict.check("pH"), true);
			equal(dict.check("mmHg"), true);
			equal(dict.check("MMHG"), false);
			equal(dict.check("Mmhg"), false);
		} catch (err) {
			QUnit.pushFailure(err)
		}
	});

	test("Contractions are recognized", function () {
		try {
			equal(dict.check("j'espère"), true);
			equal(dict.check("j'espére"), false);
			equal(dict.check("c'est"), true);
			equal(dict.check("C'est"), true);
		} catch (err) {
			QUnit.pushFailure(err)
		}
	});

	test("Continuation classes", function () {
		try {
			equal(dict.check("l'impedimentum"), true);
			equal(dict.check("d'impedimentum"), true);
			equal(dict.check("d'impedimenta"), true);
			equal(dict.check("espérés"), true);
			equal(dict.check("espérée"), true);
			equal(dict.check("espérées"), true);
			equal(dict.check("qu'espérés"), true);
			equal(dict.check("qu'espérée"), true);
			equal(dict.check("qu'espérées"), true);
		} catch (err) {
			QUnit.pushFailure(err)
		}
	});

	test("NEEDAFFIX is respected", function () {
		try {
			// Not flagged with NEEDAFFIX
			equal(dict.check("espressivo"), true);

			// Is flagged with NEEDAFFIX, but has an empty affix rule
			equal(dict.check("espérance"), true);
			equal(dict.check("esperluette"), true);
		} catch (err) {
			QUnit.pushFailure(err)
		}
	});
}
addEventListener("load", run, false);