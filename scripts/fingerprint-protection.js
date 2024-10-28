// Overwrite or mask certain fingerprintable properties
(function () {
  const fakeCanvasFingerprint = document.createElement("canvas");
  const fakeContext = fakeCanvasFingerprint.getContext("2d");

  const originalGetImageData = fakeContext.getImageData;

  fakeContext.getImageData = function (x, y, width, height) {
    console.log("Blocked canvas fingerprinting attempt.");
    return originalGetImageData.call(this, x, y, width, height);
  };

  // Mask user agent string
  Object.defineProperty(navigator, "userAgent", {
    get: function () {
      return "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0";
    },
  });
})();
