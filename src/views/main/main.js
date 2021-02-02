let settingsIcon = document.getElementById('settingsIcon');
let projectsSelector = document.getElementById('projectsSelector');
let typeSelector = document.getElementById('typeSelector');
let titleInput = document.getElementById('titleInput');
let descriptionInput = document.getElementById('descriptionInput');
let createButton = document.getElementById('createButton');
let recordButton = document.getElementById('recordButton');
let eventsDiv = document.getElementById('events');


const initializeUI = () => {
    chrome.storage.sync.get(["isRecording", "unhandledErrors", "failedNetworkRequests", "consoleErrors", "consoleWarnings", "projects"],
        function (data) {
            if (!data.isRecording) {
                recordButton.textContent = "Record events";
            } else {
                recordButton.textContent = "Stop recording";
            }
            if (data.unhandledErrors || data.failedNetworkRequests || data.consoleErrors || data.consoleWarnings) {
                displayRecordedEvents(data);
            }
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
    eventsDiv.innerHTML = `
        <span class="${data.unhandledErrors.length ? "events__count error" : "events__count"}">Unhandled errors: ${data.unhandledErrors.length}</span>
        <span class="${data.failedNetworkRequests.length ? "events__count error" : "events__count"}">Network errors: ${data.failedNetworkRequests.length}</span>
        <span class="${data.consoleErrors.length ? "events__count error" : "events__count"}">Console errors: ${data.consoleErrors.length}</span>
        <span class="${data.consoleWarnings.length ? "events__count error" : "events__count"}">Console warnings: ${data.consoleWarnings.length}</span>
    `;
}

const sendMessageToCurrentTab = (message) => {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        chrome.tabs.sendMessage(tabs[0].id, message);
    });
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

createButton.onclick = () => {
    chrome.storage.sync.get(["unhandledErrors", "failedNetworkRequests", "consoleErrors", "consoleWarnings", "url"],
        function ({ unhandledErrors, failedNetworkRequests, consoleErrors, consoleWarnings, url }) {
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
            var xmlhttp = new XMLHttpRequest();
            xmlhttp.open("POST", `${url}rest/api/2/issue`);
            xmlhttp.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
            xmlhttp.send(JSON.stringify(body));
            chrome.storage.sync.remove(["unhandledErrors", "failedNetworkRequests", "consoleErrors", "consoleWarnings"]);
            descriptionInput.value = "";
            titleInput.value = "";
        });
};

settingsIcon.onclick = () => {
    window.location.href = "../settings/settings.html";
}

recordButton.onclick = () => {
    chrome.storage.sync.get(['isRecording'], function ({ isRecording }) {
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