function run() {
	const empty_dict = new Typo();
	const dic = 'en_US';
	test("Dictionary instantiated without arguments is essentially empty.", function () {
		deepEqual(empty_dict.rules, {});
		deepEqual(empty_dict.dictionaryTable, {});
		deepEqual(empty_dict.dictionary, null);
	});

	test("Comments are removed from affix files", function () {
		equal(empty_dict._removeAffixComments("# abc\ndef # ghi\n # jkl\nmnop qrst\n##"), "def # ghi\nmnop qrst", "Comment-only lines are removed.");
		equal(empty_dict._removeAffixComments(""), "", "Handles empty input.");
		equal(empty_dict._removeAffixComments("abc"), "abc", "Handles input that doesn't need changing.");
		equal(empty_dict._removeAffixComments(" abc"), "abc", "Leading whitespace is removed.");
		equal(empty_dict._removeAffixComments(" abc "), "abc", "Leading and trailing whitespace is removed.");
		equal(empty_dict._removeAffixComments("\n\n\abc\n"), "abc", "Leading and trailing newlines are removed.");
		equal(empty_dict._removeAffixComments("\n\n"), "", "Consecutive newlines are removed.");
		equal(empty_dict._removeAffixComments("\t"), "", "Tabs are treated as whitespace.");
		equal(empty_dict._removeAffixComments("\n\t \t\n\n"), "", "All whitespace is treated the same.");
	});
	function checkLoadedDict(dict) {
		ok(dict);
		ok(dict.compoundRules.length > 0);
		ok(dict.replacementTable.length > 0);
	}
	if (TEST_ORIG === true) {
		asyncTest("_readFile can load a file synchronously with async/await", async function () {
			try {
				var data = await empty_dict._readFile(getDicUrl(dic,'dic'));
				assert.ok(data && data.length > 0);
				QUnit.start();
			} catch (err) {
				QUnit.pushFailure(err);
				QUnit.start();
			}
		});

		asyncTest("_readFile can load a file asynchronously", function (assert) {
			empty_dict._readFile(getDicUrl(dic, 'dic'), null, true)
				.then(function (data) {
					assert.ok(data && data.length > 0);
					QUnit.start();
				}, function (err) {
					QUnit.pushFailure(err);
					QUnit.start();
				});
		});

		asyncTest("Synchronous Ready of dictionary data", async function () {
			var dict = await new Typo(dic).ready;
			checkLoadedDict(dict);
			QUnit.start();
		});
		asyncTest("Asynchronous Ready of dictionary instantiated with preloaded data is setup correctly", function () {
			new Typo(dic)
				.ready.then(dict => {
					checkLoadedDict(dict);
					QUnit.start();
				});
		});
		asyncTest("Dictionary instantiated and instance found in promise", function () {

			new Typo(dic)
				.ready.then(dict => {
					checkLoadedDict(dict);
					QUnit.start();
				});
		});

		asyncTest("Asynchronous load of dictionary data with callback", function () {
			new Typo(dic, null, null, {
				loadedCallback: function (err, callbackDict) {
					checkLoadedDict(callbackDict);
					QUnit.start();
				}
			});
		});
	} else { // old style testing below for orig lib.
		test("_readFile can load a file synchronously", function () {
			var data = empty_dict._readFile(getDicUrl(dic, 'dic'));
			ok(data && data.length > 0);
		});

		asyncTest("_readFile can load a file asynchronously", function (assert) {
			empty_dict._readFile(getDicUrl(dic, 'dic'), null, true).then(function (data) {
				assert.ok(data && data.length > 0);
				QUnit.start();
			}, function (err) {
				QUnit.pushFailure(err);
				QUnit.start();
			});
		});
		test("Dictionary instantiated with preloaded data is setup correctly", function () {
			var affData = empty_dict._readFile(getDicUrl(dic, 'aff'));
			var wordData = empty_dict._readFile(getDicUrl(dic, 'dic'));
			var dict = new Typo(dic, affData, wordData);
			checkLoadedDict(dict);
		});

		test("Synchronous load of dictionary data", function () {
			var dict = new Typo(dic);
			checkLoadedDict(dict);
		});

		asyncTest("Asynchronous load of dictionary data", function () {
			var dict = new Typo(dic, null, null, {
				asyncLoad: true, loadedCallback: function () {
					checkLoadedDict(dict);
					QUnit.start();
				}
			});
		});
	}

	test("Public API throws exception if called before dictionary is loaded", function () {
		var expected = function (err) {
			if (TEST_ORIG === true ){
				return typeof err === 'object' && err.toString() === "Error";
			}
			return err === "Dictionary not loaded.";
		};

		throws(empty_dict.check, expected);
		throws(empty_dict.checkExact, expected);
		throws(empty_dict.hasFlag, expected);
		throws(empty_dict.check, expected);
	});
}

addEventListener("load", run, false);