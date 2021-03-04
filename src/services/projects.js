const XHR = new XMLHttpRequest();

const addListeners = (xhr, resolve, reject) => {
  XHR.onload = function handleLoad() {
    const successfulCodesRegex = /^2[0-9][0-9]$/;
    if (!successfulCodesRegex.test(xhr.status)) {
      return reject(`Error ${xhr.status}: ${xhr.statusText}`);
    }
    return resolve(xhr.response);
  };
  XHR.onerror = function handleError() {
    return reject('Request failed');
  };
};

const listProjects = (baseUrl) => new Promise((resolve, reject) => {
  XHR.open('GET', `${baseUrl}/rest/api/2/project`, true);
  addListeners(XHR, resolve, reject);
  XHR.send();
});

module.exports = { listProjects };
