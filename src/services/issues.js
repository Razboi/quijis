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

const attachRecordingToIssue = (baseUrl, issueKey, recordingBlob) => new Promise(
  (resolve, reject) => {
    const formData = new FormData();
    formData.append('file', recordingBlob);

    XHR.open('POST', `${baseUrl}/rest/api/2/issue/${issueKey}/attachments`);
    XHR.setRequestHeader('X-Atlassian-Token', 'no-check');
    addListeners(XHR, resolve, reject);
    XHR.send(formData);
  },
);

const createIssue = (baseUrl, body) => new Promise((resolve, reject) => {
  XHR.open('POST', `${baseUrl}/rest/api/2/issue`);
  XHR.setRequestHeader('Content-Type', 'application/json;charset=UTF-8');
  addListeners(XHR, resolve, reject);
  XHR.send(JSON.stringify(body));
});

export default { createIssue, attachRecordingToIssue };
