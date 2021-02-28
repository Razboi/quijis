const projectsService = require('../services/projects.js');

const isJiraUrlValid = (url) => {
  const sanitizedUrl = url.replace(/\/$/, '');
  const jiraUrlRegex = /^(https|http):\/\/\w*\.atlassian\.net$/;
  return new Promise((resolve) => {
    if (!jiraUrlRegex.test(sanitizedUrl)) {
      return resolve({ isValid: false, projects: null });
    }
    return projectsService.listProjects(sanitizedUrl)
      .then((response) => resolve({ isValid: true, projects: response }))
      .catch(() => resolve({ isValid: false, projects: null }));
  });
};

module.exports = isJiraUrlValid;
