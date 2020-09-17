function IsChrome() {
  var isOpera = !!window.opera || navigator.userAgent.indexOf(' OPR/') >= 0;
  var isChrome = !!window.chrome && !isOpera;              // Chrome 1+
  return isChrome;
}
var geturl;
if (IsChrome()) {
  // loaded through chrome extension.
  geturl = chrome.runtime.getURL;
} else if (typeof browser !== 'undefined' && typeof browser.runtime !== 'undefined') {
  // non chrome browser extension loading
  geturl = browser.runtime.getURL;
} else {
  geturl = function(url) {
    // should be a regular browser window. Let the browser resolve it
    return url;
  }
}

function fetchPromise(url) {
  return new Promise(function (resolve, reject) {
    fetch(url).then(response => {
      if(!response.ok) {
        reject(new Error(`HTTP error! status: ${response.status}`));
      }
      resolve(response.text());
    });
  });
}

function fetchAndDecode(url, type) {
  // Returning the top level promise, so the result of the entire chain is returned out of the function
  return fetch(url).then(response => {
    // Depending on what type of file is being fetched, use the relevant function to decode its contents
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    } else {
      if (type === 'blob') {
        return response.blob();
      } else if (type === 'text') {
        return response.text();
      }
    }
  })
    .catch(e => {
      console.log(`There has been a problem with your fetch operation for resource "${url}": ` + e.message);
    });
}

/**
 * Get a url for a give dic or aff file
 * @param {string} dic the dictionary language to laad such as en_US
 * @param {string} ext the extension of the file such as aff or dic
 * @returns {string}
 */
function getDicUrl(dic, ext) {
  return geturl(DIC_DIR + "/" + dic + "/" + dic + "." + ext);
}

/**
 * Gets a file as a promise
 * @param {string} url of file to read
 * @returns {Promise<string>}
 */
function getXMLHttpRequestPromise(url) {
  return new Promise(function (resolve, reject) {
    var xhr = new XMLHttpRequest();
    xhr.open("GET", url, true);
    xhr.onload = function () {
      if (this.status >= 200 && this.status < 300) {
        resolve(xhr.responseText);
      } else {
        reject(new Error(xhr.statusText));
      }
    };
    xhr.onerror = function () {
      reject(new Error(xhr.statusText));
    };
    if (xhr.overrideMimeType) {
      xhr.overrideMimeType("text/plain; charset=utf8")
    };
    xhr.send();
  });
}


/**
 * Gets a file as a promise for the dic file
 * @param {string} dic 
 * @param {bolean} [useXmlHttpReqquest=false] if true get promise using XmlHttpRequest;
 * Otherwise get promise using fetch;
 * @returns {Promsie<string>}
 */
function fetchTextDic(dic, useXmlHttpReqquest = false) {
  let url = getDicUrl(dic, 'dic');
  if (useXmlHttpReqquest === true) {
    return getXMLHttpRequestPromise(getDicUrl(dic, 'dic'));
  }
  return fetchPromise(url);
  // return fetchAndDecode(url, 'text');
}

/**
 * Gets a file as a promise for the aff file
 * @param {string} dic
 * @param {bolean} [useXmlHttpReqquest=false] if true get promise using XmlHttpRequest;
 * Otherwise get promise using fetch;
 * @returns {Promsie<string>}
 */
function fetchTextAff(dic, useXmlHttpReqquest = false) {
  let url = getDicUrl(dic, 'aff');
  if (useXmlHttpReqquest === true) {
    return getXMLHttpRequestPromise(getDicUrl(dic, 'aff'));
  }
  return fetchPromise(url);
  //return fetchAndDecode(url, 'text');
}

(function () {

  function getLink(strLink) {
    const link = document.createElement("link");
    link.type = "text/css";
    link.rel = "stylesheet";
    link.href = strLink;
    const attrMedia = document.createAttribute("media");
    attrMedia.value = 'screen';
    link.setAttributeNode(attrMedia);
    return link;
  };
  if (TEST_ORIG === false) {
    const link = 'lib/qunit.orig.css';
    document.getElementsByTagName("head")[0].appendChild(getLink(link));
  }
})();
