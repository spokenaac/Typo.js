(function () {
  'use strict';

  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  function _defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ("value" in descriptor) descriptor.writable = true;
      Object.defineProperty(target, descriptor.key, descriptor);
    }
  }

  function _createClass(Constructor, protoProps, staticProps) {
    if (protoProps) _defineProperties(Constructor.prototype, protoProps);
    if (staticProps) _defineProperties(Constructor, staticProps);
    return Constructor;
  }

  let Typo = function () {
    function Typo(dictionary, affData, wordsData, settings) {
      _classCallCheck(this, Typo);

      this.ERR_NOT_LOAD = "Dictionary not loaded";
      this.ALPHABET = "abcdefghijklmnopqrstuvwxyz";
      this.lDictionary = '';
      this.rules = {};
      this.dictionaryTable = {};
      this.compoundRules = [];
      this.compoundRuleCodes = {};
      this.replacementTable = new Array();
      this.memoized = {};
      this.loaded = false;
      this.options = settings || {
        flags: {}
      };

      if (settings !== undefined && settings !== null) {
        if (settings.flags !== undefined) {
          this.flags = settings.flags;
        } else {
          this.flags = {};
        }
      } else {
        this.flags = {};
      }

      const readDataFile = url => {
        const response = this._readFile(url, null);

        return response;
      };

      const init = async (dic, aff, wData) => {
        const setAffData = data => {
          aff = data;

          if (wData) {
            setup();
          }
        };

        const setWordsData = data => {
          wData = data;

          if (aff) {
            setup();
          }
        };

        const setup = () => {
          if (!aff) {
            return;
          }

          if (!wData) {
            return;
          }

          this.rules = this._parseAFF(aff);
          this.compoundRuleCodes = {};

          for (const rule of this.compoundRules) {
            if (typeof rule === 'string') {
              for (let j = 0; j < rule.length; j++) {
                this.compoundRuleCodes[rule.charAt(j)] = [];
              }
            }
          }

          if (this.flags.ONLYINCOMPOUND) {
            this.compoundRuleCodes[this.flags.ONLYINCOMPOUND] = [];
          }

          this.dictionaryTable = this._parseDIC(wData);

          for (const iKey in this.compoundRuleCodes) {
            if (Object.prototype.hasOwnProperty.call(this.compoundRuleCodes, iKey)) {
              if (this.compoundRuleCodes[iKey].length === 0) {
                delete this.compoundRuleCodes[iKey];
              }
            }
          }

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
        };

        const isChromeExt = () => {
          var _window$chrome, _window$chrome$runtim;

          if (typeof ((_window$chrome = window.chrome) === null || _window$chrome === void 0 ? void 0 : (_window$chrome$runtim = _window$chrome.runtime) === null || _window$chrome$runtim === void 0 ? void 0 : _window$chrome$runtim.getURL) === 'function') {
            return true;
          }

          return false;
        };

        const isBrowserExt = () => {
          var _window$browser, _window$browser$runti;

          if (typeof ((_window$browser = window.browser) === null || _window$browser === void 0 ? void 0 : (_window$browser$runti = _window$browser.runtime) === null || _window$browser$runti === void 0 ? void 0 : _window$browser$runti.getURL) === 'function') {
            return true;
          }

          return false;
        };

        let path;
        let pLoadDataAff;
        let pLoadDataDic;
        let i;

        if (dic) {
          this.lDictionary = dic;

          if (aff && wData) {
            setup();
          } else if (typeof window !== 'undefined' && (isChromeExt() === true || isBrowserExt() === true)) {
              if (this.options.dictionaryPath) {
                path = this.options.dictionaryPath;
              } else {
                path = "typo/dictionaries";
              }

              let getURL;

              if (isChromeExt() === true) {
                getURL = window.chrome.runtime.getURL;
              } else {
                getURL = window.browser.runtime.getURL;
              }

              if (!aff) {
                pLoadDataAff = readDataFile(getURL(path + "/" + dic + "/" + dic + ".aff")).then(affD => {
                  setAffData(affD);
                });
              }

              if (!wData) {
                pLoadDataDic = readDataFile(getURL(path + "/" + dic + "/" + dic + ".dic")).then(wordsD => {
                  setWordsData(wordsD);
                });
              }
            } else {
              if (this.options.dictionaryPath) {
                path = this.options.dictionaryPath;
              } else if (typeof __dirname !== 'undefined') {
                path = __dirname + '/dictionaries';
              } else {
                path = './dictionaries';
              }

              if (!aff) {
                pLoadDataAff = readDataFile(path + "/" + dic + "/" + dic + ".aff").then(affD => {
                  setAffData(affD);
                });
              }

              if (!wData) {
                pLoadDataDic = readDataFile(path + "/" + dic + "/" + dic + ".dic").then(wordsD => {
                  setWordsData(wordsD);
                });
              }
            }
        }

        return new Promise((resolve, reject) => {
          Promise.all([pLoadDataDic, pLoadDataAff]).then(() => {
            resolve(true);
          }).catch(err => {
            reject(err);
          });
        });
      };

      this.readyPromise = new Promise((resolve, reject) => {
        init(dictionary, affData, wordsData).then(() => {
          resolve(this);
        }).catch(err => {
          reject(err);
        });
      });

      if (this.options.loadedCallback) {
        this.ready.then();
      }
    }

    _createClass(Typo, [{
      key: "load",
      value: function load(obj) {
        for (const i in obj) {
          if (obj.hasOwnProperty(i) && Object(this).hasOwnProperty(i)) {
            const val = obj[i];
            Object.defineProperty(this, i.toString(), {
              value: val,
              writable: true,
              enumerable: true,
              configurable: true
            });
          }
        }

        return this;
      }
    }, {
      key: "_readFile",
      value: function _readFile(path, charset) {
        charset = charset || "utf8";

        if (typeof window !== 'undefined') {
          const requestHeaders = new Headers();
          requestHeaders.set('Content-Type', "text/plain; charset=" + charset);
          return fetch(path, {
            method: 'GET',
            headers: requestHeaders
          }).then(response => {
            return response.text();
          });
        }

        return Promise.reject(new Error('An Error occured getting dictionary'));
      }
    }, {
      key: "_parseAFF",
      value: function _parseAFF(data) {
        const rules = {};
        let line;
        let subline;
        let numEntries;
        let lineParts;
        let i;
        let j = 0;
        let iLen = 0;
        let jLen = 0;
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
            const entries = [];

            if (isNaN(numEntries) === false) {
              for (j = i + 1, jLen = i + 1 + numEntries; j < jLen; j++) {
                subline = lines[j];
                lineParts = subline.split(/\s+/);
                const charactersToRemove = lineParts[2];
                const additionParts = lineParts[3].split("/");
                let charactersToAdd = additionParts[0];

                if (charactersToAdd === "0") {
                  charactersToAdd = "";
                }

                const continuationClasses = this.parseRuleCodes(additionParts[1]);
                const regexToMatch = lineParts[4];
                const entry = {
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
                    entry.remove = new RegExp(charactersToRemove);
                  }
                }

                entries.push(entry);
              }
            }

            rules[ruleCode] = {
              "type": ruleType,
              "combineable": combineable === "Y",
              "entries": entries
            };
            i += numEntries;
          } else if (ruleType === "COMPOUNDRULE") {
            numEntries = parseInt(definitionParts[1], 10);

            for (j = i + 1, jLen = i + 1 + numEntries; j < jLen; j++) {
              line = lines[j];
              lineParts = line.split(/\s+/);
              this.compoundRules.push(lineParts[1]);
            }

            i += numEntries;
          } else if (ruleType === "REP") {
            lineParts = line.split(/\s+/);

            if (lineParts.length === 3) {
              this.replacementTable.push([lineParts[1], lineParts[2]]);
            }
          } else {
            this.flags[ruleType] = definitionParts[1];
          }
        }

        return rules;
      }
    }, {
      key: "_removeAffixComments",
      value: function _removeAffixComments(data) {
        const str = data.replace(/^\s*#.*$/mg, "").replace(/^\s\s*/m, '').replace(/\s\s*$/m, '').replace(/\n{2,}/g, "\n").replace(/^\s\s*/, '').replace(/\s\s*$/, '');
        return str;
      }
    }, {
      key: "_parseDIC",
      value: function _parseDIC(data) {
        data = this._removeDicComments(data);
        const lines = data.split(/\r?\n/);
        const dictionaryTable = {};

        const addWord = (key, rules) => {
          if (!dictionaryTable.hasOwnProperty(key)) {
            dictionaryTable[key] = null;
          }

          if (rules.length > 0) {
            let el = dictionaryTable[key];

            if (el === null || el === undefined) {
              el = [];
              dictionaryTable[key] = el;
            }

            el.push(rules);
          }
        };

        for (let i = 1; i < lines.length; i++) {
          const line = lines[i];

          if (!line) {
            continue;
          }

          const parts = line.split("/", 2);
          const word = parts[0];

          if (parts.length > 1) {
            const ruleCodesArray = this.parseRuleCodes(parts[1]);

            if (!this.flags.NEEDAFFIX || this.flags.NEEDAFFIX && ruleCodesArray.indexOf(this.flags.NEEDAFFIX) === -1) {
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
                        if (combineRule.combineable && rule.type !== combineRule.type) {
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
    }, {
      key: "_removeDicComments",
      value: function _removeDicComments(data) {
        return data.replace(/^\t.*$/mg, "");
      }
    }, {
      key: "_applyRule",
      value: function _applyRule(word, rule) {
        const entries = rule.entries;
        let newWords = [];

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

                if (continuationRule) {
                  newWords = newWords.concat(this._applyRule(newWord, continuationRule));
                }
              });
            }
          }
        }

        return newWords;
      }
    }, {
      key: "parseRuleCodes",
      value: function parseRuleCodes(textCodes) {
        if (!textCodes || this.flags === undefined) {
          return [];
        } else if (!this.flags.FLAG) {
          return textCodes.split("");
        } else if (this.flags.FLAG === "long") {
          const pFlags = [];

          for (let i = 0; i < textCodes.length; i += 2) {
            pFlags.push(textCodes.substr(i, 2));
          }

          return pFlags;
        } else if (this.flags.FLAG === "num") {
          return textCodes.split(",");
        }

        return [];
      }
    }, {
      key: "check",
      value: function check(aWord) {
        if (!this.loaded) {
          throw new Error(this.ERR_NOT_LOAD);
        }

        if (aWord.length === 0) {
          return false;
        }

        const trimmedWord = aWord.replace(/^\s\s*/, '').replace(/\s\s*$/, '');

        if (this.checkExact(trimmedWord)) {
          return true;
        }

        if (trimmedWord.toUpperCase() === trimmedWord) {
          const capitalizedWord = trimmedWord[0] + trimmedWord.substring(1).toLowerCase();

          if (this.hasFlag(capitalizedWord, "KEEPCASE")) {
            return false;
          }

          if (this.checkExact(capitalizedWord)) {
            return true;
          }
        }

        const lowercaseWord = trimmedWord.toLowerCase();

        if (lowercaseWord !== trimmedWord) {
          if (this.hasFlag(lowercaseWord, "KEEPCASE")) {
            return false;
          }

          if (this.checkExact(lowercaseWord)) {
            return true;
          }
        }

        return false;
      }
    }, {
      key: "checkExact",
      value: function checkExact(word) {
        if (!this.loaded) {
          throw new Error(this.ERR_NOT_LOAD);
        }

        if (word.length === 0) {
          return false;
        }

        const ruleCodes = this.dictionaryTable[word];

        if (typeof ruleCodes === 'undefined') {
          if (this.flags.COMPOUNDMIN && word.length >= this.flags.COMPOUNDMIN) {
            for (const rule of this.compoundRules) {
              if (word.match(rule)) {
                return true;
              }
            }
          }
        } else if (ruleCodes === null) {
          return true;
        } else if (typeof ruleCodes === 'object') {
          for (const ruleCode of ruleCodes) {
            if (ruleCode !== null && !this.hasFlag(word, "ONLYINCOMPOUND", ruleCode)) {
              return true;
            }
          }
        }

        return false;
      }
    }, {
      key: "hasFlag",
      value: function hasFlag(word, strFlag, wordFlags) {
        if (!this.loaded) {
          throw new Error(this.ERR_NOT_LOAD);
        }

        const flattenArr = arr => {
          const ar = [];

          for (const a of arr) for (const s of a) ar.push(s);

          return ar;
        };

        if (strFlag in this.flags) {
          if (typeof wordFlags === 'undefined') {
            const tableItem = this.dictionaryTable[word];

            if (tableItem !== undefined && tableItem !== null) {
              wordFlags = flattenArr(tableItem);
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
    }, {
      key: "suggest",
      value: function suggest(word, limit = 5) {
        if (!this.loaded) {
          throw new Error(this.ERR_NOT_LOAD);
        }

        if (this.memoized.hasOwnProperty(word)) {
          const memoizedLimit = this.memoized[word]['limit'];

          if (limit <= memoizedLimit || this.memoized[word]['suggestions'].length < memoizedLimit) {
            return this.memoized[word]['suggestions'].slice(0, limit);
          }
        }

        if (this.check(word)) return [];

        for (const replacementEntry of this.replacementTable) {
          if (word.indexOf(replacementEntry[0]) !== -1) {
            const correctedWord = word.replace(replacementEntry[0], replacementEntry[1]);

            if (this.check(correctedWord)) {
              return [correctedWord];
            }
          }
        }

        const edits1 = (words, knownOnly = false) => {
          const rv = {};
          let i;
          let j;
          let numLen;
          let numJlen;
          let strEdit;

          if (typeof words === 'string') {
            const wrd = words;
            words = {};
            words[wrd] = 1;
          }

          for (const wrd in words) {
            if (Object.prototype.hasOwnProperty.call(words, wrd)) {
              for (i = 0, numLen = wrd.length + 1; i < numLen; i++) {
                const strSub = [wrd.substring(0, i), wrd.substring(i)];

                if (strSub[1]) {
                  strEdit = strSub[0] + strSub[1].substring(1);

                  if (!knownOnly || this.check(strEdit)) {
                    if (!(strEdit in rv)) {
                      rv[strEdit] = 1;
                    } else {
                      rv[strEdit] += 1;
                    }
                  }
                }

                if (strSub[1].length > 1 && strSub[1][1] !== strSub[1][0]) {
                  strEdit = strSub[0] + strSub[1][1] + strSub[1][0] + strSub[1].substring(2);

                  if (!knownOnly || this.check(strEdit)) {
                    if (!(strEdit in rv)) {
                      rv[strEdit] = 1;
                    } else {
                      rv[strEdit] += 1;
                    }
                  }
                }

                if (strSub[1]) {
                  for (j = 0, numJlen = this.ALPHABET.length; j < numJlen; j++) {
                    if (this.ALPHABET[j] !== strSub[1].substring(0, 1)) {
                      strEdit = strSub[0] + this.ALPHABET[j] + strSub[1].substring(1);

                      if (!knownOnly || this.check(strEdit)) {
                        if (!(strEdit in rv)) {
                          rv[strEdit] = 1;
                        } else {
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
                      } else {
                        rv[strEdit] += 1;
                      }
                    }
                  }
                }
              }
            }
          }

          return rv;
        };

        const correct = wrd => {
          const ed1 = edits1(wrd);
          const ed2 = edits1(ed1, true);
          const weightedCorrections = ed2;

          for (const ed1word in ed1) {
            if (!this.check(ed1word)) {
              continue;
            }

            if (ed1word in weightedCorrections) {
              weightedCorrections[ed1word] += ed1[ed1word];
            } else {
              weightedCorrections[ed1word] = ed1[ed1word];
            }
          }

          let i;
          const sortedCorrections = [];

          for (const j in weightedCorrections) {
            if (weightedCorrections.hasOwnProperty(j)) {
              sortedCorrections.push([j, weightedCorrections[j]]);
            }
          }

          const sorter = (a, b) => {
            const aVal = a[1];
            const bVal = b[1];

            if (aVal < bVal) {
              return -1;
            } else if (aVal > bVal) {
              return 1;
            }

            return b[0].toString().localeCompare(a[0].toString());
          };

          sortedCorrections.sort(sorter).reverse();
          const rv = [];
          let capitalizationScheme = "lowercase";

          if (wrd.toUpperCase() === wrd) {
            capitalizationScheme = "uppercase";
          } else if (wrd.substr(0, 1).toUpperCase() + wrd.substr(1).toLowerCase() === wrd) {
            capitalizationScheme = "capitalized";
          }

          let workingLimit = limit;

          for (i = 0; i < Math.min(workingLimit, sortedCorrections.length); i++) {
            let sortString = sortedCorrections[i][0].toString();
            let update = false;

            if ("uppercase" === capitalizationScheme) {
              sortString = sortString.toUpperCase();
              update = true;
            } else if ("capitalized" === capitalizationScheme) {
              sortString = sortString.substr(0, 1).toUpperCase() + sortString.substr(1);
              update = true;
            }

            if (!this.hasFlag(sortString, "NOSUGGEST") && rv.indexOf(sortString) === -1) {
              rv.push(sortString);
            } else {
              workingLimit++;
            }

            if (update) {
              sortedCorrections[i][0] = sortString;
            }
          }

          return rv;
        };

        this.memoized[word] = {
          'suggestions': correct(word),
          'limit': limit
        };
        return this.memoized[word]['suggestions'];
      }
    }, {
      key: "ready",
      get: function () {
        const doCallBacks = (err, t) => {
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
          this.loaded = true;
          doCallBacks(null, this);
          return this;
        }).catch(err => {
          doCallBacks(err, this);
          throw err;
        });
      }
    }, {
      key: "dictionary",
      get: function () {
        if (this.lDictionary === '') {
          return null;
        }

        return this.lDictionary;
      }
    }]);

    return Typo;
  }();

  if (typeof window !== 'undefined' && window.Typo === undefined) {
    window.Typo = Typo;
  }

}());
//# sourceMappingURL=typo.js.map
