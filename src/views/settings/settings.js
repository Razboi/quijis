import isJiraUrlValid from '../../lib/isJiraUrlValid.js';

const formBackIcon = document.getElementsByClassName('layout__back-icon')[0];
const formButton = document.getElementsByClassName('form__button')[0];
const formUrlInput = document.getElementsByClassName('form__url-input')[0];
const formAlert = document.getElementsByClassName('form__alert')[0];
const formVideoCheck = document.getElementsByClassName('form__video-check')[0];
const formUnhandledErrorsCheck = document.getElementsByClassName('form__unhandled-errors-check')[0];
const formNetworkErrorsCheck = document.getElementsByClassName('form__network-errors-check')[0];
const formConsoleErrorsCheck = document.getElementsByClassName('form__console-errors-check')[0];
const formConsoleWarningsCheck = document.getElementsByClassName('form__console-warnings-check')[0];

const loadDataIntoUi = () => {
  chrome.storage.sync.get(['url', 'permissions'], ({ url, permissions }) => {
    formUrlInput.value = url;
    formVideoCheck.checked = permissions.recordVideo;
    formUnhandledErrorsCheck.checked = permissions.recordUnhandledErrors;
    formNetworkErrorsCheck.checked = permissions.recordNetworkErrors;
    formConsoleErrorsCheck.checked = permissions.recordConsoleErrors;
    formConsoleWarningsCheck.checked = permissions.recordConsoleWarnings;
  });
};

formBackIcon.onclick = () => {
  window.location.href = '../main/main.html';
};

formButton.onclick = () => {
  isJiraUrlValid(formUrlInput.value).then(({ isValid, projects }) => {
    if (isValid) {
      formAlert.innerHTML = '';
      chrome.storage.sync.set({
        jiraUrl: formUrlInput.value,
        projects,
        permissions: {
          recordVideo: formVideoCheck.checked,
          recordUnhandledErrors: formUnhandledErrorsCheck.checked,
          recordNetworkErrors: formNetworkErrorsCheck.checked,
          recordConsoleErrors: formConsoleErrorsCheck.checked,
          recordConsoleWarnings: formConsoleWarningsCheck.checked,
        },
      });
    } else {
      formAlert.innerHTML = 'Invalid URL';
    }
  });
};

loadDataIntoUi();
