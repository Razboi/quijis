import isJiraUrlValid from '../../lib/isJiraUrlValid';

const backIcon = document.getElementById('backIcon');
const saveButton = document.getElementById('saveButton');
const urlInput = document.getElementById('urlInput');
const formAlert = document.getElementById('formAlert');
const videoCheck = document.getElementById('videoCheck');
const unhandledErrorsCheck = document.getElementById('unhandledErrorsCheck');
const networkErrorsCheck = document.getElementById('networkErrorsCheck');
const consoleErrorsCheck = document.getElementById('consoleErrorsCheck');
const consoleWarningsCheck = document.getElementById('consoleWarningsCheck');

const initializeUI = () => {
  chrome.storage.sync.get(
    ['url', 'recordVideo', 'recordUnhandledErrors', 'recordNetworkErrors', 'recordConsoleErrors', 'recordConsoleWarnings'],
    ({
      url, recordVideo, recordUnhandledErrors, recordNetworkErrors,
      recordConsoleErrors, recordConsoleWarnings,
    }) => {
      urlInput.value = url;
      videoCheck.checked = recordVideo;
      unhandledErrorsCheck.checked = recordUnhandledErrors;
      networkErrorsCheck.checked = recordNetworkErrors;
      consoleErrorsCheck.checked = recordConsoleErrors;
      consoleWarningsCheck.checked = recordConsoleWarnings;
    },
  );
};

backIcon.onclick = () => {
  window.location.href = '../main/main.html';
};

saveButton.onclick = () => {
  isJiraUrlValid(urlInput.value).then(({ isValid, projects }) => {
    if (isValid) {
      formAlert.innerHTML = '';
      chrome.storage.sync.set({
        url: urlInput.value,
        projects,
        recordVideo: videoCheck.checked,
        recordUnhandledErrors: unhandledErrorsCheck.checked,
        recordNetworkErrors: networkErrorsCheck.checked,
        recordConsoleErrors: consoleErrorsCheck.checked,
        recordConsoleWarnings: consoleWarningsCheck.checked,
      });
    } else {
      formAlert.innerHTML = 'Invalid URL';
    }
  });
};

initializeUI();
