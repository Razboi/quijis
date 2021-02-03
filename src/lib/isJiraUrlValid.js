import projectsService from "../services/projects.js";

const isJiraUrlValid = (url) => {
    const sanitizedUrl = url.replace(/\/$/, '');
    const jiraUrlRegex = /^(https|http):\/\/\w*\.atlassian\.net$/;
    return new Promise(resolve => {
        if (!jiraUrlRegex.test(sanitizedUrl)) {
            return resolve({ isValid: false, response: null });
        }
        projectsService.listProjects(sanitizedUrl)
            .then(response => resolve({ isValid: true, response: response }))
            .catch(() => resolve({ isValid: false, response: null }))
    });
}

export default isJiraUrlValid;