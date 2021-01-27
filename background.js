chrome.declarativeContent.onPageChanged.removeRules(undefined, function () {
  chrome.declarativeContent.onPageChanged.addRules([{
    conditions: [new chrome.declarativeContent.PageStateMatcher()],
    actions: [new chrome.declarativeContent.ShowPageAction()]
  }]);
});

const handleNetworkError = (error) => {
  chrome.storage.sync.get(["networkErrors"], function ({ networkErrors }) {
    networkErrors.push(JSON.stringify(error));
    chrome.storage.sync.set({ networkErrors: networkErrors });
  });
}

const startRecordingNetworkEvents = () => {
  chrome.storage.sync.set({ networkErrors: [] });
  chrome.webRequest.onErrorOccurred.addListener(handleNetworkError, { urls: ["<all_urls>"] });
}

const stopRecordingNetworkEvents = () => {
  chrome.webRequest.onErrorOccurred.removeListener(handleNetworkError);
}

chrome.runtime.onMessage.addListener(function (message) {
  if (message == "startRecordingNetworkEvents") {
    startRecordingNetworkEvents();
  } else if (message == "stopRecordingNetworkEvents") {
    stopRecordingNetworkEvents();
  }
});
