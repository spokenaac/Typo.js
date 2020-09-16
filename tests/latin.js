function run() {
	let dic = 'la';
	let promiseAffData = fetchTextAff(dic);
	let promiseWordData = fetchTextDic(dic);
	var affData = '';
	var wordData = '';
	Promise.all([promiseAffData, promiseWordData]).then(values => {
		affData = values[0];
		wordData = values[1];
		if (TEST_ORIG === true) {
			new Typo(dic, affData, wordData)
				.ready.then(dict => testDictionary(dict))
				.catch(err => QUnit.pushFailure(err));

			new Typo(dic)
				.ready.then(dict => testDictionary(dict))
				.catch(err => QUnit.pushFailure(err));

			new Typo(dic, null, null, {
				dictionaryPath: DIC_DIR, loadedCallback: function (err, dict) {
					if (err) {
						QUnit.pushFailure(err);
					} else {
						testDictionary(dict);
					}
				}
			});
		} else {
			var hashDict = new Typo(dic, affData, wordData, "hash");
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
		equal(dict.dictionary, "la");
	});

	test("Correct checking of words with no affixes", function () {
		equal(dict.check("firmiter"), true);
		equal(dict.check("quaequam"), true);
		equal(dict.check("quantarumcumque"), true);
	});

	test("Correct checking of root words with single affixes (affixes not used)", function () {
		equal(dict.check("pertransiveris"), true);
		equal(dict.check("saxum"), true);
		equal(dict.check("sepulchrum"), true);
		equal(dict.check("terra"), true);
	});

	test("Correct checking of root words with single affixes rules that can be applied multiple times", function () {
		equal(dict.check("pertransiverisque"), true);
		equal(dict.check("pertransiverisne"), true);
		equal(dict.check("pertransiverisve"), true);
	});

	test("Correct checking of root words with single affixes (affixes used)", function () {
		equal(dict.check("pertransiverisque"), true);
		equal(dict.check("saxi"), true);
		equal(dict.check("sepulchra"), true);
		equal(dict.check("terrae"), true);
	});

	test("Words not in the dictionary in any form are marked as misspelled.", function () {
		equal(dict.check("labhfblhbf"), false);
		equal(dict.check("weluhf73"), false);
		equal(dict.check("nxnxnxnxn"), false);
		equal(dict.check("saxiii"), false);
	});

	test("Leading and trailing whitespace is ignored.", function () {
		equal(dict.check("saxi "), true);
		equal(dict.check(" saxi"), true);
		equal(dict.check("  saxi"), true);
		equal(dict.check("saxi  "), true);
		equal(dict.check("  saxi  "), true);
	});

	/*
	test("Ligature", function () {
		equal(dict.check("FILIAE"), true);
		equal(dict.check("FILIÆ"), true);
	});
	*/
}

addEventListener("load", run, false);