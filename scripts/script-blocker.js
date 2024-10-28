// Block specific scripts from running
const blockedScripts = ["*://*.tracking-script.com/*", "*://*.analytics.js"];

chrome.webRequest.onBeforeRequest.addListener(
  (details) => {
    console.log("Blocked script: " + details.url);
    return { cancel: true };
  },
  { urls: blockedScripts },
  ["blocking"]
);
