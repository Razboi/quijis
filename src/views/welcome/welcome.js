import isJiraUrlValid from "../../lib/isJiraUrlValid.js";

let continueButton = document.getElementById("continueButton");
let urlInput = document.getElementById("urlInput");
let formAlert = document.getElementById("formAlert");

continueButton.onclick = () => {
    isJiraUrlValid(urlInput.value).then(({ isValid, response }) => {
        if (isValid) {
            formAlert.innerHTML = "";
            chrome.storage.sync.set({ url: urlInput.value, projects: response }, function () {
                window.location.href = "../main/main.html";
            });
        } else {
            formAlert.innerHTML = "Invalid URL";
        }
    });
};