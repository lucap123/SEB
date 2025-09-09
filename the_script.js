<script>
const latest_version = "3";
var checked = false;

var dialogInnerHTML = `
    <h2>Sigma Luca</h2>
    <a href="https://wxnnvs.ftp.sh/un-seb/troubleshoot" target="_blank">Troubleshoot</a>
    <a onclick="showurl()">show url</a>
    <input type='text' id='urlInput' placeholder='Enter URL' required>
    <button id='openUrlButton'>Open URL</button>
    <button id='exitSEB'>Crash SEB</button>
    <button id='closeButton'>Close</button>
    <hr>
    <details>
        <summary>Developer Tools</summary>
        <br>
        <button id='devButton' onclick='devTools()'>Open DevTools</button>
    </details>
    <details>
        <summary>Experimental</summary>
        <br>
        <button id='screenshotButton' class="beta" onclick='screenshot()'>Save page as PDF (bèta)</button>
    </details>
`;

// Add event listener for F9 key to open the dialog
document.addEventListener("keydown", (event) => {
  if (event.key === "F9" || (event.ctrlKey && event.key === "k")) {
    checked = false;
    version(latest_version);
    document.getElementById("SEB_Hijack").showModal();
  }
});

function responseFunction(response) {
  checked = true;
  if (response == true) {
    // do nothing
  } else {
    const dialog = document.getElementById("SEB_Hijack");
    dialog.innerHTML = `
        <h2>SEB Hijack v1.2.1</h2>
        <a href="https://wxnnvs.ftp.sh/un-seb/troubleshoot" target="_blank">Troubleshoot</a>
        <a onclick="showurl()">show url</a>
        <input type='text' id='urlInput' placeholder='Enter URL' required>
        <button id='openUrlButton'>Open URL</button>
        <button id='exitSEB'>Crash SEB</button>
        <button id='closeButton'>Close</button>
        <hr>
        <p>You are using an outdated version of SEB Hijack. Please update to the latest version.<br>
        It is recommended to update to v3.9.0_a3538f9, but be aware:<br>
        <b>This is not marked as the latest version, but it actually is the latest.</b><br>
        If you dont update, its not that big of a deal, but it is recommended.</p>
        <hr>
        <details>
            <summary>Developer Tools</summary>
            <br>
            <button id='devButton' onclick='devTools()'>Open DevTools</button>
        </details>
        <details>
            <summary>Experimental</summary>
            <br>
            <button id='screenshotButton' class="beta" onclick='screenshot()'>Save page as PDF (bèta)</button>
        </details>
    `;
  }
}

// Create the dialog element
const dialog = document.createElement("dialog");

// Add content to the dialog
dialog.innerHTML = dialogInnerHTML;

// Set the dialog ID
dialog.id = "SEB_Hijack";

// Append the dialog to the body
document.body.appendChild(dialog);

// Create and append a style element for styling
const style = document.createElement("style");
style.textContent = `
    dialog {
        background-color: #ffffff; /* White background */
        border: 4px solid transparent;
        border-radius: 10px;
        padding: 20px;
        max-width: 400px;
        width: 100%;
        position: relative;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
        transition: all 0.3s ease;
    }

    /* Rainbow border effect */
    dialog::before {
        content: "";
        position: absolute;
        top: -4px;
        left: -4px;
        right: -4px;
        bottom: -4px;
        border-radius: 14px;
        background: linear-gradient(90deg, red, orange, yellow, green, blue, indigo, violet, red);
        z-index: -1;
        animation: rainbow 5s linear infinite;
    }

    @keyframes rainbow {
        0% { background-position: 0% 50%; }
        100% { background-position: 100% 50%; }
    }

    h2 {
        font-size: 1.5em;
        color: #333;
        margin-bottom: 15px;
    }

    #urlInput {
        width: calc(100% - 22px);
        border: 1px solid #ccc;
        border-radius: 4px;
        padding: 10px;
        margin-bottom: 10px;
    }

    button {
        padding: 10px 15px;
        border: none;
        border-radius: 4px;
        background-color: #007bff;
        color: white;
        cursor: pointer;
        margin-right: 5px;
    }

    button:hover {
        background-color: #0056b3;
    }

    .beta {
        background-color: #507693;
    }
`;
document.head.appendChild(style);

// Add event listener to close the dialog
document.getElementById("closeButton").addEventListener("click", () => {
  document.getElementById("SEB_Hijack").close();
});

// Add event listener to handle button click
document.getElementById("openUrlButton").addEventListener("click", () => {
  var url = document.getElementById("urlInput").value;
  if (!url.startsWith("https://") && !url.startsWith("http://")) {
    url = "https://" + url;
  }
  window.open(url, "_blank");
  dialog.close();
});

// Add event listener to crash SEB
document.getElementById("exitSEB").onclick = function () {
  CefSharp.PostMessage({ type: "exitSEB" });
};

function screenshot() {
  document.getElementById("SEB_Hijack").close();

  setTimeout(() => {
    CefSharp.PostMessage({ type: "screenshot" });
  }, 1000);
}

function devTools() {
  document.getElementById("SEB_Hijack").close();
  CefSharp.PostMessage({ type: "devTools" });
}

function version(version) {
  CefSharp.PostMessage({ version: version });
}

function createPDf() {
  pdfjsLib
    .getDocument(
      "https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf"
    )
    .promise.then(function (pdf) {
      pdf.getPage(1).then(function (page) {
        var scale = 1.5;
        var viewport = page.getViewport({ scale: scale });

        var canvas = document.getElementById("the-canvas");
        var context = canvas.getContext("2d");
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        var renderContext = {
          canvasContext: context,
          viewport: viewport,
        };
        page.render(renderContext);
      });
    });
}

function showurl() {
  var url = window.location.href;
  document.getElementById("urlInput").value = url;
}
</script>
