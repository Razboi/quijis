import isJiraUrlValid from "../../lib/isJiraUrlValid.js";

let backIcon = document.getElementById("backIcon");
let saveButton = document.getElementById("saveButton");
let urlInput = document.getElementById("urlInput");
let formAlert = document.getElementById("formAlert");

const initializeUI = () => {
    chrome.storage.sync.get("url", function ({ url }) {
        urlInput.value = url;
    });
}

backIcon.onclick = () => {
    window.location.href = "../main/main.html";
};

saveButton.onclick = () => {
    isJiraUrlValid(urlInput.value).then(({ isValid, projects }) => {
        if (isValid) {
            formAlert.innerHTML = "";
            chrome.storage.sync.set({ url: urlInput.value, projects: projects });
        } else {
            formAlert.innerHTML = "Invalid URL";
        }
    });
};

initializeUI();