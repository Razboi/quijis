let backIcon = document.getElementById('backIcon');
let saveButton = document.getElementById('saveButton');
let urlInput = document.getElementById('urlInput');

const initializeUI = () => {
    chrome.storage.sync.get("url", function ({ url }) {
        urlInput.value = url;
    });
}

backIcon.onclick = () => {
    window.location.href = "../main/main.html";
};

saveButton.onclick = () => {
    chrome.storage.sync.set({ url: urlInput.value });
};

initializeUI();