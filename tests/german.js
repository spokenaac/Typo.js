function run() {
	let promiseAffData = fetchAndDecode(geturl(DIC_DIR + "/en_US/en_US.aff"), 'text');
	let promiseWordData = fetchAndDecode(geturl(DIC_DIR + "/en_US/en_US.dic"), 'text');
	var affData = '';
	var wordData = '';
	Promise.all([promiseAffData, promiseWordData]).then(values => {
		affData = values[0];
		wordData = values[1];
		var hashDict = new Typo("de_DE", affData, wordData);
		testDictionary(hashDict);

		var dict = new Typo("de_DE", null, null, {
			dictionaryPath: DIC_DIR, asyncLoad: true, loadedCallback: function () {
				testDictionary(dict);
			}
		});
	});
}

function testDictionary(dict) {
	test("Dictionary object attributes are properly set", function () {
		equal(dict.dictionary, "de_DE");
	});

	test("Capitalization is respected", function typo_german_capitalization() {
		equal(dict.check("Liebe"), false);
		equal(dict.check("LIEBE"), false);

		// liebe is flagged with ONLYINCOMPOUND, but lieb has a suffix rule that generates liebe
		equal(dict.check("liebe"), false);
	});

	test("Issue #21", function typo_german_issue_21() {
		equal(dict.check("Paar"), false);
		equal(dict.check("paar"), false);
		equal(dict.check("auch"), false);
		equal(dict.check("man"), true);
		equal(dict.check("nutzen"), false);
		equal(dict.check("paarbildung"), false);
		equal(dict.check("Bild"), false);
	});
}

addEventListener("load", run, false);