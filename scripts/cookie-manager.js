// Automatically delete third-party cookies
chrome.cookies.onChanged.addListener((changeInfo) => {
  if (changeInfo.removed || !changeInfo.cookie) return;

  // Check if the cookie is from a third-party
  if (
    !changeInfo.cookie.hostOnly &&
    changeInfo.cookie.domain !== window.location.hostname
  ) {
    chrome.cookies.remove({
      url: changeInfo.cookie.domain,
      name: changeInfo.cookie.name,
    });
    console.log(`Deleted third-party cookie: ${changeInfo.cookie.name}`);
  }
});
