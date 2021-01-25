// Switch the console.error function for a custom one that saves the log and handles it as usual
const startRecordingConsoleErrors = () => {
    console.log("here");
    chrome.storage.sync.set({ consoleErrors: [] });
    console.defaultError = console.error.bind(console);
    console.error = function () {
        console.log("handleConsoleErrors");
        console.defaultError.apply(console, arguments);
        chrome.storage.sync.get(['consoleErrors'], function ({ consoleErrors }) {
            consoleErrors.push(Array.from(arguments));
            chrome.storage.sync.set({ consoleErrors: consoleErrors });
        });
    };
    setTimeout(() => console.error("test"), 5000);
}

const stopRecordingConsoleErrors = () => {
    chrome.storage.sync.get(['consoleErrors'], function ({ consoleErrors }) {
        console.error = console.defaultError;
        console.log(consoleErrors);
    });
}

chrome.runtime.onMessage.addListener(
    function (message) {
        console.log(message);
        if (message == "startRecordingEvents") {
            startRecordingConsoleErrors();
        } else if (message == "stopRecordingEvents") {
            stopRecordingConsoleErrors();
        }
    }
);
