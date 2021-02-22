import isJiraUrlValid from "../../lib/isJiraUrlValid.js";

let continueButton = document.getElementById("continueButton");
let urlInput = document.getElementById("urlInput");
let formAlert = document.getElementById("formAlert");

continueButton.onclick = () => {
    isJiraUrlValid(urlInput.value).then(({ isValid, projects }) => {
        if (isValid) {
            formAlert.innerHTML = "";
            chrome.storage.sync.set({
                url: urlInput.value,
                projects: projects,
                recordVideo: true,
                recordUnhandledErrors: true,
                recordNetworkErrors: true,
                recordConsoleErrors: true,
                recordConsoleWarnings: true
            }, function () {
                window.location.href = "../main/main.html";
            });
        } else {
            formAlert.innerHTML = "Invalid URL";
        }
    });
};