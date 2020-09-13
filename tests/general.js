function run() {
	var empty_dict = new Typo();

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

	asyncTest("_readFile can load a file synchronously", function () {
		var promise = empty_dict._readFile(geturl(DIC_DIR + "/en_US/en_US.dic"));
		promise.then(function (data) {
			assert.ok(data && data.length > 0);
			QUnit.start();
		}, function (err) {
			QUnit.pushFailure(err);
			QUnit.start();
		});
	});

	asyncTest("_readFile can load a file asynchronously", function (assert) {
		empty_dict._readFile(geturl(DIC_DIR + "/en_US/en_US.dic"), null, true)
			.then(function (data) {
				assert.ok(data && data.length > 0);
				QUnit.start();
			}, function (err) {
				QUnit.pushFailure(err);
				QUnit.start();
		});
	});

	function checkLoadedDict(dict) {
		ok(dict);
		ok(dict.compoundRules.length > 0);
		ok(dict.replacementTable.length > 0);
	}

	asyncTest("Synchronous Ready of dictionary data", function () {
		var dict = new Typo("en_US", null, null, {
			asyncLoad: false
		});
		dict.Ready.then(() =>{
			checkLoadedDict(dict);
			QUnit.start();
		});
	});
	asyncTest("Asynchronous Ready of dictionary data", function () {
		var dict = new Typo("en_US", null, null, {
			asyncLoad: true
		});
		dict.Ready.then(() => {
			checkLoadedDict(dict);
			QUnit.start();
		});
	});
	asyncTest("Dictionary instantiated with preloaded data is setup correctly", function () {
		
		var dict = new Typo("en_US");
		dict.Ready.then(()=>{
			checkLoadedDict(dict);
			QUnit.start();
		});
	});
	asyncTest("Dictionary instantiated and instance found in promise", function () {

		new Typo("en_US")
		.Ready.then(dict => {
			checkLoadedDict(dict);
			QUnit.start();
		});
	});

	asyncTest("Asynchronous load of dictionary data", function () {
		var dict = new Typo("en_US", null, null, {
			asyncLoad: true, loadedCallback: function (callbackDict) {
				checkLoadedDict(callbackDict);
				QUnit.start();
			}
		});
	});

	test("Public API throws exception if called before dictionary is loaded", function () {
		var expected = function (err) {

			return typeof err === 'object' && err.toString() === "Error";
		};

		throws(empty_dict.check, expected);
		throws(empty_dict.checkExact, expected);
		throws(empty_dict.hasFlag, expected);
		throws(empty_dict.check, expected);
	});
}

addEventListener("load", run, false);