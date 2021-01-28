chrome.declarativeContent.onPageChanged.removeRules(undefined, () => {
  chrome.declarativeContent.onPageChanged.addRules([{
    conditions: [new chrome.declarativeContent.PageStateMatcher()],
    actions: [new chrome.declarativeContent.ShowPageAction()]
  }]);
});

const handleNetworkEvent = (currentTabId, debuggeeId, message, params) => {
  // chrome.storage.sync.get(["networkErrors"], ({ networkErrors }) => {
  //   networkErrors.push(JSON.stringify(error));
  //   chrome.storage.sync.set({ networkErrors: networkErrors });
  // });
  // TODO: Filter errors and store them
  if (message === "Network.responseReceived" && params.type === "XHR") {
    chrome.debugger.sendCommand({ tabId: currentTabId }, "Network.getResponseBody", { "requestId": params.requestId }, (response) => {
      if (response) {
        console.log(response.base64Encoded ? console.log(response.body) : JSON.parse(response.body));
      }
    });
  }
}

const startRecordingNetworkEvents = () => {
  chrome.storage.sync.set({ networkErrors: [] });

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const currentTabId = tabs[0].id;

    chrome.debugger.attach({ tabId: currentTabId }, "1.0", () => {
      // TODO: Handle error attaching debugger
      if (chrome.runtime.lastError) {
        alert(chrome.runtime.lastError.message);
        return;
      }
      chrome.debugger.sendCommand({ tabId: currentTabId }, "Network.enable");
      chrome.debugger.onEvent.addListener((...params) => handleNetworkEvent(currentTabId, ...params));
    });
  })
}

const stopRecordingNetworkEvents = () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const currentTabId = tabs[0].id;
    chrome.debugger.detach({ tabId: currentTabId });
  });
}

chrome.runtime.onMessage.addListener((message) => {
  if (message == "startRecordingNetworkEvents") {
    startRecordingNetworkEvents();
  } else if (message == "stopRecordingNetworkEvents") {
    stopRecordingNetworkEvents();
  }
});
