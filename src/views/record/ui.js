const getEventCount = (errors, text) => {
  const eventsCountClass = errors?.length ? 'log__count error' : 'log__count';
  return `<div class="${eventsCountClass}">${errors?.length || 0} ${text}</div>`;
};

const getEventsHtml = (data) => {
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
  return eventsHtml;
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

const displayRecordedEvents = (data, logEventsClass) => {
  const eventsDiv = document.getElementsByClassName(logEventsClass)[0];
  const eventsHtml = getEventsHtml(data);
  const hasErrors = data.unhandledErrors?.length || data.failedNetworkRequests?.length
    || data.consoleErrors?.length || data.consoleWarnings?.length;
  eventsDiv.innerHTML = eventsHtml;
  if (hasErrors || data.recordingUrl) {
    document.getElementsByClassName('log__clear-button')[0].classList.remove('is-hidden');
  }
};

const loadRecordIcon = (logRecordIconClass, isRecording) => {
  const recordIcon = document.getElementsByClassName(logRecordIconClass)[0];
  if (!isRecording) {
    recordIcon.className = 'log__record-icon fas fa-dot-circle fa-3x';
  } else {
    recordIcon.className = 'log__record-icon fas fa-pause-circle fa-3x';
  }
};

const loadDataIntoUi = (logRecordIconClass, logEventsClass, logVideoStatusDivClass) => {
  chrome.storage.sync.get([
    'isRecording', 'unhandledErrors', 'failedNetworkRequests', 'consoleErrors', 'consoleWarnings',
    'projects', 'jiraUrl', 'recordingUrl', 'permissions',
  ], (data) => {
    if (!data.jiraUrl) {
      window.location.href = '../welcome/welcome.html';
      return;
    }
    loadRecordIcon(logRecordIconClass, data.isRecording);
    displayRecordedEvents(data, logEventsClass);
    displayVideoStatus(data, logVideoStatusDivClass);
  });
};

export default {
  loadDataIntoUi, loadRecordIcon,
};
