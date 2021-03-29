import isJiraUrlValid from '../../lib/isJiraUrlValid.js';

const formButton = document.getElementsByClassName('form__button')[0];
const formButtonError = document.getElementsByClassName('form__button-error')[0];
const formUrlInput = document.getElementsByClassName('form__url-input')[0];
const formError = document.getElementsByClassName('form__error')[0];

let isProcessing = false;

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

const handleContinue = () => {
  isProcessing = true;
  formButton.classList.add('is-loading');
  formButtonError.innerHTML = '';
  formButtonError.classList.add('is-hidden');

  isJiraUrlValid(formUrlInput.value)
    .then(({ isValid, projects }) => {
      if (isValid) {
        formUrlInput.classList.remove('is-danger');
        formError.classList.add('is-hidden');
        formError.innerHTML = '';
        setInitialConfigurationAndRedirect(formUrlInput.value, projects);
      } else {
        formUrlInput.classList.add('is-danger');
        formError.classList.remove('is-hidden');
        formError.innerHTML = 'Invalid URL';
      }
    })
    .catch(() => {
      formButtonError.innerHTML = 'There was an unexpected error checking the JIRA URL. Please try again';
      formButtonError.classList.remove('is-hidden');
    })
    .finally(() => {
      isProcessing = false;
      formButton.classList.remove('is-loading');
    });
};

formButton.onclick = () => {
  if (!isProcessing) {
    handleContinue();
  }
};
