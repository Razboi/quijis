import ui from './ui.js';
import issuesService from '../../services/issues.js';

const FORM_PROJECTS_SELECTOR_CLASS = 'form__projects-selector';
const LOG_RECORD_BUTTON_CLASS = 'log__record-button';
const LOG_EVENTS_DIV_CLASS = 'log__events';
const LOG_VIDEO_STATUS_DIV_CLASS = 'log__video-status';

const layoutSettingsIcon = document.getElementsByClassName('layout__settings-icon')[0];
const formProjectsSelector = document.getElementsByClassName(FORM_PROJECTS_SELECTOR_CLASS)[0];
const formTypeSelector = document.getElementsByClassName('form__type-selector')[0];
const formTitleInput = document.getElementsByClassName('form__title-input')[0];
const formDescriptionInput = document.getElementsByClassName('form__description-input')[0];
const formCreateButton = document.getElementsByClassName('form__button')[0];
const logRecordButton = document.getElementsByClassName(LOG_RECORD_BUTTON_CLASS)[0];

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
  let description = formDescriptionInput.value;
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
        key: formProjectsSelector.value,
      },
      summary: formTitleInput.value,
      description,
      issuetype: {
        name: formTypeSelector.value,
      },
    },
  };
  const response = await issuesService.createIssue(jiraUrl, body);
  const parsedResponse = JSON.parse(response);
  if (recordingUrl) {
    const recordingBlob = await fetch(recordingUrl).then((r) => r.blob());
    await issuesService.attachRecordingToIssue(jiraUrl, parsedResponse.key, recordingBlob);
  }
  formDescriptionInput.value = '';
  formTitleInput.value = '';
  chrome.storage.sync.remove(
    ['unhandledErrors', 'failedNetworkRequests', 'consoleErrors', 'consoleWarnings', 'recordingUrl'],
    () => ui.loadDataIntoUi(
      FORM_PROJECTS_SELECTOR_CLASS,
      LOG_RECORD_BUTTON_CLASS,
      LOG_EVENTS_DIV_CLASS,
      LOG_VIDEO_STATUS_DIV_CLASS,
    ),
  );
};

const handleRecord = ({ isRecording }) => {
  if (!isRecording) {
    sendMessageToBackground('startRecordingEvents');
  } else {
    sendMessageToBackground('stopRecordingEvents');
  }
  ui.loadRecordButtonText(LOG_RECORD_BUTTON_CLASS, !isRecording);
  chrome.storage.sync.set({ isRecording: !isRecording });
  // Timeout is needed in order to wait for the background to generate the recording URL
  setTimeout(() => ui.loadDataIntoUi(
    FORM_PROJECTS_SELECTOR_CLASS,
    LOG_RECORD_BUTTON_CLASS,
    LOG_EVENTS_DIV_CLASS,
    LOG_VIDEO_STATUS_DIV_CLASS,
  ), 100);
};

formCreateButton.onclick = () => {
  chrome.storage.sync.get(['unhandledErrors', 'failedNetworkRequests', 'consoleErrors', 'consoleWarnings', 'jiraUrl', 'recordingUrl'], handleCreation);
};

layoutSettingsIcon.onclick = () => {
  window.location.href = '../settings/settings.html';
};

logRecordButton.onclick = () => {
  chrome.storage.sync.get(['isRecording'], handleRecord);
};

ui.loadDataIntoUi(
  FORM_PROJECTS_SELECTOR_CLASS,
  LOG_RECORD_BUTTON_CLASS,
  LOG_EVENTS_DIV_CLASS,
  LOG_VIDEO_STATUS_DIV_CLASS,
);
