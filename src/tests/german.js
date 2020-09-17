function run() {
	let dic = 'de_DE';
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
		equal(dict.dictionary, "de_DE");
	});

	test("Capitalization is respected", function typo_german_capitalization() {
		equal(dict.check("Liebe"), true);
		equal(dict.check("LIEBE"), true);

		// liebe is flagged with ONLYINCOMPOUND, but lieb has a suffix rule that generates liebe
		equal(dict.check("liebe"), true);
	});

	test("Issue #21", function typo_german_issue_21() {
		equal(dict.check("Paar"), true);
		equal(dict.check("paar"), true);
		equal(dict.check("auch"), true);
		equal(dict.check("man"), true);
		equal(dict.check("nutzen"), true);
		equal(dict.check("paarbildung"), false);
		equal(dict.check("Bild"), true);
	});
}

addEventListener("load", run, false);