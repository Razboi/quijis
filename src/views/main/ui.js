const getEventsHtml = (data, hasErrors) => {
  let eventsHtml = '';
  if (data.permissions.recordUnhandledErrors) {
    const eventsCountClass = data.unhandledErrors?.length ? 'events__count error' : 'events__count';
    eventsHtml += `<span class="${eventsCountClass}">Unhandled errors: ${data.unhandledErrors?.length || 0}</span>`;
  }
  if (data.permissions.recordNetworkErrors) {
    const eventsCountClass = data.failedNetworkRequests?.length ? 'events__count error' : 'events__count';
    eventsHtml += `<span class="${eventsCountClass}">Network errors: ${data.failedNetworkRequests?.length || 0}</span>`;
  }
  if (data.permissions.recordConsoleErrors) {
    const eventsCountClass = data.consoleErrors?.length ? 'events__count error' : 'events__count';
    eventsHtml += `<span class="${eventsCountClass}">Console errors: ${data.consoleErrors?.length || 0}</span>`;
  }
  if (data.permissions.recordConsoleWarnings) {
    const eventsCountClass = data.consoleWarnings?.length ? 'events__count error' : 'events__count';
    eventsHtml += `<span class="${eventsCountClass}">Console warnings: ${data.consoleWarnings?.length || 0}</span>`;
  }
  if (hasErrors || data.recordingUrl) {
    eventsHtml += '<u id="clearEventsOption" class="events__item">Clear all</u>';
  }
  return eventsHtml;
};

const displayRecordedEvents = (data, eventsDivId) => {
  const eventsDiv = document.getElementById(eventsDivId);
  const hasErrors = data.unhandledErrors?.length || data.failedNetworkRequests?.length
    || data.consoleErrors?.length || data.consoleWarnings?.length;
  const eventsHtml = getEventsHtml(data, hasErrors);
  eventsDiv.innerHTML = eventsHtml;
  if (hasErrors || data.recordingUrl) {
    document.getElementById('clearEventsOption').onclick = () => {
      const emptyEventsLists = {
        unhandledErrors: [], consoleErrors: [], consoleWarnings: [], failedNetworkRequests: [],
      };
      chrome.storage.sync.set(emptyEventsLists);
      chrome.storage.sync.remove('recordingUrl');
      displayRecordedEvents({ emptyEventsLists, permissions: data.permissions }, eventsDivId);
    };
  }
};

const displayVideoStatus = (data, videoStatusDivId) => {
  if (data.permissions.recordVideo) {
    const videoStatusDiv = document.getElementById(videoStatusDivId);
    let text;
    let icon;
    if (data.isRecording) {
      text = 'Recording...';
      icon = 'fas fa-circle';
    } else {
      text = data.recordingUrl ? 'Recording is ready' : 'No video recorded';
      icon = data.recordingUrl ? 'fas fa-video' : 'fas fa-video-slash';
    }
    videoStatusDiv.innerHTML = `<span><i id="videoStatusIcon" class="${icon}"></i> ${text}</span>`;
  }
};

const loadRecordButtonText = (recordButtonId, isRecording) => {
  const recordButton = document.getElementById(recordButtonId);
  if (!isRecording) {
    recordButton.textContent = 'Record events';
  } else {
    recordButton.textContent = 'Stop recording';
  }
};

const loadProjectsOptions = (projects, projectsSelectorId) => {
  const projectsSelector = document.getElementById(projectsSelectorId);
  if (projects && projects.length) {
    const parsedProjects = JSON.parse(projects);
    let projectsOptions = '';
    parsedProjects.forEach((project) => { projectsOptions += `<option value="${project.key}">${project.name}</option>`; });
    projectsSelector.innerHTML = projectsOptions;
  }
};

const loadDataIntoUi = (recordButtonId, projectsSelectorId, eventsDivId, videoStatusDivId) => {
  chrome.storage.sync.get([
    'isRecording', 'unhandledErrors', 'failedNetworkRequests', 'consoleErrors', 'consoleWarnings',
    'projects', 'jiraUrl', 'recordingUrl', 'permissions',
  ], (data) => {
    if (!data.jiraUrl) {
      window.location.href = '../welcome/welcome.html';
      return;
    }
    loadRecordButtonText(recordButtonId, data.isRecording);
    displayRecordedEvents(data, eventsDivId);
    displayVideoStatus(data, videoStatusDivId);
    loadProjectsOptions(data.projects, projectsSelectorId);
  });
};

export default {
  displayRecordedEvents, displayVideoStatus, loadDataIntoUi, loadRecordButtonText,
};
