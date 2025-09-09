const latest_version = "3";
var checked = false;

var dialogInnerHTML = `
  <h2 class="title">Sigma Luca</h2>
  
  <div class="link-row">
    <a href="https://wxnnvs.ftp.sh/un-seb/troubleshoot" target="_blank">Troubleshoot</a>
    <a onclick="showurl()">Show URL</a>
  </div>

  <div class="url-row">
    <input type='text' id='urlInput' placeholder='Enter URL' required>
    <button id='openUrlButton'>Open</button>
  </div>

  <div class="quick-access-row">
    <button id='googleButton' class="quick-btn">Google</button>
    <button id='chatgptButton' class="quick-btn">ChatGPT</button>
  </div>

  <div class="action-row">
    <button id='exitSEB'>Crash SEB</button>
    <button id='closeButton'>Close</button>
  </div>

  <hr>

  <details>
    <summary>Developer Tools</summary>
    <div class="section-content">
      <button id='devButton' onclick='devTools()'>Open DevTools</button>
    </div>
  </details>

  <details>
    <summary>Experimental</summary>
    <div class="section-content">
      <button id='screenshotButton' class="beta" onclick='screenshot()'>Save page as PDF (bèta)</button>
    </div>
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
      <h2 class="title">SEB Hijack v1.2.1</h2>
      
      <div class="link-row">
        <a href="https://wxnnvs.ftp.sh/un-seb/troubleshoot" target="_blank">Troubleshoot</a>
        <a onclick="showurl()">Show URL</a>
      </div>

      <div class="url-row">
        <input type='text' id='urlInput' placeholder='Enter URL' required>
        <button id='openUrlButton'>Open</button>
      </div>

      <div class="quick-access-row">
        <button id='googleButton' class="quick-btn">Google</button>
        <button id='chatgptButton' class="quick-btn">ChatGPT</button>
      </div>

      <div class="action-row">
        <button id='exitSEB'>Crash SEB</button>
        <button id='closeButton'>Close</button>
      </div>

      <hr>
      <p>You are using an outdated version of SEB Hijack. Please update to the latest version.<br>
      It is recommended to update to v3.9.0_a3538f9, but be aware:<br>
      <b>This is not marked as the latest version, but it actually is the latest.</b><br>
      If you dont update, its not that big of a deal, but it is recommended.</p>
      <hr>

      <details>
        <summary>Developer Tools</summary>
        <div class="section-content">
          <button id='devButton' onclick='devTools()'>Open DevTools</button>
        </div>
      </details>

      <details>
        <summary>Experimental</summary>
        <div class="section-content">
          <button id='screenshotButton' class="beta" onclick='screenshot()'>Save page as PDF (bèta)</button>
        </div>
      </details>
    `;
    
    // Re-add event listeners for the updated dialog
    setupEventListeners();
  }
}

function setupEventListeners() {
  // Close button
  const closeBtn = document.getElementById("closeButton");
  if (closeBtn) {
    closeBtn.addEventListener("click", () => {
      document.getElementById("SEB_Hijack").close();
    });
  }

  // Open URL button
  const openBtn = document.getElementById("openUrlButton");
  if (openBtn) {
    openBtn.addEventListener("click", () => {
      var url = document.getElementById("urlInput").value;
      if (!url.startsWith("https://") && !url.startsWith("http://")) {
        url = "https://" + url;
      }
      window.open(url, "_blank");
      document.getElementById("SEB_Hijack").close();
    });
  }

  // Exit SEB button
  const exitBtn = document.getElementById("exitSEB");
  if (exitBtn) {
    exitBtn.onclick = function () {
      CefSharp.PostMessage({ type: "exitSEB" });
    };
  }

  // Google button
  const googleBtn = document.getElementById("googleButton");
  if (googleBtn) {
    googleBtn.addEventListener("click", () => {
      window.open("https://google.com", "_blank");
      document.getElementById("SEB_Hijack").close();
    });
  }

  // ChatGPT button
  const chatgptBtn = document.getElementById("chatgptButton");
  if (chatgptBtn) {
    chatgptBtn.addEventListener("click", () => {
      window.open("https://chatgpt.com/", "_blank");
      document.getElementById("SEB_Hijack").close();
    });
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
    background-color: #f9f9f9;
    border: none;
    border-radius: 10px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
    max-width: 420px;
    width: 100%;
    padding: 20px;
    font-family: Arial, sans-serif;
  }

  .title {
    text-align: center;
    margin-bottom: 15px;
  }

  .link-row {
    display: flex;
    justify-content: space-between;
    margin-bottom: 15px;
  }

  .url-row {
    display: flex;
    gap: 8px;
    margin-bottom: 15px;
  }

  .url-row input {
    flex: 1;
    padding: 8px;
    border: 1px solid #ccc;
    border-radius: 6px;
  }

  .quick-access-row {
    display: flex;
    gap: 8px;
    margin-bottom: 15px;
  }

  .quick-btn {
    flex: 1;
    background-color: #28a745;
  }

  .quick-btn:hover {
    background-color: #218838;
  }

  .action-row {
    display: flex;
    justify-content: space-between;
    margin-bottom: 15px;
  }

  button {
    padding: 8px 12px;
    border: none;
    border-radius: 6px;
    background-color: #007bff;
    color: white;
    cursor: pointer;
    transition: background 0.2s ease;
  }

  button:hover {
    background-color: #0056b3;
  }

  .beta {
    background-color: #507693;
  }

  .section-content {
    margin-top: 10px;
  }
`;
document.head.appendChild(style);

// Setup initial event listeners
setupEventListeners();

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
