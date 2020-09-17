declare const __dirname: string;
declare function require(path: string): IRequire;

// declare function typeoLoadedCallback(typo: Typo): void;
declare type typeoLoadedCallback = (err: any, typo: Typo) => void;

type compoundRuleCodesType = Record<string, string[]>

interface Winx extends Window {
	chrome?: {
		runtime?: {
			getURL: (url: string) => string
		}
	}
	browser?: {
		runtime?: {
			getURL: (url: string) => string
		}
	}
}

interface ILooseObject {
	[key: string]: any
}
interface IRequire {
	existsSync: (path: string) => boolean
	readFileSync: (path: string, charset: string) => string
}

interface IEntry {
	add: string
	continuationClasses?: string[]
	match?: RegExp
	remove?: RegExp
}


interface IFlags extends ILooseObject {
	ONLYINCOMPOUND?: string
	FLAG?: string
	NEEDAFFIX?: string
	COMPOUNDMIN?: number

}

interface IOptions {
	flags: IFlags
	dictionaryPath?: string
	loadedCallback?: typeoLoadedCallback | Array<typeoLoadedCallback>
}
// [key:string]: string

interface IRuleCodes extends ILooseObject {
	combineable: boolean
	entries: IEntry[]
	type: string

}

interface IMemoized {
	[key: string]: {
		limit: number,
		suggestions: string[]
	}
}

interface IDictionaryTable {
	[key: string]: string[][] | null | undefined
}
// BUILD_INCLUDE("src/typo/legacy/imports.js")
/**
 * Typo is a JavaScript implementation of a spellchecker using hunspell-style
 * dictionaries.
 */
export class Typo {
	private readyPromise: Promise<any>;
	private ERR_NOT_LOAD = "Dictionary not loaded";
	private ALPHABET = "abcdefghijklmnopqrstuvwxyz";
	private options: IOptions;

	private lDictionary: string = '';
	/**
	* Object that will contain and entry of IRuleCodes for each
	* dynamically added key
	*/
	private rules: ILooseObject = {};

	// dictionaryTable seems to be an object full or arrays for elements in the dom.
	private dictionaryTable: IDictionaryTable = {};
	private compoundRules: (RegExp | string)[] = [];
	private compoundRuleCodes: compoundRuleCodesType = {};

	private replacementTable: string[][] = new Array();

	private flags: IFlags;
	private memoized: IMemoized = {};
	private loaded: boolean = false;

	//#region Constructor
	/**
	 * Typo constructor.
	 * @param {string} [dictionary] The locale code of the dictionary being used.e.g.,
	 * "en_US".This is only used to auto - load dictionaries.
	 * @param {String} [affData] The data from the dictionary 's .aff file. If omitted
	 * and Typo.js is being used in a Chrome extension, the.aff
	 * file will be loaded automatically from
	 * lib / typo / dictionaries / [dictionary] / [dictionary].aff
	 * In other environments,it will be loaded from
	 * [settings.dictionaryPath] / dictionaries / [dictionary] / [dictionary].aff
	 * @param {String} [wordsData] The data from the dictionary 's .dic file. If omitted
	 * and Typo.js is being used in a Chrome extension, the.dic
	 * file will be loaded automatically from * lib / typo / dictionaries / [dictionary] / [dictionary].dic
	 * In other environments, it will be loaded from
	 * [settings.dictionaryPath] / dictionaries / [dictionary] / [dictionary].dic
	 * @param {Object} [settings] Constructor settings.Available properties are :
	 * {String}[dictionaryPath] : path to load dictionary from in non - chrome
	 * environment.
	 * {Object}[flags] : flag information.
	 * {Boolean}[asyncLoad] : If true, affData and wordsData will be loaded
	 * asynchronously.
	 * {Function}[loadedCallback] : Called when both affData and wordsData
	 * have been loaded.Only used if asyncLoad is set to true.The parameter
	 * is the instantiated Typo object.
	 */
	public constructor(dictionary?: string, affData?: string, wordsData?: string, settings?: IOptions) {
		this.options = settings || { flags: {} };
		if (settings !== undefined && settings !== null) {
			if (settings.flags !== undefined) {
				this.flags = settings.flags;
			} else {
				this.flags = {};
			}
		} else {
			this.flags = {};
		}

		const readDataFile = (url: string): Promise<string> => {
			const response = this._readFile(url, null);
			return response;
			// response.then(text => {
			// 	setFunc(text);
			// }).catch(error => {
			// 	console.error(error);
			// });
		}

		const init = async (dic?: string, aff?: string, wData?: string) => {
			const setAffData = (data: string) => {
				aff = data;
				if (wData) {
					setup();
				}
			}

			const setWordsData = (data: string) => {
				wData = data;
				if (aff) {
					setup();
				}
			}
			const setup = () => {
				if (!aff) {
					return;
				}
				if (!wData) {
					return;
				}
				this.rules = this._parseAFF(aff);

				// Save the rule codes that are used in compound rules.
				this.compoundRuleCodes = {};

				for (const rule of this.compoundRules) {
					if (typeof rule === 'string') {
						for (let j = 0; j < rule.length; j++) {
							this.compoundRuleCodes[rule.charAt(j)] = [];
						}
					}
				}

				// If we add this ONLYINCOMPOUND flag to self.compoundRuleCodes, then _parseDIC
				// will do the work of saving the list of words that are compound-only.
				if (this.flags.ONLYINCOMPOUND) {
					this.compoundRuleCodes[this.flags.ONLYINCOMPOUND] = [];
				}

				this.dictionaryTable = this._parseDIC(wData);

				// Get rid of any codes from the compound rule codes that are never used
				// (or that were special regex characters).  Not especially necessary...
				for (const iKey in this.compoundRuleCodes) {
					if (Object.prototype.hasOwnProperty.call(this.compoundRuleCodes, iKey)) {
						if (this.compoundRuleCodes[iKey].length === 0) {
							delete this.compoundRuleCodes[iKey];
						}
					}
				}

				// Build the full regular expressions for each compound rule.
				// I have a feeling (but no confirmation yet) that this method of
				// testing for compound words is probably slow.
				i = 0;

				for (const ruleText of this.compoundRules) {
					let expressionText = "";
					if (typeof ruleText === 'string') {
						for (const character of ruleText) {
							if (character in this.compoundRuleCodes) {
								expressionText += "(" + this.compoundRuleCodes[character].join("|") + ")";
							} else {
								expressionText += character;
							}
						}
						this.compoundRules[i] = new RegExp(expressionText, "i");
						i++;
					}
				}
			}

			const isChromeExt = () => {
				if (typeof (<Winx>window).chrome?.runtime?.getURL === 'function') {
					return true;
				}
				return false;
			}
			const isBrowserExt = () => {
				if (typeof (<Winx>window).browser?.runtime?.getURL === 'function') {
					return true;
				}
				return false;
			}
			let path: string;
			let pLoadDataAff: any;
			let pLoadDataDic: any;
			// Loop-control variables.
			let i: number;
			if (dic) {
				this.lDictionary = dic;

				// If the data is preloaded, just setup the Typo object.
				if (aff && wData) {
					setup();
				}
				// Loading data for Browser extentions.
				else if (typeof window !== 'undefined' && (isChromeExt() === true || isBrowserExt() === true)) {
					if (this.options.dictionaryPath) {
						path = this.options.dictionaryPath;
					}
					else {
						path = "typo/dictionaries";
					}
					let getURL: (url: string) => string;
					if (isChromeExt() === true) {
						getURL = (<any>window).chrome.runtime.getURL;
					} else {
						getURL = (<any>window).browser.runtime.getURL;
					}
					if (!aff) {
						pLoadDataAff = readDataFile(getURL(path + "/" + dic + "/" + dic + ".aff"))
							.then(affD => {
								setAffData(affD);
							});
					}
					if (!wData) {
						pLoadDataDic = readDataFile(getURL(path + "/" + dic + "/" + dic + ".dic"))
							.then(wordsD => {
								setWordsData(wordsD);
							});
					}
				}
				else {
					if (this.options.dictionaryPath) {
						path = this.options.dictionaryPath;
					}
					else if (typeof __dirname !== 'undefined') {
						path = __dirname + '/dictionaries';
					}
					else {
						path = './dictionaries';
					}
					if (!aff) {
						pLoadDataAff = readDataFile(path + "/" + dic + "/" + dic + ".aff")
							.then(affD => {
								setAffData(affD);
							});
					}
					if (!wData) {
						pLoadDataDic = readDataFile(path + "/" + dic + "/" + dic + ".dic")
							.then(wordsD => {
								setWordsData(wordsD);
							});
					}

				}
			}
			return new Promise<boolean>((resolve, reject) => {
				Promise.all([pLoadDataDic, pLoadDataAff])
					.then(() => { resolve(true); })
					.catch(err => { reject(err); });
			});

		}

		this.readyPromise = new Promise((resolve, reject) => {
			init(dictionary, affData, wordsData)
				.then(() => {
					resolve(this);
				})
				.catch((err) => {
					reject(err);
				});
		});

		if (this.options.loadedCallback) {
			this.ready.then();
		}
	}
	//#endregion Constructor

	//#region  Properties
	get ready() {
		const doCallBacks = (err: any, t: Typo) => {
			if (this.options.loadedCallback) {
				if (typeof this.options.loadedCallback === 'function') {
					this.options.loadedCallback(err, t);
				} else if (typeof this.options.loadedCallback === 'object') {
					this.options.loadedCallback.forEach(fn => {
						fn(err, t);
					});
				}
			}
		};
		return this.readyPromise.then(() => {
			this.loaded = true; // store the result
			doCallBacks(null, this);
			return this; // this is what makes the one-liner possible!
		})
			.catch(err => {
				doCallBacks(err, this);
				throw err;
		});
	}
	get dictionary() {
		if (this.lDictionary === '') {
			return null;
		}
		return this.lDictionary
	}
	//#endregion properties
	/**
	 * Loads a Typo instance from a hash of all of the Typo properties.
	 *
	 * @param {object} obj A hash of Typo properties, probably gotten from a JSON.parse(JSON.stringify(typo_instance)).
	 */
	public load(obj: any) {
		for (const i in obj) {
			if (obj.hasOwnProperty(i) && Object(this).hasOwnProperty(i)) {
				const val = obj[i];
				Object.defineProperty(this, i.toString(), {
					value: val,
					writable: true,
					enumerable: true,
					configurable: true
				});
				// this[i] = obj[i];
			}
		}
		return this;
	}

	// #region _readFile function
	/**
	 * Read the contents of a file.
	 * 
	 * @param {String} path The path (relative) to the file.
	 * @param {String|null} charset The expected charset of the file, If null default to utf8
	 * @param {Boolean} async If true, the file will be read asynchronously. For node.js this does nothing, all
	 * files are read synchronously.
	 * @returns {String} The file data if async is false, otherwise a promise object. If running node.js, the data is
	 * always returned.
	 */
	private _readFile(path: string, charset: string | null): Promise<string> {
		charset = charset || "utf8";
		if (typeof window !== 'undefined') {
			const requestHeaders: HeadersInit = new Headers();
			requestHeaders.set('Content-Type', "text/plain; charset=" + charset);
			return fetch(path, {
				method: 'GET',
				headers: requestHeaders
			}).then((response) => response.text());;

		} else if (typeof require !== 'undefined') { // Node.js
			const fs = require("fs");
			let result = '';
			let err: any = null;
			try {
				if (fs.existsSync(path)) {
					result = fs.readFileSync(path, charset);
				} else {
					throw new Error("Path " + path + " does not exist.");
				}
			} catch (e) {
				err = e;
			}
			if (err !== null) {
				return Promise.reject(err);
			}
			return Promise.resolve(result);
		}
		return Promise.reject(new Error('An Error occured getting dictionary'));
	}
	// #endregion _readFile function

	// #region _parseAFF
	private _parseAFF(data: string) {
		const rules: ILooseObject = {};

		let line: string;
		let subline: string;
		let numEntries: number;
		let lineParts: string[];
		let i: number;
		let j: number = 0;
		let iLen: number = 0;
		let jLen: number = 0;

		// Remove comment lines
		data = this._removeAffixComments(data);

		const lines = data.split(/\r?\n/);
		iLen = lines.length;
		for (i = 0; i < iLen; i++) {
			line = lines[i];

			const definitionParts = line.split(/\s+/);

			const ruleType = definitionParts[0].toUpperCase();
			if (ruleType === "PFX" || ruleType === "SFX") {
				const ruleCode = definitionParts[1];
				const combineable = definitionParts[2].toUpperCase();
				numEntries = parseInt(definitionParts[3], 10);

				const entries: IEntry[] = [];

				if (isNaN(numEntries) === false) {
					for (j = i + 1, jLen = i + 1 + numEntries; j < jLen; j++) {
						subline = lines[j];

						lineParts = subline.split(/\s+/);
						const charactersToRemove: string = lineParts[2];

						const additionParts: string[] = lineParts[3].split("/");

						let charactersToAdd: string = additionParts[0];
						if (charactersToAdd === "0") {
							charactersToAdd = "";
						}


						const continuationClasses: string[] = this.parseRuleCodes(additionParts[1]);

						const regexToMatch = lineParts[4];

						const entry: IEntry = {
							add: charactersToAdd
						};

						if (continuationClasses.length > 0) {
							entry.continuationClasses = continuationClasses;
						}

						if (regexToMatch !== ".") {
							if (ruleType === "SFX") {
								entry.match = new RegExp(regexToMatch + "$");
							} else {
								entry.match = new RegExp("^" + regexToMatch);
							}
						}

						if (charactersToRemove.toString() !== "0") {
							if (ruleType === "SFX") {
								entry.remove = new RegExp(charactersToRemove + "$");
							} else {
								// in original Typo.js this was added as string
								// entry.remove = charactersToRemove;
								entry.remove = new RegExp(charactersToRemove);
							}
						}

						entries.push(entry);
					}
				}
				rules[ruleCode] = {
					"type": ruleType,
					"combineable": (combineable === "Y"),
					"entries": entries
				};

				i += numEntries;
			}
			else if (ruleType === "COMPOUNDRULE") {
				numEntries = parseInt(definitionParts[1], 10);

				for (j = i + 1, jLen = i + 1 + numEntries; j < jLen; j++) {
					line = lines[j];

					lineParts = line.split(/\s+/);
					// When the regexp parameter is a string or a number,
					// it is implicitly converted to a RegExp by using new RegExp(regexp).
					// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/match
					this.compoundRules.push(lineParts[1]);
				}

				i += numEntries;
			} else if (ruleType === "REP") {
				lineParts = line.split(/\s+/);

				if (lineParts.length === 3) {
					this.replacementTable.push([
						lineParts[1], lineParts[2]
					]);
				}
			} else {
				// ONLYINCOMPOUND
				// COMPOUNDMIN
				// FLAG
				// KEEPCASE
				// NEEDAFFIX
				this.flags[ruleType] = definitionParts[1];
			}
		}

		return rules;

	}
	// #endregion _parseAFF

	// #region _removeAffixComments
	/**
		 * Removes comment lines and then cleans up blank lines and trailing whitespace.
		 *
		 * @param {String} data The data from an affix file.
		 * @return {String} The cleaned-up data.
		 */

	_removeAffixComments(data: string): string {
		// Remove comments
		// This used to remove any string starting with '#' up to the end of the line,
		// but some COMPOUNDRULE definitions include '#' as part of the rule.
		// I haven't seen any affix files that use comments on the same line as real data,
		// so I don't think this will break anything.
		const str = data.replace(/^\s*#.*$/mg, "")
			// Trim each line
			.replace(/^\s\s*/m, '')
			.replace(/\s\s*$/m, '')
			// Remove blank lines.
			.replace(/\n{2,}/g, "\n")
			// Trim the entire string
			.replace(/^\s\s*/, '')
			.replace(/\s\s*$/, '');
		return str;
	}
	// #endregion _removeAffixComments

	// #region _parseDIC
	/**
	 * Parses the words out from the .dic file.
	 *
	 * @param {String} data The data from the dictionary file.
	 * @returns object The lookup table containing all of the words and
	 *                 word forms from the dictionary.  
	* The dictionary table looks similar to the folowng.  
	* Note the dictionary table can have more than 20,000 entries
	````js
		var dictionaryTable = {
			"1": [["n", "m"]],
			"2": [["n", "1"]],
			"d": [["J", "G", "V", "X"]]
			};
	 ````
	 */
	private _parseDIC(data: string): IDictionaryTable {
		data = this._removeDicComments(data);

		const lines: string[] = data.split(/\r?\n/);

		const dictionaryTable: IDictionaryTable = {};

		/**
		 * Pushes a string array on dictionary table
		 * @param {strng} key The key to add or append rules to
		 * @param {string[]} rules string array of rules to add.
		 * 
		 * The dictionary table looks similar to the folowng.  
		 * Note the dictionary table can have more than 20,000 entries
		 ```js
		var dictionaryTable = {
			"1": [["n", "m"]],
			"2": [["n", "1"]],
			"d": [["J", "G", "V", "X"]]
			};
		 ```
		 */
		const addWord = (key: string, rules: string[]) => { // Some dictionaries will list the same word multiple times with different rule sets.
			if (!dictionaryTable.hasOwnProperty(key)) {
				dictionaryTable[key] = null;
			}

			if (rules.length > 0) {
				let el = dictionaryTable[key]
				if (el === null || el === undefined) {
					el = [];
					dictionaryTable[key] = el;
				}
				el.push(rules);
			}
		}

		// The first line is the number of words in the dictionary.
		for (let i = 1; i < lines.length; i++) {
			const line = lines[i];

			if (!line) { // Ignore empty lines.
				continue;
			}

			const parts = line.split("/", 2);

			const word = parts[0];


			// Now for each affix rule, generate that form of the word.
			if (parts.length > 1) {
				const ruleCodesArray: string[] = this.parseRuleCodes(parts[1]);

				// Save the ruleCodes for compound word situations.
				if (!(this.flags.NEEDAFFIX)
					|| (this.flags.NEEDAFFIX && ruleCodesArray.indexOf(this.flags.NEEDAFFIX) === -1)) {
					addWord(word, ruleCodesArray);
				}
				const jlen = ruleCodesArray.length;
				for (let j = 0; j < jlen; j++) {
					const code = ruleCodesArray[j];

					const rule = this.rules[code];

					if (rule) {
						const newWords = this._applyRule(word, rule);
						for (const newWord of newWords) {
							addWord(newWord, []);

							if (rule.combineable) {
								for (let k = j + 1; k < jlen; k++) {
									const combineCode = ruleCodesArray[k];
									const combineRule = this.rules[combineCode];

									if (combineRule) {
										if (combineRule.combineable && (rule.type !== combineRule.type)) {
											const otherNewWords = this._applyRule(newWord, combineRule);
											for (const otherNewWord of otherNewWords) {
												addWord(otherNewWord, []);
											}
										}
									}
								}
							}
						}
					}
					if (code in this.compoundRuleCodes) {
						this.compoundRuleCodes[code].push(word);
					}
				}
			} else {
				addWord(word.trim(), []);
			}
		}
		return dictionaryTable;
	}
	// #endregion _parseDIC

	// #region _removeDicComments
	/**
	 * Removes comment lines and then cleans up blank lines and trailing whitespace.
	 *
	 * @param {String} data The data from a .dic file.
	 * @return {String} The cleaned-up data.
	 */
	private _removeDicComments(data: string): string {
		// I can't find any official documentation on it, but at least the de_DE
		// dictionary uses tab-indented lines as comments.
		// Remove comments
		return data.replace(/^\t.*$/mg, "");
	}

	// #endregion _removeDicComments

	// #region _applyRule
	private _applyRule(word: string, rule: IRuleCodes): string[] {

		const entries: IEntry[] = rule.entries;
		let newWords: string[] = [];
		// if (!entries) {
		// 	return newWords;
		// }
		for (const entry of entries) {
			if (!entry.match || word.match(entry.match)) {
				let newWord = word;

				if (entry.remove) {
					newWord = newWord.replace(entry.remove, "");
				}

				if (rule.type === "SFX") {
					newWord = newWord + entry.add;
				} else {
					newWord = entry.add + newWord;
				}
				
				newWords.push(newWord);

				if (entry.continuationClasses) {
					entry.continuationClasses.map(key => {
						const continuationRule = this.rules[key];

						if(continuationRule) {
							newWords = newWords.concat(this._applyRule(newWord, continuationRule));
						}
						/*
					else {
						// This shouldn't happen, but it does, at least in the de_DE dictionary.
						// I think the author mistakenly supplied lower-case rule codes instead
						// of upper-case.
					}
					*/
					});
				}
			}
		}
		return newWords;
	}

	// #endregion _applyRule

	//#region init

	//#endregion init

	// #region parseRuleCodes

	/**
	 * 
	 * @param {string} textCodes
	 */
	private parseRuleCodes(textCodes: string): string[] {
		if (!textCodes || this.flags === undefined) {
			return [];
		} else if (!(this.flags.FLAG)) {
			return textCodes.split("");
		} else if (this.flags.FLAG === "long") {
			const pFlags: string[] = [];
			for (let i = 0; i < textCodes.length; i += 2) {
				pFlags.push(textCodes.substr(i, 2));
			}
			return pFlags;
		} else if (this.flags.FLAG === "num") {
			return textCodes.split(",");
		}
		return [];
	}
	// #endregion parseRuleCodes

	//#region check Methods
	/**
	 * Checks whether a word or a capitalization variant exists in the current dictionary.
	 * The word is trimmed and several variations of capitalizations are checked.
	 * If you want to check a word without any changes made to it, call checkExact()
	 *
	 * @see http://blog.stevenlevithan.com/archives/faster-trim-javascript re:trimming function
	 *
	 * @param {string} aWord The word to check.
	 * @returns {boolean}
	 */
	public check(aWord: string): boolean {
		if (!this.loaded) {
			throw new Error(this.ERR_NOT_LOAD);
		}
		if (aWord.length === 0) {
			return false;
		}
		// Remove leading and trailing whitespace
		const trimmedWord = aWord.replace(/^\s\s*/, '').replace(/\s\s*$/, '');

		if (this.checkExact(trimmedWord)) {
			return true;
		}

		// The exact word is not in the dictionary.
		if (trimmedWord.toUpperCase() === trimmedWord) {
			// The word was supplied in all uppercase.
			// Check for a capitalized form of the word.
			const capitalizedWord = trimmedWord[0] + trimmedWord.substring(1).toLowerCase();

			if (this.hasFlag(capitalizedWord, "KEEPCASE")) { // Capitalization variants are not allowed for this word.
				return false;
			}

			if (this.checkExact(capitalizedWord)) {
				return true;
			}
		}

		const lowercaseWord = trimmedWord.toLowerCase();

		if (lowercaseWord !== trimmedWord) {
			if (this.hasFlag(lowercaseWord, "KEEPCASE")) { // Capitalization variants are not allowed for this word.
				return false;
			}

			// Check for a lowercase form
			if (this.checkExact(lowercaseWord)) {
				return true;
			}
		}

		return false;

	}
	//#endregion

	//#region checkExact method

	/**
	* Checks whether a word exists in the current dictionary.
	*
	* @param {string} word The word to check.
	* @returns {boolean}
	*/
	public checkExact(word: string): boolean {
		if (!this.loaded) {
			throw new Error(this.ERR_NOT_LOAD);
		}
		if (word.length === 0) {
			return false;
		}
		const ruleCodes = this.dictionaryTable[word];

		if (typeof ruleCodes === 'undefined') { // Check if this might be a compound word.
			if ((this.flags.COMPOUNDMIN) && (word.length >= this.flags.COMPOUNDMIN)) {
				for (const rule of this.compoundRules) {
					if (word.match(rule)) {
						return true;
					}
				}
			}
		} else if (ruleCodes === null) {
			// a null (but not undefined) value for an entry in the dictionary table
			// means that the word is in the dictionary but has no flags.
			return true;
		} else if (typeof ruleCodes === 'object') { // this.dictionary['hasOwnProperty'] will be a function.
			for (const ruleCode of ruleCodes) {
				if ((ruleCode !== null)
					&& !(this.hasFlag(word, "ONLYINCOMPOUND", ruleCode))) {
					return true;
				}
			}
		}
		return false;
	}
	//#endregion

	//#region hasFlag
	/**
	 * Looks up whether a given word is flagged with a given flag.
	 *
	 * @param {string} word The word in question.
	 * @param {string} strFlag The flag in question.
	 * @param {any} [wordFlags]
	 * @return {boolean}
	 */
	public hasFlag(word: string, strFlag: string, wordFlags?: string | string[]) {
		if (!this.loaded) {
			throw new Error(this.ERR_NOT_LOAD);
		}
		const flattenArr = (arr: string[][]): string[] => {
			const ar: string[] = [];
			for (const a of arr) for (const s of a) ar.push(s);
			return ar;
		}
		if (strFlag in this.flags) {
			if (typeof wordFlags === 'undefined') {
				const tableItem = this.dictionaryTable[word];
				if (tableItem !== undefined && tableItem !== null) {
					wordFlags = flattenArr(tableItem); // only interested in index of a key
				} else {
					wordFlags = [];
				}

			}
			if (wordFlags && wordFlags.indexOf(this.flags[strFlag]) >= 0) {
				return true;
			}
		}

		return false;
	}
	//#endregion hasFlag

	//#region suggest method

	/**
	* Returns a list of suggestions for a misspelled word.
	*
	* @see http://www.norvig.com/spell-correct.html for the basis of this suggestor.
	* This suggestor is primitive, but it works.
	*
	* @param {string} word The misspelling.
	* @param {number} [limit=5] The maximum number of suggestions to return.
	* @returns {string[]} The array of suggestions.
	*/
	public suggest(word: string, limit: number = 5): string[] {
		if (!this.loaded) {
			throw new Error(this.ERR_NOT_LOAD);
		}

		if (this.memoized.hasOwnProperty(word)) {
			const memoizedLimit = this.memoized[word]['limit'];

			// Only return the cached list if it's big enough or if there weren't enough suggestions
			// to fill a smaller limit.
			if (limit <= memoizedLimit || this.memoized[word]['suggestions'].length < memoizedLimit) {
				return this.memoized[word]['suggestions'].slice(0, limit);
			}
		}

		if (this.check(word)) return [];

		// Check the replacement table.
		for (const replacementEntry of this.replacementTable) {
			if (word.indexOf(replacementEntry[0]) !== -1) {
				const correctedWord = word.replace(replacementEntry[0], replacementEntry[1]);
				if (this.check(correctedWord)) {
					return [correctedWord];
				}
			}
		}



		/*
		if (!self.alphabet) {
			// Use the alphabet as implicitly defined by the words in the dictionary.
			var alphaHash = {};
			
			for (var i in self.dictionaryTable) {
				for (var j = 0, _len = i.length; j < _len; j++) {
					alphaHash[i[j]] = true;
				}
			}
			
			for (var i in alphaHash) {
				self.alphabet += i;
			}
			
			var alphaArray = self.alphabet.split("");
			alphaArray.sort();
			self.alphabet = alphaArray.join("");
		}
		*/

		/**
		 * Returns a hash keyed by all of the strings that can be made
		 * by making a single edit to the word (or words in) `words`
		 * The value of each entry is the number of unique ways that the
		 * resulting word can be made.
		 * @param words words Either a hash keyed by words or a string word to operate on.
		 * @param {boolean} [knownOnly=false] known_only Whether this function should ignore strings that are not in the dictionary.
		 */
		const edits1 = (words: string | Record<string, number>, knownOnly: boolean = false) => {
			const rv: Record<string, number> = {};

			let i: number;
			let j: number;
			let numLen: number
			let numJlen: number;
			let strEdit: string;

			if (typeof words === 'string') {
				const wrd = words;
				words = {};
				words[wrd] = 1;
			}
			for (const wrd in words) {
				if (Object.prototype.hasOwnProperty.call(words, wrd)) {
					// const wd = words[wd];
					for (i = 0, numLen = wrd.length + 1; i < numLen; i++) {
						const strSub = [wrd.substring(0, i), wrd.substring(i)];

						if (strSub[1]) {
							strEdit = strSub[0] + strSub[1].substring(1);

							if (!knownOnly || this.check(strEdit)) {
								if (!(strEdit in rv)) {
									rv[strEdit] = 1;
								}
								else {
									rv[strEdit] += 1;
								}
							}
						}

						// Eliminate transpositions of identical letters
						if (strSub[1].length > 1 && strSub[1][1] !== strSub[1][0]) {
							strEdit = strSub[0] + strSub[1][1] + strSub[1][0] + strSub[1].substring(2);

							if (!knownOnly || this.check(strEdit)) {
								if (!(strEdit in rv)) {
									rv[strEdit] = 1;
								}
								else {
									rv[strEdit] += 1;
								}
							}
						}

						if (strSub[1]) {
							for (j = 0, numJlen = this.ALPHABET.length; j < numJlen; j++) {
								// Eliminate replacement of a letter by itself
								if (this.ALPHABET[j] !== strSub[1].substring(0, 1)) {
									strEdit = strSub[0] + this.ALPHABET[j] + strSub[1].substring(1);

									if (!knownOnly || this.check(strEdit)) {
										if (!(strEdit in rv)) {
											rv[strEdit] = 1;
										}
										else {
											rv[strEdit] += 1;
										}
									}
								}
							}
						}

						if (strSub[1]) {
							for (j = 0, numJlen = this.ALPHABET.length; j < numJlen; j++) {
								strEdit = strSub[0] + this.ALPHABET[j] + strSub[1];

								if (!knownOnly || this.check(strEdit)) {
									if (!(strEdit in rv)) {
										rv[strEdit] = 1;
									}
									else {
										rv[strEdit] += 1;
									}
								}
							}
						}
					}
				}
			}
			return rv;
		}

		const correct = (wrd: string) => {
			// Get the edit-distance-1 and edit-distance-2 forms of this word.
			const ed1 = edits1(wrd);
			const ed2 = edits1(ed1, true);

			// Sort the edits based on how many different ways they were created.
			const weightedCorrections = ed2;

			for (const ed1word in ed1) {
				if (!this.check(ed1word)) {
					continue;
				}

				if (ed1word in weightedCorrections) {
					weightedCorrections[ed1word] += ed1[ed1word];
				}
				else {
					weightedCorrections[ed1word] = ed1[ed1word];
				}
			}

			let i: number;

			const sortedCorrections: (string | number)[][] = [];

			for (const j in weightedCorrections) {
				// if (Object.prototype.hasOwnProperty.call(weighted_corrections, i)) {
				// 	sorted_corrections.push([i, weighted_corrections[i]]);
				// }
				if (weightedCorrections.hasOwnProperty(j)) {
					sortedCorrections.push([j, weightedCorrections[j]]);
				}
			}

			const sorter = (a: (string | number)[], b: (string | number)[]) => {
				// frist eleement is the word if a and b
				// second element of a and b is numeric values
				const aVal = a[1];
				const bVal = b[1];
				if (aVal < bVal) {
					return -1;
				} else if (aVal > bVal) {
					return 1;
				}
				// @todo If a and b are equally weighted, add our own weight based on something like the key locations on this language's default keyboard.
				return b[0].toString().localeCompare(a[0].toString());
			}

			sortedCorrections.sort(sorter).reverse();

			const rv = [];

			let capitalizationScheme = "lowercase";

			if (wrd.toUpperCase() === wrd) {
				capitalizationScheme = "uppercase";
			}
			else if (wrd.substr(0, 1).toUpperCase() + wrd.substr(1).toLowerCase() === wrd) {
				capitalizationScheme = "capitalized";
			}

			let workingLimit = limit;

			for (i = 0; i < Math.min(workingLimit, sortedCorrections.length); i++) {
				let sortString = sortedCorrections[i][0].toString();
				let update = false;
				if ("uppercase" === capitalizationScheme) {
					sortString = sortString.toUpperCase();
					update = true;
				}
				else if ("capitalized" === capitalizationScheme) {
					sortString = sortString.substr(0, 1).toUpperCase() + sortString.substr(1);
					update = true;
				}
				if (!this.hasFlag(sortString, "NOSUGGEST") && rv.indexOf(sortString) === -1) {
					rv.push(sortString);
				}
				else {
					// If one of the corrections is not eligible as a suggestion , make sure we still return the right number of suggestions.
					workingLimit++;
				}
				if (update) {
					sortedCorrections[i][0] = sortString;
				}
			}
			return rv;
		}

		this.memoized[word] = {
			'suggestions': correct(word),
			'limit': limit
		};
		return this.memoized[word]['suggestions'];
	}
	//#endregion suggest
}