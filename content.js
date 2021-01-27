const captureUnhandledErrors = () => {
    window.onerror = function (msg, url, lineNo, columnNo, error) {
        chrome.storage.sync.get(["unhandledErrors"], function ({ unhandledErrors }) {
            unhandledErrors.push(error.stack);
            chrome.storage.sync.set({ unhandledErrors: unhandledErrors });
        });
    };
}

const captureConsoleErrors = () => {
    console.originalConsoleError = console.error;
    console.error = function (error) {
        chrome.storage.sync.get(["consoleErrors"], function ({ consoleErrors }) {
            consoleErrors.push(error);
            chrome.storage.sync.set({ consoleErrors: consoleErrors });
            console.originalConsoleError(error);
        });
    };
}

const captureConsoleWarnings = () => {
    console.originalConsoleWarn = console.warn;
    console.warn = function (warning) {
        chrome.storage.sync.get(["consoleWarnings"], function ({ consoleWarnings }) {
            consoleWarnings.push(warning);
            chrome.storage.sync.set({ consoleWarnings: consoleWarnings });
            console.originalConsoleWarn(warning);
        });
    };
}

const startRecordingErrors = () => {
    chrome.storage.sync.set({ unhandledErrors: [], consoleErrors: [], consoleWarnings: [] });
    captureUnhandledErrors();
    captureConsoleErrors();
    captureConsoleWarnings();
    setTimeout(() => {
        console.error("test");
        console.warn("testWarn");
        throw new Error();
    }, 2000);
}

const stopRecordingErrors = () => {
    chrome.storage.sync.get(["unhandledErrors", "consoleErrors", "consoleWarnings"], function ({ unhandledErrors, consoleErrors, consoleWarnings }) {
        console.log("Unhandled errors: " + unhandledErrors);
        console.log("Console errors: " + consoleErrors);
        console.log("Console warnings: " + consoleWarnings);
        console.error = console.originalConsoleError;
        console.warn = console.originalConsoleWarn;
        window.onerror = null;
    });
    setTimeout(() => {
        console.error("test");
        console.warn("testWarn");
        throw new Error();
    }, 2000);
}

chrome.runtime.onMessage.addListener(
    function (message) {
        if (message == "startRecordingEvents") {
            startRecordingErrors();
        } else if (message == "stopRecordingEvents") {
            stopRecordingErrors();
        }
    }
);
