const getEventCount = (errors, text) => {
  const eventsCountClass = errors?.length ? 'log__count error' : 'log__count';
  return `<div class="${eventsCountClass}">${errors?.length || 0} ${text}</div>`;
};

const getEventsHtml = (data, hasErrors) => {
  let eventsHtml = '';
  if (data.permissions.recordUnhandledErrors) {
    eventsHtml += getEventCount(data.unhandledErrors, 'unhandled errors');
  }
  if (data.permissions.recordNetworkErrors) {
    eventsHtml += getEventCount(data.failedNetworkRequests, 'network errors');
  }
  if (data.permissions.recordConsoleErrors) {
    eventsHtml += getEventCount(data.consoleErrors, 'console errors');
  }
  if (data.permissions.recordConsoleWarnings) {
    eventsHtml += getEventCount(data.consoleWarnings, 'console warnings');
  }
  if (hasErrors || data.recordingUrl) {
    eventsHtml += '<u class="log__clear-button" class="log__item">Clear all</u>';
  }
  return eventsHtml;
};

const displayRecordedEvents = (data, logEventsClass) => {
  const eventsDiv = document.getElementsByClassName(logEventsClass)[0];
  const hasErrors = data.unhandledErrors?.length || data.failedNetworkRequests?.length
    || data.consoleErrors?.length || data.consoleWarnings?.length;
  const eventsHtml = getEventsHtml(data, hasErrors);
  eventsDiv.innerHTML = eventsHtml;
  if (hasErrors || data.recordingUrl) {
    document.getElementsByClassName('log__clear-button')[0].onclick = () => {
      const emptyEventsLists = {
        unhandledErrors: [], consoleErrors: [], consoleWarnings: [], failedNetworkRequests: [],
      };
      chrome.storage.sync.set(emptyEventsLists);
      chrome.storage.sync.remove('recordingUrl');
      displayRecordedEvents({ emptyEventsLists, permissions: data.permissions }, logEventsClass);
    };
  }
};

const displayVideoStatus = (data, logVideoStatusDivClass) => {
  if (data.permissions.recordVideo) {
    const videoStatusDiv = document.getElementsByClassName(logVideoStatusDivClass)[0];
    let text;
    let icon;
    if (data.isRecording) {
      text = 'Recording...';
      icon = 'fas fa-circle';
    } else {
      text = data.recordingUrl ? 'Recording is ready' : 'No video recorded';
      icon = data.recordingUrl ? 'fas fa-video' : 'fas fa-video-slash';
    }
    videoStatusDiv.innerHTML = `<span><i class="${icon}"></i> ${text}</span>`;
  }
};

const loadRecordButtonText = (logRecordButtonClass, isRecording) => {
  const recordButton = document.getElementsByClassName(logRecordButtonClass)[0];
  if (!isRecording) {
    recordButton.textContent = 'Record events';
  } else {
    recordButton.textContent = 'Stop recording';
  }
};

const loadProjectsOptions = (projects, formProjectsSelectorClass) => {
  const projectsSelector = document.getElementsByClassName(formProjectsSelectorClass)[0];
  if (projects && projects.length) {
    const parsedProjects = JSON.parse(projects);
    let projectsOptions = '';
    parsedProjects.forEach((project) => { projectsOptions += `<option value="${project.key}">${project.name}</option>`; });
    projectsSelector.innerHTML = projectsOptions;
  }
};

const loadDataIntoUi = (
  formProjectsSelectorClass, logRecordButtonClass, logEventsClass, logVideoStatusDivClass,
) => {
  chrome.storage.sync.get([
    'isRecording', 'unhandledErrors', 'failedNetworkRequests', 'consoleErrors', 'consoleWarnings',
    'projects', 'jiraUrl', 'recordingUrl', 'permissions',
  ], (data) => {
    if (!data.jiraUrl) {
      window.location.href = '../welcome/welcome.html';
      return;
    }
    loadRecordButtonText(logRecordButtonClass, data.isRecording);
    displayRecordedEvents(data, logEventsClass);
    displayVideoStatus(data, logVideoStatusDivClass);
    loadProjectsOptions(data.projects, formProjectsSelectorClass);
  });
};

export default {
  displayRecordedEvents, displayVideoStatus, loadDataIntoUi, loadRecordButtonText,
};
