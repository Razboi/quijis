const loadProjectsOptions = (projects, formProjectsSelectorClass) => {
  const projectsSelector = document.getElementsByClassName(formProjectsSelectorClass)[0];
  if (projects && projects.length) {
    const parsedProjects = JSON.parse(projects);
    let projectsOptions = '';
    parsedProjects.forEach((project) => { projectsOptions += `<option value="${project.key}">${project.name}</option>`; });
    projectsSelector.innerHTML = projectsOptions;
  }
};

const loadDataIntoUi = (formProjectsSelectorClass) => {
  chrome.storage.sync.get([
    'isRecording', 'unhandledErrors', 'failedNetworkRequests', 'consoleErrors', 'consoleWarnings',
    'projects', 'jiraUrl', 'recordingUrl', 'permissions',
  ], (data) => {
    if (!data.jiraUrl) {
      window.location.href = '../welcome/welcome.html';
      return;
    }
    loadProjectsOptions(data.projects, formProjectsSelectorClass);
  });
};

export default {
  loadDataIntoUi,
};
