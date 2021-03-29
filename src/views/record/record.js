import ui from './ui.js';

const LOG_RECORD_ICON_CLASS = 'log__record-icon';
const LOG_EVENTS_DIV_CLASS = 'log__events';
const LOG_VIDEO_STATUS_DIV_CLASS = 'log__video-status';

const logRecordIcon = document.getElementsByClassName(LOG_RECORD_ICON_CLASS)[0];
const logClearButton = document.getElementsByClassName('log__clear-button')[0];
const tabCreate = document.getElementsByClassName('tabs__create')[0];
const tabSettings = document.getElementsByClassName('tabs__settings')[0];

const sendMessageToBackground = (message) => {
  chrome.runtime.sendMessage(message);
};

const handleRecord = ({ isRecording }) => {
  if (!isRecording) {
    sendMessageToBackground('startRecordingEvents');
  } else {
    sendMessageToBackground('stopRecordingEvents');
  }
  ui.loadRecordIcon(LOG_RECORD_ICON_CLASS, !isRecording);
  chrome.storage.sync.set({ isRecording: !isRecording });
  // Timeout is needed in order to wait for the background to generate the recording URL
  setTimeout(() => ui.loadDataIntoUi(
    LOG_RECORD_ICON_CLASS,
    LOG_EVENTS_DIV_CLASS,
    LOG_VIDEO_STATUS_DIV_CLASS,
  ), 100);
};

const handleClearLog = () => {
  chrome.storage.sync.set({
    unhandledErrors: [], consoleErrors: [], consoleWarnings: [], failedNetworkRequests: [],
  });
  chrome.storage.sync.remove('recordingUrl');
  logClearButton.classList.add('is-hidden');
  ui.loadDataIntoUi(
    LOG_RECORD_ICON_CLASS,
    LOG_EVENTS_DIV_CLASS,
    LOG_VIDEO_STATUS_DIV_CLASS,
  );
};

tabSettings.onclick = () => {
  window.location.href = '../settings/settings.html';
};

tabCreate.onclick = () => {
  window.location.href = '../create/create.html';
};

logRecordIcon.onclick = () => {
  chrome.storage.sync.get(['isRecording'], handleRecord);
};

logClearButton.onclick = () => {
  handleClearLog();
};

ui.loadDataIntoUi(
  LOG_RECORD_ICON_CLASS,
  LOG_EVENTS_DIV_CLASS,
  LOG_VIDEO_STATUS_DIV_CLASS,
);
