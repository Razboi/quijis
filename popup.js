const TEST_API_KEY = "";
const TEST_EMAIL = "";
const TEST_PROJECT_KEY = "";
const TEST_BASE_URL = "";
let createButton = document.getElementById('createButton');
let titleInput = document.getElementById('titleInput');
let descriptionInput = document.getElementById('titleInput');

createButton.onclick = () => {
    const body = {
        fields: {
            project: {
                key: devConfig.TEST_PROJECT_KEY
            },
            summary: titleInput.value,
            description: descriptionInput.value,
            issuetype: {
                name: "Bug"
            }
        }
    };
    var xmlhttp = new XMLHttpRequest();
    xmlhttp.open("POST", `${devConfig.TEST_BASE_URL}/rest/api/2/issue`);
    xmlhttp.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
    xmlhttp.send(JSON.stringify(body));
};