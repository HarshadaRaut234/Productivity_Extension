// List of ad URLs (simplified version)
const adBlockList = [
  "*://*.doubleclick.net/*",
  "*://*.adnetwork.com/*",
  "*://*.adsrv.com/*",
  "*://*.googlesyndication.com/*",
];

// Block requests matching the ad block list
chrome.webRequest.onBeforeRequest.addListener(
  (details) => ({ cancel: true }),
  { urls: adBlockList },
  ["blocking"]
);
