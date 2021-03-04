import ui from './ui.js';
import issuesService from '../../services/issues.js';

const RECORD_BUTTON_ID = 'recordButton';
const PROJECTS_SELECTOR_ID = 'projectsSelector';
const EVENTS_DIV_ID = 'events';
const VIDEO_STATUS_DIV_ID = 'videoStatus';

const settingsIcon = document.getElementById('settingsIcon');
const projectsSelector = document.getElementById('projectsSelector');
const typeSelector = document.getElementById('typeSelector');
const titleInput = document.getElementById('titleInput');
const descriptionInput = document.getElementById('descriptionInput');
const createButton = document.getElementById('createButton');
const recordButton = document.getElementById(RECORD_BUTTON_ID);

const sendMessageToBackground = (message) => {
  chrome.runtime.sendMessage(message);
};

const formatNetworkErrorLog = (failedNetworkRequest) => {
  const keyToHeaderMap = {
    url: 'URL',
    status: 'Status',
    requestMethod: 'Request method',
    requestHeaders: 'Request headers',
    requestBody: 'Request body',
    responseHeaders: 'Response headers',
    responseBody: 'Response body',
    corsError: 'Cors error',
  };
  let networkErrorLog = '\n{quote}';
  Object.entries(failedNetworkRequest).forEach(([key, value]) => {
    const formattedValue = typeof value === 'object' && value !== null ? JSON.stringify(value) : value;
    networkErrorLog += `+${keyToHeaderMap[key]}+: ${formattedValue}\n`;
  });
  networkErrorLog += '{quote}';
  return networkErrorLog;
};

const getDescription = (unhandledErrors, failedNetworkRequests, consoleErrors, consoleWarnings) => {
  let description = descriptionInput.value;
  if (unhandledErrors && unhandledErrors.length) {
    description += `\n\n*Unhandled errors* (flag)${unhandledErrors.map((unhandledError) => `\n{quote}${unhandledError}{quote}`)}`;
  }
  if (failedNetworkRequests && failedNetworkRequests.length) {
    description += `\n\n*Network errors* (flag)${failedNetworkRequests.map((failedNetworkRequest) => formatNetworkErrorLog(JSON.parse(failedNetworkRequest)))}`;
  }
  if (consoleErrors && consoleErrors.length) {
    description += `\n\n*Console errors* (x)${consoleErrors.map((consoleError) => `\n{quote}${consoleError}{quote}`)}`;
  }
  if (consoleWarnings && consoleWarnings.length) {
    description += `\n\n*Console warnings* (!)${consoleWarnings.map((consoleWarning) => `\n{quote}${consoleWarning}{quote}`)}`;
  }
  description += '\n\n_Generated with [Quijis|https://github.com/Razboi/quijis]_';
  return description;
};

const handleCreation = async ({
  unhandledErrors, failedNetworkRequests, consoleErrors, consoleWarnings, jiraUrl, recordingUrl,
}) => {
  const description = getDescription(
    unhandledErrors, failedNetworkRequests, consoleErrors, consoleWarnings,
  );
  const body = {
    fields: {
      project: {
        key: projectsSelector.value,
      },
      summary: titleInput.value,
      description,
      issuetype: {
        name: typeSelector.value,
      },
    },
  };
  const response = await issuesService.createIssue(jiraUrl, body);
  const parsedResponse = JSON.parse(response);
  if (recordingUrl) {
    const recordingBlob = await fetch(recordingUrl).then((r) => r.blob());
    await issuesService.attachRecordingToIssue(jiraUrl, parsedResponse.key, recordingBlob);
  }
  descriptionInput.value = '';
  titleInput.value = '';
  chrome.storage.sync.remove(
    ['unhandledErrors', 'failedNetworkRequests', 'consoleErrors', 'consoleWarnings', 'recordingUrl'],
    () => ui.loadDataIntoUi(
      RECORD_BUTTON_ID, PROJECTS_SELECTOR_ID, EVENTS_DIV_ID, VIDEO_STATUS_DIV_ID,
    ),
  );
};

const handleRecord = ({ isRecording }) => {
  if (!isRecording) {
    sendMessageToBackground('startRecordingEvents');
  } else {
    sendMessageToBackground('stopRecordingEvents');
  }
  ui.loadRecordButtonText(RECORD_BUTTON_ID, !isRecording);
  chrome.storage.sync.set({ isRecording: !isRecording });
  // Timeout is needed in order to wait for the background to generate the recording URL
  setTimeout(() => ui.loadDataIntoUi(
    RECORD_BUTTON_ID, PROJECTS_SELECTOR_ID, EVENTS_DIV_ID, VIDEO_STATUS_DIV_ID,
  ), 100);
};

createButton.onclick = () => {
  chrome.storage.sync.get(['unhandledErrors', 'failedNetworkRequests', 'consoleErrors', 'consoleWarnings', 'jiraUrl', 'recordingUrl'], handleCreation);
};

settingsIcon.onclick = () => {
  window.location.href = '../settings/settings.html';
};

recordButton.onclick = () => {
  chrome.storage.sync.get(['isRecording'], handleRecord);
};

ui.loadDataIntoUi(RECORD_BUTTON_ID, PROJECTS_SELECTOR_ID, EVENTS_DIV_ID, VIDEO_STATUS_DIV_ID);
