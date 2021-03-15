import isJiraUrlValid from '../../lib/isJiraUrlValid.js';

const formButton = document.getElementsByClassName('form__button')[0];
const formUrlInput = document.getElementsByClassName('form__url-input')[0];
const formAlert = document.getElementsByClassName('form__alert')[0];

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
    window.location.href = '../record/record.html';
  });
};

formButton.onclick = () => {
  isJiraUrlValid(formUrlInput.value).then(({ isValid, projects }) => {
    if (isValid) {
      formAlert.innerHTML = '';
      setInitialConfigurationAndRedirect(formUrlInput.value, projects);
    } else {
      formAlert.innerHTML = 'Invalid URL';
    }
  });
};
