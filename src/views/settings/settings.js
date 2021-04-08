import isJiraUrlValid from '../../lib/isJiraUrlValid.js';

const formButton = document.getElementsByClassName('form__button')[0];
const formButtonError = document.getElementsByClassName('form__button-error')[0];
const formUrlInput = document.getElementsByClassName('form__url-input')[0];
const formError = document.getElementsByClassName('form__error')[0];
const formVideoCheck = document.getElementsByClassName('form__video-check')[0];
const formUnhandledErrorsCheck = document.getElementsByClassName('form__unhandled-errors-check')[0];
const formNetworkErrorsCheck = document.getElementsByClassName('form__network-errors-check')[0];
const formConsoleErrorsCheck = document.getElementsByClassName('form__console-errors-check')[0];
const formConsoleWarningsCheck = document.getElementsByClassName('form__console-warnings-check')[0];
const tabCreate = document.getElementsByClassName('tabs__create')[0];
const tabRecord = document.getElementsByClassName('tabs__record')[0];

let isProcessing = false;

const loadDataIntoUi = () => {
  chrome.storage.sync.get(['jiraUrl', 'permissions'], ({ jiraUrl, permissions }) => {
    formUrlInput.value = jiraUrl;
    formVideoCheck.checked = permissions.recordVideo;
    formUnhandledErrorsCheck.checked = permissions.recordUnhandledErrors;
    formNetworkErrorsCheck.checked = permissions.recordNetworkErrors;
    formConsoleErrorsCheck.checked = permissions.recordConsoleErrors;
    formConsoleWarningsCheck.checked = permissions.recordConsoleWarnings;
  });
};

const handleSave = () => {
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

tabRecord.onclick = () => {
  window.location.href = '../record/record.html';
};

tabCreate.onclick = () => {
  window.location.href = '../create/create.html';
};

formButton.onclick = () => {
  if (!isProcessing) {
    handleSave();
  }
};

loadDataIntoUi();
