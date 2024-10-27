chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'blockSite') {
        console.log("Blocking the site.");

        window.location.href = chrome.runtime.getURL("locked.html");

        sendResponse({status: "Site blocked"});
    }
});
