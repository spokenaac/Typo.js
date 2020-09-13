var DIC_DIR = "dictionaries";
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