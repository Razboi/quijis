const isJiraUrlValid = require('../../lib/isJiraUrlValid.js');

const continueButton = document.getElementById('continueButton');
const urlInput = document.getElementById('urlInput');
const formAlert = document.getElementById('formAlert');

const setInitialConfigurationAndRedirect = (jiraUrl, jiraProjects) => {
  const defaultPermissions = {
    recordVideo: true,
    recordUnhandledErrors: true,
    recordNetworkErrors: true,
    recordConsoleErrors: true,
    recordConsoleWarnings: true,
  };
  chrome.storage.sync.set({
    jiraUrl,
    projects: jiraProjects,
    permissions: defaultPermissions,
  }, () => {
    window.location.href = '../main/main.html';
  });
};

continueButton.onclick = () => {
  isJiraUrlValid(urlInput.value).then(({ isValid, projects }) => {
    if (isValid) {
      formAlert.innerHTML = '';
      setInitialConfigurationAndRedirect(urlInput.value, projects);
    } else {
      formAlert.innerHTML = 'Invalid URL';
    }
  });
};
