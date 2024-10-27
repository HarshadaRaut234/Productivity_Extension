// Keep track of blocked sites in memory
let blockedSites = new Set();

console.log("Background script running.");

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'startTimer') {
        console.log("Starting the timer for:", message.duration);
        // Store the current active tab URL
        chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
            if (tabs[0]) {
                const url = new URL(tabs[0].url);
                const domain = url.hostname;
                chrome.storage.local.set({ siteToBlock: domain }, () => {
                    console.log('Site to block stored:', domain);
                    chrome.alarms.create('lockSiteAlarm', { delayInMinutes: message.duration });
                    sendResponse({ status: "Timer started" });
                });
            }
        });
        return true; // Keep the message channel open for async response
    }
});

chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === 'lockSiteAlarm') {
        chrome.storage.local.get(['siteToBlock'], function(data) {
            if (data.siteToBlock) {
                blockedSites.add(data.siteToBlock);
                // Redirect current tab if it's the blocked site
                chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
                    if (tabs[0]) {
                        const url = new URL(tabs[0].url);
                        if (url.hostname === data.siteToBlock) {
                            chrome.tabs.update(tabs[0].id, { 
                                url: chrome.runtime.getURL('locked.html') 
                            });
                        }
                    }
                });
                // Create unlock alarm for 24 hours later
                chrome.alarms.create('unlockSiteAlarm', { delayInMinutes: 1440 });
            }
        });
    } else if (alarm.name === 'unlockSiteAlarm') {
        chrome.storage.local.get(['siteToBlock'], function(data) {
            if (data.siteToBlock) {
                blockedSites.delete(data.siteToBlock);
                chrome.storage.local.remove('siteToBlock');
            }
        });
    }
});

// Check all navigation events
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.url) {
        const url = new URL(changeInfo.url);
        if (blockedSites.has(url.hostname)) {
            chrome.tabs.update(tabId, { 
                url: chrome.runtime.getURL('locked.html') 
            });
        }
    }
});

// When the extension is installed or reloaded
chrome.runtime.onInstalled.addListener(() => {
    // Load any previously blocked sites from storage
    chrome.storage.local.get(['siteToBlock'], function(data) {
        if (data.siteToBlock) {
            blockedSites.add(data.siteToBlock);
        }
    });
});
