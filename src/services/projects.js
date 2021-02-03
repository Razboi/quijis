const XHR = new XMLHttpRequest();

const addListeners = (xhr, resolve, reject) => {
    XHR.onload = function () {
        if (xhr.status != 200) {
            return reject(`Error ${xhr.status}: ${xhr.statusText}`);
        }
        return resolve(xhr.response);
    }
    XHR.onerror = function () {
        return reject("Request failed");
    }
}

const listProjects = (baseUrl) => {
    return new Promise((resolve, reject) => {
        XHR.open("GET", `${baseUrl}/rest/api/2/project`, true);
        addListeners(XHR, resolve, reject);
        XHR.send();
    })
}

export default { listProjects };