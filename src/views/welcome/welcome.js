const isJiraUrlValid = require('../../lib/isJiraUrlValid.js');

const continueButton = document.getElementById('continueButton');
const urlInput = document.getElementById('urlInput');
const formAlert = document.getElementById('formAlert');

continueButton.onclick = () => {
  isJiraUrlValid(urlInput.value).then(({ isValid, projects }) => {
    if (isValid) {
      formAlert.innerHTML = '';
      chrome.storage.sync.set({
        url: urlInput.value,
        projects,
        recordVideo: true,
        recordUnhandledErrors: true,
        recordNetworkErrors: true,
        recordConsoleErrors: true,
        recordConsoleWarnings: true,
      }, () => {
        window.location.href = '../main/main.html';
      });
    } else {
      formAlert.innerHTML = 'Invalid URL';
    }
  });
};
