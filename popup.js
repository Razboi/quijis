const TEST_API_KEY = "";
const TEST_EMAIL = "";
const TEST_PROJECT_KEY = "";
const TEST_BASE_URL = "";
let createButton = document.getElementById('createButton');
let titleInput = document.getElementById('titleInput');
let descriptionInput = document.getElementById('titleInput');
let recordButton = document.getElementById('recordButton');


const initializeUI = () => {
    chrome.storage.sync.get(['isRecording'], function ({ isRecording }) {
        if (!isRecording) {
            recordButton.textContent = "Grabar eventos";
        } else {
            recordButton.textContent = "Detener grabación";
        }
    });
}

const sendMessageToCurrentTab = (message) => {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        chrome.tabs.sendMessage(tabs[0].id, message);
    });
}

const sendMessageToBackground = (message) => {
    chrome.runtime.sendMessage(message);
}

recordButton.onclick = () => {
    chrome.storage.sync.get(['isRecording'], function ({ isRecording }) {
        if (!isRecording) {
            sendMessageToCurrentTab("startRecordingConsoleEvents");
            sendMessageToBackground("startRecordingNetworkEvents");
            recordButton.textContent = "Detener grabación";
        } else {
            sendMessageToCurrentTab("stopRecordingConsoleEvents");
            sendMessageToBackground("stopRecordingNetworkEvents");
            recordButton.textContent = "Grabar eventos";
        }
        chrome.storage.sync.set({ isRecording: !isRecording });
    });
};

createButton.onclick = () => {
    chrome.storage.sync.get(["unhandledErrors", "consoleErrors", "consoleWarnings"], function ({ unhandledErrors, consoleErrors, consoleWarnings }) {
        let description = descriptionInput.value;
        if (unhandledErrors && unhandledErrors.length) {
            description += `\n\n*Unhandled errors* (flag)${unhandledErrors.map(unhandledError => "\n{quote}" + unhandledError + "{quote}")}`;
        }
        if (consoleErrors && consoleErrors.length) {
            description += `\n\n*Console errors* (x)${consoleErrors.map(consoleError => "\n{quote}" + consoleError + "{quote}")}`;
        }
        if (consoleWarnings && consoleWarnings.length) {
            description += `\n\n*Console warnings* (!)${consoleWarnings.map(consoleWarning => "\n{quote}" + consoleWarning + "{quote}")}`;
        }
        description += `\n\n_Generated with [Quijis|https://github.com/Razboi/quijis]_`;
        const body = {
            fields: {
                project: {
                    key: TEST_PROJECT_KEY
                },
                summary: titleInput.value,
                description: description,
                issuetype: {
                    name: "Bug"
                }
            }
        };
        var xmlhttp = new XMLHttpRequest();
        xmlhttp.open("POST", `${TEST_BASE_URL}/rest/api/2/issue`);
        xmlhttp.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
        xmlhttp.send(JSON.stringify(body));
        chrome.storage.sync.set({ unhandledErrors: [], consoleErrors: [], consoleWarnings: [] });
    });
};

initializeUI();