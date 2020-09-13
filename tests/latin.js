function run() {
	let promiseAffData = fetchAndDecode(geturl(DIC_DIR + "/en_US/en_US.aff"), 'text');
	let promiseWordData = fetchAndDecode(geturl(DIC_DIR + "/en_US/en_US.dic"), 'text');
	var affData = '';
	var wordData = '';
	Promise.all([promiseAffData, promiseWordData]).then(values => {
		affData = values[0];
		wordData = values[1];
		var hashDict = new Typo("la", affData, wordData, "hash");
		testDictionary(hashDict);

		var dict = new Typo("la", null, null, {
			dictionaryPath: DIC_DIR, asyncLoad: true, loadedCallback: function () {
				testDictionary(dict);
			}
		});
	});
}
function testDictionary(dict) {
	test("Dictionary object attributes are properly set", function () {
		equal(dict.dictionary, "la");
	});

	test("Correct checking of words with no affixes", function () {
		equal(dict.check("firmiter"), false);
		equal(dict.check("quaequam"), false);
		equal(dict.check("quantarumcumque"), false);
	});

	test("Correct checking of root words with single affixes (affixes not used)", function () {
		equal(dict.check("pertransiveris"), false);
		equal(dict.check("saxum"), false);
		equal(dict.check("sepulchrum"), false);
		equal(dict.check("terra"), false);
	});

	test("Correct checking of root words with single affixes rules that can be applied multiple times", function () {
		equal(dict.check("pertransiverisque"), false);
		equal(dict.check("pertransiverisne"), false);
		equal(dict.check("pertransiverisve"), false);
	});

	test("Correct checking of root words with single affixes (affixes used)", function () {
		equal(dict.check("pertransiverisque"), false);
		equal(dict.check("saxi"), false);
		equal(dict.check("sepulchra"), false);
		equal(dict.check("terrae"), false);
	});

	test("Words not in the dictionary in any form are marked as misspelled.", function () {
		equal(dict.check("labhfblhbf"), false);
		equal(dict.check("weluhf73"), false);
		equal(dict.check("nxnxnxnxn"), false);
		equal(dict.check("saxiii"), false);
	});

	test("Leading and trailing whitespace is ignored.", function () {
		equal(dict.check("saxi "), false);
		equal(dict.check(" saxi"), false);
		equal(dict.check("  saxi"), false);
		equal(dict.check("saxi  "), false);
		equal(dict.check("  saxi  "), false);
	});

	/*
	test("Ligature", function () {
		equal(dict.check("FILIAE"), true);
		equal(dict.check("FILIÆ"), true);
	});
	*/
}

addEventListener("load", run, false);