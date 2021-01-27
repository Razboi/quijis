const startRecordingUnhandledErrors = () => {
    window.onerror = function (msg, url, lineNo, columnNo, error) {
        chrome.storage.sync.get(["unhandledErrors"], function ({ unhandledErrors }) {
            unhandledErrors.push(error.stack);
            chrome.storage.sync.set({ unhandledErrors: unhandledErrors });
        });
    };
}

const startRecordingConsoleErrors = () => {
    console.originalConsoleError = console.error;
    console.error = function (error) {
        chrome.storage.sync.get(["consoleErrors"], function ({ consoleErrors }) {
            consoleErrors.push(error);
            chrome.storage.sync.set({ consoleErrors: consoleErrors });
            console.originalConsoleError(error);
        });
    };
}

const startRecordingConsoleWarnings = () => {
    console.originalConsoleWarn = console.warn;
    console.warn = function (warning) {
        chrome.storage.sync.get(["consoleWarnings"], function ({ consoleWarnings }) {
            consoleWarnings.push(warning);
            chrome.storage.sync.set({ consoleWarnings: consoleWarnings });
            console.originalConsoleWarn(warning);
        });
    };
}

const startRecordingConsoleEvents = () => {
    chrome.storage.sync.set({ unhandledErrors: [], consoleErrors: [], consoleWarnings: [] });
    startRecordingUnhandledErrors();
    startRecordingConsoleErrors();
    startRecordingConsoleWarnings();
    // setTimeout(() => {
    //     console.error("test");
    //     console.warn("testWarn");
    //     throw new Error();
    // }, 2000);
}

const stopRecordingConsoleEvents = () => {
    chrome.storage.sync.get(
        ["unhandledErrors", "consoleErrors", "consoleWarnings", "networkErrors"],
        function ({ unhandledErrors, consoleErrors, consoleWarnings, networkErrors }) {
            console.log("Unhandled errors: " + unhandledErrors);
            console.log("Console errors: " + consoleErrors);
            console.log("Console warnings: " + consoleWarnings);
            console.log("Network errors: " + networkErrors);
            console.error = console.originalConsoleError;
            console.warn = console.originalConsoleWarn;
            window.onerror = null;
        });
    // setTimeout(() => {
    //     console.error("test");
    //     console.warn("testWarn");
    //     throw new Error();
    // }, 2000);
}

chrome.runtime.onMessage.addListener(function (message) {
    if (message == "startRecordingConsoleEvents") {
        startRecordingConsoleEvents();
    } else if (message == "stopRecordingConsoleEvents") {
        stopRecordingConsoleEvents();
    }
});
