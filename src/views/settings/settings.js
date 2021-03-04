import isJiraUrlValid from '../../lib/isJiraUrlValid.js';

const backIcon = document.getElementById('backIcon');
const saveButton = document.getElementById('saveButton');
const urlInput = document.getElementById('urlInput');
const formAlert = document.getElementById('formAlert');
const videoCheck = document.getElementById('videoCheck');
const unhandledErrorsCheck = document.getElementById('unhandledErrorsCheck');
const networkErrorsCheck = document.getElementById('networkErrorsCheck');
const consoleErrorsCheck = document.getElementById('consoleErrorsCheck');
const consoleWarningsCheck = document.getElementById('consoleWarningsCheck');

const loadDataIntoUi = () => {
  chrome.storage.sync.get(['url', 'permissions'], ({ url, permissions }) => {
    urlInput.value = url;
    videoCheck.checked = permissions.recordVideo;
    unhandledErrorsCheck.checked = permissions.recordUnhandledErrors;
    networkErrorsCheck.checked = permissions.recordNetworkErrors;
    consoleErrorsCheck.checked = permissions.recordConsoleErrors;
    consoleWarningsCheck.checked = permissions.recordConsoleWarnings;
  });
};

backIcon.onclick = () => {
  window.location.href = '../main/main.html';
};

saveButton.onclick = () => {
  isJiraUrlValid(urlInput.value).then(({ isValid, projects }) => {
    if (isValid) {
      formAlert.innerHTML = '';
      chrome.storage.sync.set({
        jiraUrl: urlInput.value,
        projects,
        permissions: {
          recordVideo: videoCheck.checked,
          recordUnhandledErrors: unhandledErrorsCheck.checked,
          recordNetworkErrors: networkErrorsCheck.checked,
          recordConsoleErrors: consoleErrorsCheck.checked,
          recordConsoleWarnings: consoleWarningsCheck.checked,
        },
      });
    } else {
      formAlert.innerHTML = 'Invalid URL';
    }
  });
};

loadDataIntoUi();
