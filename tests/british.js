function run() {

	let promiseAffData = fetchAndDecode(geturl(DIC_DIR + "/en_GB/en_GB.aff"), 'text');
	let promiseWordData = fetchAndDecode(geturl(DIC_DIR + "/en_GB/en_GB.dic"), 'text');
	var affData = '';
	var wordData = '';
	Promise.all([promiseAffData, promiseWordData]).then(values => {
		affData = values[0];
		wordData = values[1];
		var hashDict = new Typo("en_GB", affData, wordData);

		testDictionary(hashDict);

		var dict = new Typo("en_GB", null, null, {
			dictionaryPath: DIC_DIR, asyncLoad: true, loadedCallback: function () {
				testDictionary(dict);
			}
		});
	});
}

function testDictionary(dict) {
	test("Dictionary object attributes are properly set", function () {
		equal(dict.dictionary, "en_GB");
	});

	test("Correct checking of words", function () {
		equal(dict.check("wefwef"), false);
	});
}

addEventListener("load", run, false);