function run() {

	let dic = 'en_GB';
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
		equal(dict.dictionary, "en_GB");
	});

	test("Correct checking of words", function () {
		equal(dict.check("wefwef"), false);
	});
}

addEventListener("load", run, false);