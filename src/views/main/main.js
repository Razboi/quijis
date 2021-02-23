let settingsIcon = document.getElementById('settingsIcon');
let projectsSelector = document.getElementById('projectsSelector');
let typeSelector = document.getElementById('typeSelector');
let titleInput = document.getElementById('titleInput');
let descriptionInput = document.getElementById('descriptionInput');
let createButton = document.getElementById('createButton');
let recordButton = document.getElementById('recordButton');
let eventsDiv = document.getElementById('events');
let clearEvents;

const initializeUI = () => {
    chrome.storage.sync.get([
        "isRecording", "unhandledErrors", "failedNetworkRequests", "consoleErrors", "consoleWarnings",
        "projects", "url", "recordUnhandledErrors", "recordNetworkErrors", "recordConsoleErrors", "recordConsoleWarnings"
    ],
        function (data) {
            if (!data.url) {
                window.location.href = "../welcome/welcome.html";
                return;
            }
            if (!data.isRecording) {
                recordButton.textContent = "Record events";
            } else {
                recordButton.textContent = "Stop recording";
            }
            displayRecordedEvents(data);
            if (data.projects && data.projects.length) {
                const projects = JSON.parse(data.projects);
                let projectsOptions = "";
                projects.forEach(project => projectsOptions += `<option value="${project.key}">${project.name}</option>`);
                projectsSelector.innerHTML = projectsOptions;
            }
        }
    );
}

const displayRecordedEvents = (data) => {
    const hasErrors = data.unhandledErrors?.length || data.failedNetworkRequests?.length || data.consoleErrors?.length || data.consoleWarnings?.length;
    let eventsHtml = '';
    if (data.recordUnhandledErrors) {
        eventsHtml += `<span class="${data.unhandledErrors?.length ? "events__count error" : "events__count"}">Unhandled errors: ${data.unhandledErrors?.length || 0}</span>`;
    }
    if (data.recordNetworkErrors) {
        eventsHtml += `<span class="${data.failedNetworkRequests?.length ? "events__count error" : "events__count"}">Network errors: ${data.failedNetworkRequests?.length || 0}</span>`;
    }
    if (data.recordConsoleErrors) {
        eventsHtml += `<span class="${data.consoleErrors?.length ? "events__count error" : "events__count"}">Console errors: ${data.consoleErrors?.length || 0}</span>`;
    }
    if (data.recordConsoleWarnings) {
        eventsHtml += `<span class="${data.consoleWarnings?.length ? "events__count error" : "events__count"}">Console warnings: ${data.consoleWarnings?.length || 0}</span>`;
    }
    if (hasErrors) {
        eventsHtml += `<u id="clearEventsOption" class="events__item">Clear all</u>`;
        eventsDiv.innerHTML = eventsHtml;
        document.getElementById('clearEventsOption').onclick = handleClearEvents;
    } else {
        eventsDiv.innerHTML = eventsHtml;
    }
}

const handleClearEvents = () => {
    chrome.storage.sync.set({ unhandledErrors: [], consoleErrors: [], consoleWarnings: [], failedNetworkRequests: [] });
    initializeUI();
}

const sendMessageToBackground = (message) => {
    chrome.runtime.sendMessage(message);
}

const formatNetworkErrorLog = (failedNetworkRequest) => {
    const keyToHeaderMap = {
        url: "URL",
        status: "Status",
        requestMethod: "Request method",
        requestHeaders: "Request headers",
        requestBody: "Request body",
        responseHeaders: "Response headers",
        responseBody: "Response body",
        corsError: "Cors error"
    }
    let networkErrorLog = "\n{quote}";
    Object.entries(failedNetworkRequest).forEach(([key, value]) => {
        const formattedValue = typeof value === "object" && value !== null ? JSON.stringify(value) : value;
        networkErrorLog += `+${keyToHeaderMap[key]}+: ${formattedValue}\n`;
    });
    networkErrorLog += "{quote}";
    return networkErrorLog;
}

const attachRecordingToIssue = async (url, issueKey, recordingUrl) => {
    const recordingBlob = await fetch(recordingUrl).then(r => r.blob());
    const formData = new FormData();
    formData.append("file", recordingBlob);

    const xmlhttp = new XMLHttpRequest();
    xmlhttp.open("POST", `${url}/rest/api/2/issue/${issueKey}/attachments`);
    xmlhttp.setRequestHeader("X-Atlassian-Token", "no-check");
    xmlhttp.send(formData);
}

createButton.onclick = () => {
    chrome.storage.sync.get(["unhandledErrors", "failedNetworkRequests", "consoleErrors", "consoleWarnings", "url", "recordingUrl"],
        function ({ unhandledErrors, failedNetworkRequests, consoleErrors, consoleWarnings, url, recordingUrl }) {
            let description = descriptionInput.value;
            if (unhandledErrors && unhandledErrors.length) {
                description += `\n\n*Unhandled errors* (flag)${unhandledErrors.map(unhandledError =>
                    "\n{quote}" + unhandledError + "{quote}")}`;
            }
            if (failedNetworkRequests && failedNetworkRequests.length) {
                description += `\n\n*Network errors* (flag)${failedNetworkRequests.map(failedNetworkRequest =>
                    formatNetworkErrorLog(JSON.parse(failedNetworkRequest)))}`;
            }
            if (consoleErrors && consoleErrors.length) {
                description += `\n\n*Console errors* (x)${consoleErrors.map(consoleError =>
                    "\n{quote}" + consoleError + "{quote}")}`;
            }
            if (consoleWarnings && consoleWarnings.length) {
                description += `\n\n*Console warnings* (!)${consoleWarnings.map(consoleWarning =>
                    "\n{quote}" + consoleWarning + "{quote}")}`;
            }
            description += `\n\n_Generated with [Quijis|https://github.com/Razboi/quijis]_`;
            const body = {
                fields: {
                    project: {
                        key: projectsSelector.value
                    },
                    summary: titleInput.value,
                    description: description,
                    issuetype: {
                        name: typeSelector.value
                    }
                }
            };
            const xmlhttp = new XMLHttpRequest();
            xmlhttp.open("POST", `${url}/rest/api/2/issue`);
            xmlhttp.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
            xmlhttp.onreadystatechange = function () {
                if (recordingUrl && xmlhttp.readyState == 4) {
                    const response = JSON.parse(xmlhttp.responseText);
                    attachRecordingToIssue(url, response.key, recordingUrl);
                }
            };
            xmlhttp.send(JSON.stringify(body));
            chrome.storage.sync.remove(["unhandledErrors", "failedNetworkRequests", "consoleErrors", "consoleWarnings", "recordingUrl"]);
            descriptionInput.value = "";
            titleInput.value = "";
        });
};

settingsIcon.onclick = () => {
    window.location.href = "../settings/settings.html";
}

recordButton.onclick = () => {
    chrome.storage.sync.get(["isRecording"], function ({ isRecording }) {
        if (!isRecording) {
            sendMessageToBackground("startRecordingEvents");
            recordButton.textContent = "Stop recording";
        } else {
            sendMessageToBackground("stopRecordingEvents");
            recordButton.textContent = "Record events";
        }
        chrome.storage.sync.set({ isRecording: !isRecording });
    });
};

initializeUI();