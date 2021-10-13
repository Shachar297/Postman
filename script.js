import 'bootstrap';
import "bootstrap/dist/css/bootstrap.min.css";
import axios from "axios";
import prettyByes from "pretty-bytes";
import setupEditors from "./setupEditor";
import cors from "cors";

const form = document.querySelector("[data-form");
const queryParamsContainer = document.querySelector("[data-query-params]");
const requestHeadersContainer = document.querySelector("[data-request-headers]");
const keyValueTemplate = document.querySelector("[data-key-value-template]");
const responseHeadersContainer = document.querySelector("[data-response-headers]")
const requestBodyJson = document.querySelector("[data-json-request-body]");
const children = requestBodyJson.children;

queryParamsContainer.append(createKeyValuePair());
requestHeadersContainer.append(createKeyValuePair());

document.querySelector("[data-add-query-param-btn]").addEventListener("click", () => {
    queryParamsContainer.append(createKeyValuePair());
});

document.querySelector("[data-add-request-header-btn]").addEventListener("click", () => {
    requestHeadersContainer.append(createKeyValuePair());
});

const { requestEditor, updateResponseEditor } = setupEditors();

let data;
try {
    data = JSON.parse(requestEditor.state.doc.toString() || null);
} catch (error) {
    throw new Error(error.message);
}

form.addEventListener("submit", (e) => {
    e.preventDefault();

    axios.interceptors.request.use(request => {
        request.customData = request.customData || {}
        request.customData.startTime = new Date().getTime();
        return request
    });


    function updateEndTime(response) {
        response.customData = response.customData || {}
        response.customData.time = new Date().getTime() - response.config.customData.startTime;
        return response;
    }

    axios.interceptors.response.use(updateEndTime, e => {
        return Promise.reject(updateEndTime(e.response))
    });

    axios({
        url: document.querySelector("[data-url]").value,
        method: document.querySelector("[data-method]").value,
        data : children[0].innerText.substring(9, children[0].innerText.length),
        params: keyValuePairsToObjects(queryParamsContainer),
        headers: keyValuePairsToObjects(requestHeadersContainer),
        "Access-Control-Allow-Origin": "*",
    }).catch(e => e).then(resp => {
        console.log()
        console.log(resp);
        document.querySelector("[data-response-section]").classList.remove("d-none");
        updateResponseDetails(resp);
        updateResponseEditor(resp.data);
        updateResponseHeaders(resp.headers);
    });
})

function createKeyValuePair() {
    const element = document.querySelector("[data-key-value-template]").content.cloneNode(true);
    element.querySelector("[data-remove-btn]").addEventListener("click", (e) => {
        e.target.closest("[data-key-value-pair]").remove();
    });
    return element;
}

function keyValuePairsToObjects(container) {
    const pairs = container.querySelectorAll("[data-key-value-pair]")
    return [...pairs].reduce((data, pair) => {
        const key = pair.querySelector("[data-key]").value;
        const value = pair.querySelector("[data-value]").value;
        if (key === "") {
            return data;
        }
        return { ...data, [key]: value }
    })
}


function updateResponseHeaders(headers) {
    responseHeadersContainer.innerHTML = "";
    Object.entries(headers).forEach(([key, value]) => {
        const keyElement = document.createElement("div");
        keyElement.textContent = key;
        responseHeadersContainer.append(keyElement);

        const valueElement = document.createElement("div");
        valueElement.textContent = value;
        responseHeadersContainer.append(valueElement);
    })
}

function updateResponseDetails(response) {
    document.querySelector("[data-status]").textContent = response.status;
    document.querySelector("[data-time]").textContent = response.customData.time;
    document.querySelector("[data-size]").textContent = prettyByes(JSON.stringify(response.data).length + JSON.stringify(response.headers).length);
}


