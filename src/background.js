chrome.declarativeContent.onPageChanged.removeRules(undefined, () => {
  chrome.declarativeContent.onPageChanged.addRules([{
    conditions: [new chrome.declarativeContent.PageStateMatcher()],
    actions: [new chrome.declarativeContent.ShowPageAction()],
  }]);
});

const handleStreamDataAvailable = (event) => {
  if (navigator.streamChunks) {
    navigator.streamChunks.push(event.data);
  }
};

const startRecordingScreen = () => {
  chrome.storage.sync.remove('recordingUrl');
  chrome.desktopCapture.chooseDesktopMedia(['screen'], (streamId) => {
    navigator.mediaDevices.getUserMedia({
      video: {
        mandatory: {
          chromeMediaSource: 'desktop',
          chromeMediaSourceId: streamId,
        },
      },
    }).then((stream) => {
      navigator.stream = stream;
      navigator.streamChunks = [];
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
      mediaRecorder.ondataavailable = handleStreamDataAvailable;
      mediaRecorder.start(500);
    });
  });
};

const saveFailedNetworkRequest = (failedRequestData) => {
  const sanitizedFailedRequestData = failedRequestData;
  Object.entries(sanitizedFailedRequestData).forEach(([key, value]) => {
    if (value === null || value === undefined) {
      delete sanitizedFailedRequestData[key];
    }
  });
  chrome.storage.sync.get(['failedNetworkRequests'], ({ failedNetworkRequests }) => {
    failedNetworkRequests.push(JSON.stringify(sanitizedFailedRequestData));
    chrome.storage.sync.set({ failedNetworkRequests });
  });
};

const getRequestData = (requestId) => new Promise((resolve) => {
  chrome.storage.sync.get([requestId], (data) => {
    resolve(data ? JSON.parse(data[requestId]) : null);
    chrome.storage.sync.remove(requestId);
  });
});

const handleNetworkRequestLoadingFailed = (params) => {
  getRequestData(params.requestId)
    .then((requestData) => {
      const failedRequestData = {
        url: requestData.url,
        corsError: params.corsErrorStatus.corsError,
        requestMethod: requestData.method,
        requestHeaders: requestData.headers,
        requestBody: requestData.hasPostData ? requestData.postData : null,
      };
      saveFailedNetworkRequest(failedRequestData);
    });
};

const storeRequestData = (requestId, requestData) => {
  chrome.storage.sync.set({ [requestId]: JSON.stringify(requestData) });
};

const getResponseBody = (requestId) => new Promise((resolve) => {
  chrome.storage.sync.get('recordedTabId', ({ recordedTabId }) => {
    chrome.debugger.sendCommand({ tabId: recordedTabId }, 'Network.getResponseBody', { requestId }, (response) => {
      if (response) {
        return resolve(response.base64Encoded ? response.body : JSON.parse(response.body));
      }
      return resolve(null);
    });
  });
});

const handleNetworkResponseReceived = (params) => {
  const httpErrorCodesRegex = /[45][0-9]{2}/;
  const responseCode = params.response ? params.response.status : null;

  if (httpErrorCodesRegex.test(responseCode)) {
    Promise.all([getResponseBody(params.requestId), getRequestData(params.requestId)])
      .then((responses) => {
        const failedRequestData = {
          url: responses[1].url,
          status: responseCode,
          requestMethod: responses[1].method,
          requestHeaders: responses[1].headers,
          requestBody: responses[1].hasPostData ? responses[1].postData : null,
          responseHeaders: params.response.headers,
          responseBody: responses[0],
        };
        saveFailedNetworkRequest(failedRequestData);
      });
  }
};

const handleNetworkEvent = (message, params) => {
  chrome.storage.sync.get(['recordNetworkErrors'], ({ recordNetworkErrors }) => {
    if (!recordNetworkErrors || params.type !== 'XHR') {
      return;
    }
    if (message === 'Network.requestWillBeSent') {
      storeRequestData(params.requestId, params.request);
    }
    if (message === 'Network.loadingFailed' && params.corsErrorStatus) {
      handleNetworkRequestLoadingFailed(params);
    }
    if (message === 'Network.responseReceived') {
      handleNetworkResponseReceived(params);
    }
  });
};

const storeConsoleEvent = (eventParams) => {
  const errorTypeToStorageKeyMap = {
    error: 'consoleErrors',
    warning: 'consoleWarnings',
  };
  const storageKey = errorTypeToStorageKeyMap[eventParams.type];
  chrome.storage.sync.get(storageKey, (data) => {
    data[storageKey].push(eventParams.args[0].description || eventParams.args[0].value);
    chrome.storage.sync.set({ [storageKey]: data[storageKey] });
  });
};

const getErrorTypeToRecordingPermissionMap = () => {
  const errorTypeToRecordingPermissionMap = {};
  chrome.storage.sync.get(['recordConsoleErrors', 'recordConsoleWarnings'], ({ recordConsoleErrors, recordConsoleWarnings }) => {
    errorTypeToRecordingPermissionMap.error = recordConsoleErrors;
    errorTypeToRecordingPermissionMap.warning = recordConsoleWarnings;
  });
  return errorTypeToRecordingPermissionMap;
};

const handleRuntimeEvent = (message, params) => {
  if (message === 'Runtime.consoleAPICalled' && (params.type === 'error' || params.type === 'warning')) {
    const errorTypeToRecordingPermissionMap = getErrorTypeToRecordingPermissionMap();
    const isEventRecordingPermitted = errorTypeToRecordingPermissionMap[params.type];
    if (isEventRecordingPermitted) {
      storeConsoleEvent(params);
    }
  }
  if (message === 'Runtime.exceptionThrown') {
    chrome.storage.sync.get(['unhandledErrors', 'recordUnhandledErrors'], ({ unhandledErrors, recordUnhandledErrors }) => {
      if (recordUnhandledErrors) {
        unhandledErrors.push(params.exceptionDetails.exception.description);
        chrome.storage.sync.set({ unhandledErrors });
      }
    });
  }
};

const handleEvent = (debuggeeId, message, params) => {
  const eventType = message.split('.')[0];
  if (eventType === 'Network') {
    handleNetworkEvent(message, params);
  }
  if (eventType === 'Runtime') {
    handleRuntimeEvent(message, params);
  }
};

const startRecordingEvents = () => {
  chrome.storage.sync.remove('recordedTabId');
  chrome.storage.sync.set({
    unhandledErrors: [], consoleErrors: [], consoleWarnings: [], failedNetworkRequests: [],
  });
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const currentTabId = tabs[0].id;
    chrome.debugger.attach({ tabId: currentTabId }, '1.0', () => {
      chrome.storage.sync.get('permissions', ({ permissions }) => {
        if (permissions.recordVideo) {
          startRecordingScreen();
        }
        chrome.debugger.sendCommand({ tabId: currentTabId }, 'Network.enable');
        chrome.debugger.sendCommand({ tabId: currentTabId }, 'Runtime.discardConsoleEntries');
        chrome.debugger.sendCommand({ tabId: currentTabId }, 'Runtime.enable');
        chrome.debugger.onEvent.addListener(handleEvent);
        chrome.storage.sync.set({ recordedTabId: currentTabId });
      });
    });
  });
};

const stopRecordingScreen = () => {
  if (navigator.streamChunks) {
    const recordingBlob = new Blob(navigator.streamChunks);
    const recordingUrl = URL.createObjectURL(recordingBlob, { type: 'video/webm' });
    chrome.storage.sync.set({ recordingUrl });
    delete navigator.streamChunks;
  }
  if (navigator.stream) {
    navigator.stream.getTracks().forEach((track) => track.stop());
    delete navigator.stream;
  }
};

const stopRecordingEvents = () => {
  stopRecordingScreen();
  chrome.debugger.onEvent.removeListener(handleEvent);
  chrome.storage.sync.get('recordedTabId', ({ recordedTabId }) => {
    chrome.debugger.detach({ tabId: recordedTabId });
  });
};

chrome.runtime.onMessage.addListener((message) => {
  if (message === 'startRecordingEvents') {
    startRecordingEvents();
  } else if (message === 'stopRecordingEvents') {
    stopRecordingEvents();
  }
});

const listAndStoreProjects = () => {
  chrome.storage.sync.get('jiraUrl', ({ jiraUrl }) => {
    const xmlhttp = new XMLHttpRequest();
    xmlhttp.open('GET', `${jiraUrl}/rest/api/2/project`, true);
    xmlhttp.onreadystatechange = function handleStateChange() {
      if (xmlhttp.readyState === 4) {
        chrome.storage.sync.set({ projects: xmlhttp.responseText });
      }
    };
    xmlhttp.send();
  });
};

listAndStoreProjects();
