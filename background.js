chrome.declarativeContent.onPageChanged.removeRules(undefined, () => {
  chrome.declarativeContent.onPageChanged.addRules([{
    conditions: [new chrome.declarativeContent.PageStateMatcher()],
    actions: [new chrome.declarativeContent.ShowPageAction()]
  }]);
});

chrome.runtime.onMessage.addListener((message) => {
  if (message == "startRecordingNetworkEvents") {
    startRecordingNetworkEvents();
  } else if (message == "stopRecordingNetworkEvents") {
    stopRecordingNetworkEvents();
  }
});

const startRecordingNetworkEvents = () => {
  chrome.storage.sync.set({ failedNetworkRequests: [] });

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

const handleNetworkEvent = (currentTabId, debuggeeId, message, params) => {
  if (params.type !== "XHR") {
    return;
  }
  if (message === "Network.loadingFailed" && params.corsErrorStatus) {
    handleNetworkRequestLoadingFailed(currentTabId, params);
  }
  if (message === "Network.responseReceived") {
    handleNetworkResponseReceived(currentTabId, params);
  }
}

// TODO: Get url
const handleNetworkRequestLoadingFailed = (currentTabId, params) => {
  getRequestPostData(currentTabId, params.requestId)
    .then(requestPostData => {
      const failedRequestData = {
        url: "",
        requestBody: requestPostData,
        error: `CORS error: ${params.corsErrorStatus.corsError}`
      };
      saveFailedNetworkRequests(failedRequestData);
    })
    .catch((error) => console.error(error));
}

// TODO: Get requestHeaders
const handleNetworkResponseReceived = (currentTabId, params) => {
  const httpErrorCodesRegex = /[45][0-9]{2}/;
  const responseCode = params.response ? params.response.status : null;

  if (httpErrorCodesRegex.test(responseCode)) {
    Promise.all([getResponseBody(currentTabId, params.requestId), getRequestPostData(currentTabId, params.requestId)])
      .then(responses => {
        const failedRequestData = {
          url: params.response.url,
          status: params.response.status,
          requestBody: responses[1],
          requestHeaders: "",
          responseBody: responses[0],
          responseHeaders: params.response.headers,
        };
        saveFailedNetworkRequests(failedRequestData);
      })
      .catch(error => console.error(error));
  }
}

const saveFailedNetworkRequests = (failedRequestData) => {
  chrome.storage.sync.get(["failedNetworkRequests"], ({ failedNetworkRequests }) => {
    failedNetworkRequests.push(JSON.stringify(failedRequestData));
    chrome.storage.sync.set({ failedNetworkRequests: failedNetworkRequests });
  });
}

const getRequestPostData = (tabId, requestId) => {
  return new Promise(resolve => {
    chrome.debugger.sendCommand({ tabId: tabId }, "Network.getRequestPostData", { "requestId": requestId }, (response) => {
      resolve(response ? JSON.parse(response.postData) : null);
    });
  });
}

const getResponseBody = (tabId, requestId) => {
  return new Promise(resolve => {
    chrome.debugger.sendCommand({ tabId: tabId }, "Network.getResponseBody", { "requestId": requestId }, (response) => {
      if (response) {
        return resolve(response.base64Encoded ? response.body : JSON.parse(response.body));
      }
      resolve(null);
    });
  });
}