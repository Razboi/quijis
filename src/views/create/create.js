import ui from './ui.js';
import issuesService from '../../services/issues.js';

const FORM_PROJECTS_SELECTOR_CLASS = 'form__projects-selector';

const formProjectsSelector = document.getElementsByClassName(FORM_PROJECTS_SELECTOR_CLASS)[0];
const formTypeSelector = document.getElementsByClassName('form__type-selector')[0];
const formEpicField = document.getElementsByClassName('form__epic-field')[0];
const formEpicInput = document.getElementsByClassName('form__epic-input')[0];
const formEpicError = document.getElementsByClassName('form__epic-error')[0];
const formTitleInput = document.getElementsByClassName('form__title-input')[0];
const formTitleError = document.getElementsByClassName('form__title-error')[0];
const formDescriptionInput = document.getElementsByClassName('form__description-input')[0];
const formCreateButton = document.getElementsByClassName('form__button')[0];
const formHelperError = document.getElementsByClassName('form__helper-error')[0];
const formHelperSuccess = document.getElementsByClassName('form__helper-success')[0];
const tabRecord = document.getElementsByClassName('tabs__record')[0];
const tabSettings = document.getElementsByClassName('tabs__settings')[0];

let isProcessing = false;

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

const getCreationBody = ({
  unhandledErrors, failedNetworkRequests, consoleErrors, consoleWarnings,
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
  if (formTypeSelector.value === 'Epic') {
    body.fields.customfield_10011 = formEpicInput.value;
  }
  return body;
};

const makeIssueCreationRequest = async ({ jiraUrl, body, recordingUrl }) => {
  const response = await issuesService.createIssue(jiraUrl, body);
  const parsedResponse = JSON.parse(response);
  if (recordingUrl) {
    const recordingBlob = await fetch(recordingUrl).then((r) => r.blob());
    await issuesService.attachRecordingToIssue(jiraUrl, parsedResponse.key, recordingBlob);
  }
  return parsedResponse;
};

const prepareIssueCreation = () => {
  isProcessing = true;
  formHelperError.innerHTML = '';
  formHelperError.classList.add('is-hidden');
  formHelperSuccess.innerHTML = '';
  formHelperSuccess.classList.add('is-hidden');
  formCreateButton.classList.add('is-loading');
};

const handleSuccessfulCreation = ({ response, jiraUrl }) => {
  isProcessing = false;
  formCreateButton.classList.remove('is-loading');

  formDescriptionInput.value = '';
  formEpicInput.value = '';
  formTitleInput.value = '';

  const linkToIssueHtml = `<a href="${jiraUrl}browse/${response.key}" target="_blank">${response.key}</a>`;
  formHelperSuccess.innerHTML = `Issue <b>${linkToIssueHtml}</b> successfully created`;
  formHelperSuccess.classList.remove('is-hidden');

  chrome.storage.sync.remove(
    ['unhandledErrors', 'failedNetworkRequests', 'consoleErrors', 'consoleWarnings', 'recordingUrl'],
    () => ui.loadDataIntoUi(FORM_PROJECTS_SELECTOR_CLASS),
  );
};

const handleCreation = async ({
  unhandledErrors, failedNetworkRequests, consoleErrors, consoleWarnings, jiraUrl, recordingUrl,
}) => {
  prepareIssueCreation();

  const body = getCreationBody({
    unhandledErrors, failedNetworkRequests, consoleErrors, consoleWarnings,
  });

  makeIssueCreationRequest({ jiraUrl, body, recordingUrl })
    .then((response) => handleSuccessfulCreation({ response, jiraUrl }))
    .catch(() => {
      formHelperError.innerHTML = 'There was an unexpected error creating the issue. Please try again';
      formHelperError.classList.remove('is-hidden');
    });
};

// TODO: REFACTOR
const checkFormIsValid = () => {
  let isValid = true;
  formTitleInput.classList.remove('is-danger');
  formTitleError.classList.add('is-hidden');
  formTitleError.innerHTML = '';
  formEpicInput.classList.remove('is-danger');
  formEpicError.classList.add('is-hidden');
  formEpicInput.innerHTML = '';
  if (!formTitleInput.value) {
    isValid = false;
    formTitleError.innerHTML = 'Summary is required';
    formTitleError.classList.remove('is-hidden');
    formTitleInput.classList.add('is-danger');
  }
  if (formTypeSelector.value === 'Epic' && !formEpicInput.value) {
    isValid = false;
    formEpicError.innerHTML = 'Epic name is required';
    formEpicError.classList.remove('is-hidden');
    formEpicInput.classList.add('is-danger');
  }
  return isValid;
};

formCreateButton.onclick = () => {
  const isFormValid = checkFormIsValid();
  if (isFormValid && !isProcessing) {
    chrome.storage.sync.get(['unhandledErrors', 'failedNetworkRequests', 'consoleErrors', 'consoleWarnings', 'jiraUrl', 'recordingUrl'], handleCreation);
  }
};

formTypeSelector.onchange = (event) => {
  if (event.target.value === 'Epic') {
    formEpicField.classList.remove('is-hidden');
  } else {
    formEpicField.classList.add('is-hidden');
  }
};

tabSettings.onclick = () => {
  window.location.href = '../settings/settings.html';
};

tabRecord.onclick = () => {
  window.location.href = '../record/record.html';
};

ui.loadDataIntoUi(FORM_PROJECTS_SELECTOR_CLASS);
