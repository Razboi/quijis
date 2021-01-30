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
  if (message === "Network.requestWillBeSent") {
    storeRequestData(params.requestId, params.request);
  }
  if (message === "Network.loadingFailed" && params.corsErrorStatus) {
    handleNetworkRequestLoadingFailed(params);
  }
  if (message === "Network.responseReceived") {
    handleNetworkResponseReceived(currentTabId, params);
  }
}

const storeRequestData = (requestId, requestData) => {
  chrome.storage.sync.set({ [requestId]: JSON.stringify(requestData) });
}

const handleNetworkRequestLoadingFailed = (params) => {
  getRequestData(params.requestId)
    .then(requestData => {
      const failedRequestData = {
        url: requestData.url,
        corsError: params.corsErrorStatus.corsError,
        requestMethod: requestData.method,
        requestHeaders: requestData.headers,
        requestBody: requestData.hasPostData ? requestData.postData : null
      };
      saveFailedNetworkRequest(failedRequestData);
    })
    .catch((error) => console.error(error));
}

const handleNetworkResponseReceived = (currentTabId, params) => {
  const httpErrorCodesRegex = /[45][0-9]{2}/;
  const responseCode = params.response ? params.response.status : null;

  if (httpErrorCodesRegex.test(responseCode)) {
    Promise.all([getResponseBody(currentTabId, params.requestId), getRequestData(params.requestId)])
      .then(responses => {
        const failedRequestData = {
          url: responses[1].url,
          status: responseCode,
          requestMethod: responses[1].method,
          requestHeaders: responses[1].headers,
          requestBody: responses[1].hasPostData ? responses[1].postData : null,
          responseHeaders: params.response.headers,
          responseBody: responses[0]
        };
        saveFailedNetworkRequest(failedRequestData);
      })
      .catch(error => console.error(error));
  }
}

const getRequestData = (requestId) => {
  return new Promise(resolve => {
    chrome.storage.sync.get([requestId], (data) => {
      resolve(data ? JSON.parse(data[requestId]) : null);
      chrome.storage.sync.remove(requestId);
    });
  });
}

const saveFailedNetworkRequest = (failedRequestData) => {
  Object.entries(failedRequestData).forEach(([key, value]) => {
    if (value === null || value === undefined) {
      delete failedRequestData[key];
    }
  });
  chrome.storage.sync.get(["failedNetworkRequests"], ({ failedNetworkRequests }) => {
    failedNetworkRequests.push(JSON.stringify(failedRequestData));
    chrome.storage.sync.set({ failedNetworkRequests: failedNetworkRequests });
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