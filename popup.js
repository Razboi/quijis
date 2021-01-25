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

recordButton.onclick = () => {
    chrome.storage.sync.get(['isRecording'], function ({ isRecording }) {
        if (!isRecording) {
            sendMessageToCurrentTab("startRecordingEvents");
            recordButton.textContent = "Detener grabación";
        } else {
            sendMessageToCurrentTab("stopRecordingEvents");
            recordButton.textContent = "Grabar eventos";
        }
        chrome.storage.sync.set({ isRecording: !isRecording });
    });
};

createButton.onclick = () => {
    const body = {
        fields: {
            project: {
                key: TEST_PROJECT_KEY
            },
            summary: titleInput.value,
            description: descriptionInput.value,
            issuetype: {
                name: "Bug"
            }
        }
    };
    var xmlhttp = new XMLHttpRequest();
    xmlhttp.open("POST", `${TEST_BASE_URL}/rest/api/2/issue`);
    xmlhttp.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
    xmlhttp.send(JSON.stringify(body));
};

initializeUI();