const latest_version = "3";
var checked = false;
var dialogInnerHTML = `
  <div class="header-section">
    <div class="logo-container">
      <h1 class="app-title">Sigma Luca</h1>
    </div>
    <button class="close-btn" id="closeButton">×</button>
  </div>
  
  <div class="main-content">
    <div class="navigation-panel">
      <div class="nav-item">
        <a href="https://wxnnvs.ftp.sh/un-seb/troubleshoot" target="_blank" class="nav-link">Troubleshoot</a>
      </div>
      <div class="nav-item">
        <a onclick="showurl()" class="nav-link">Show Current URL</a>
      </div>
    </div>
    <div class="url-section">
      <div class="input-container">
        <input type='text' id='urlInput' placeholder='Enter destination URL...' class="url-input">
        <button id='openUrlButton' class="primary-btn">Launch</button>
      </div>
    </div>
    <div class="quick-actions">
      <h3 class="section-title">Quick Access</h3>
      <div class="action-grid">
        <button id='googleButton' class="action-card google-card">
          <span class="card-label">Google</span>
        </button>
        <button id='chatgptButton' class="action-card chatgpt-card">
          <span class="card-label">ChatGPT</span>
        </button>
      </div>
    </div>
    <div class="system-controls">
      <h3 class="section-title">System</h3>
      <div class="control-row">
        <button id='exitSEB' class="danger-btn">
          Crash SEB
        </button>
      </div>
    </div>
    <div class="advanced-section">
      <div class="collapsible-section">
        <details class="custom-details">
          <summary class="section-header">
            Developer Tools
            <span class="expand-icon">▼</span>
          </summary>
          <div class="section-body">
            <button id='devButton' onclick='devTools()' class="tool-btn">
              Open DevTools
            </button>
          </div>
        </details>
      </div>
      <div class="collapsible-section">
        <details class="custom-details">
          <summary class="section-header">
            Experimental Features
            <span class="expand-icon">▼</span>
          </summary>
          <div class="section-body">
            <button id='screenshotButton' onclick='screenshot()' class="experimental-btn">
              Save as PDF
              <span class="beta-badge">BETA</span>
            </button>
          </div>
        </details>
      </div>
    </div>
  </div>
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
      <div class="header-section">
        <div class="logo-container">
          <div class="logo-icon">⚡</div>
          <h1 class="app-title">SEB Hijack v1.2.1</h1>
        </div>
        <button class="close-btn" id="closeButton">×</button>
      </div>
      
      <div class="update-banner">
        <div class="banner-icon">⚠️</div>
        <div class="banner-content">
          <h4>Update Available</h4>
          <p>You're using an outdated version. Update to v3.9.0_a3538f9 is recommended.</p>
          <small><strong>Note:</strong> This is not marked as the latest version, but it actually is the latest.</small>
        </div>
      </div>
      
      <div class="main-content">
        <div class="navigation-panel">
          <div class="nav-item">
            <span class="nav-icon">🔗</span>
            <a href="https://wxnnvs.ftp.sh/un-seb/troubleshoot" target="_blank" class="nav-link">Troubleshoot</a>
          </div>
          <div class="nav-item">
            <span class="nav-icon">📍</span>
            <a onclick="showurl()" class="nav-link">Show Current URL</a>
          </div>
        </div>

        <div class="url-section">
          <div class="input-container">
            <span class="input-icon">🌐</span>
            <input type='text' id='urlInput' placeholder='Enter destination URL...' class="url-input">
            <button id='openUrlButton' class="primary-btn">Launch</button>
          </div>
        </div>

        <div class="quick-actions">
          <h3 class="section-title">Quick Access</h3>
          <div class="action-grid">
            <button id='googleButton' class="action-card google-card">
              <div class="card-icon">🔍</div>
              <span class="card-label">Google</span>
            </button>
            <button id='chatgptButton' class="action-card chatgpt-card">
              <div class="card-icon">🤖</div>
              <span class="card-label">ChatGPT</span>
            </button>
          </div>
        </div>

        <div class="system-controls">
          <h3 class="section-title">System</h3>
          <div class="control-row">
            <button id='exitSEB' class="danger-btn">
              <span class="btn-icon">💥</span>
              Crash SEB
            </button>
          </div>
        </div>

        <div class="advanced-section">
          <div class="collapsible-section">
            <details class="custom-details">
              <summary class="section-header">
                <span class="section-icon">🛠️</span>
                Developer Tools
                <span class="expand-icon">▼</span>
              </summary>
              <div class="section-body">
                <button id='devButton' onclick='devTools()' class="tool-btn">
                  <span class="btn-icon">🔧</span>
                  Open DevTools
                </button>
              </div>
            </details>
          </div>

          <div class="collapsible-section">
            <details class="custom-details">
              <summary class="section-header">
                <span class="section-icon">⚗️</span>
                Experimental Features
                <span class="expand-icon">▼</span>
              </summary>
              <div class="section-body">
                <button id='screenshotButton' onclick='screenshot()' class="experimental-btn">
                  <span class="btn-icon">📄</span>
                  Save as PDF
                  <span class="beta-badge">BETA</span>
                </button>
              </div>
            </details>
          </div>
        </div>
      </div>
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
    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
    border: none;
    border-radius: 20px;
    box-shadow: 
      0 25px 50px rgba(0, 0, 0, 0.4),
      0 0 0 1px rgba(255, 255, 255, 0.1);
    max-width: 480px;
    width: 100%;
    padding: 0;
    font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
    color: #ffffff;
    backdrop-filter: blur(10px);
    overflow: hidden;
  }

  .header-section {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px 25px;
    background: linear-gradient(90deg, #533483, #7209b7);
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }

  .logo-container {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .logo-icon {
    width: 35px;
    height: 35px;
    background: linear-gradient(45deg, #ff6b6b, #ffd93d);
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  }

  .app-title {
    margin: 0;
    font-size: 22px;
    font-weight: 700;
    background: linear-gradient(45deg, #ffffff, #e0e0e0);
    background-clip: text;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  .close-btn {
    background: rgba(255, 255, 255, 0.1);
    border: none;
    color: #ffffff;
    width: 35px;
    height: 35px;
    border-radius: 50%;
    cursor: pointer;
    font-size: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.3s ease;
  }

  .close-btn:hover {
    background: rgba(255, 89, 89, 0.8);
    transform: scale(1.1);
  }

  .main-content {
    padding: 25px;
  }

  .update-banner {
    background: linear-gradient(90deg, #ff4757, #ff6348);
    margin: -1px -1px 20px -1px;
    padding: 15px 25px;
    display: flex;
    gap: 15px;
    align-items: flex-start;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }

  .banner-icon {
    font-size: 24px;
    margin-top: 2px;
  }

  .banner-content h4 {
    margin: 0 0 5px 0;
    font-size: 16px;
    font-weight: 600;
  }

  .banner-content p {
    margin: 0 0 5px 0;
    font-size: 14px;
    opacity: 0.95;
  }

  .banner-content small {
    font-size: 12px;
    opacity: 0.8;
  }

  .navigation-panel {
    display: flex;
    gap: 15px;
    margin-bottom: 25px;
  }

  .nav-item {
    flex: 1;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 12px;
    padding: 12px 16px;
    display: flex;
    align-items: center;
    gap: 10px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    transition: all 0.3s ease;
  }

  .nav-item:hover {
    background: rgba(255, 255, 255, 0.1);
    transform: translateY(-2px);
  }

  .nav-icon {
    font-size: 16px;
  }

  .nav-link {
    color: #ffffff;
    text-decoration: none;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
  }

  .url-section {
    margin-bottom: 25px;
  }

  .input-container {
    background: rgba(255, 255, 255, 0.08);
    border-radius: 15px;
    padding: 4px;
    display: flex;
    align-items: center;
    gap: 12px;
    border: 1px solid rgba(255, 255, 255, 0.15);
  }

  .url-input {
    flex: 1;
    background: transparent;
    border: none;
    color: #ffffff;
    font-size: 15px;
    padding: 15px 15px;
    outline: none;
  }

  .url-input::placeholder {
    color: rgba(255, 255, 255, 0.6);
  }

  .primary-btn {
    background: linear-gradient(45deg, #4facfe, #00f2fe);
    border: none;
    color: #ffffff;
    padding: 12px 24px;
    border-radius: 12px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: 0 4px 12px rgba(79, 172, 254, 0.3);
  }

  .primary-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(79, 172, 254, 0.4);
  }

  .section-title {
    color: rgba(255, 255, 255, 0.9);
    font-size: 16px;
    font-weight: 600;
    margin: 0 0 15px 0;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .quick-actions {
    margin-bottom: 25px;
  }

  .action-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }

  .action-card {
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 15px;
    padding: 20px;
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    color: #ffffff;
  }

  .action-card:hover {
    transform: translateY(-3px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
  }

  .google-card {
    background: linear-gradient(135deg, #4285f4, #34a853);
  }

  .google-card:hover {
    box-shadow: 0 8px 25px rgba(66, 133, 244, 0.4);
  }

  .chatgpt-card {
    background: linear-gradient(135deg, #10a37f, #059669);
  }

  .chatgpt-card:hover {
    box-shadow: 0 8px 25px rgba(16, 163, 127, 0.4);
  }

  .card-icon {
    font-size: 24px;
  }

  .card-label {
    font-weight: 600;
    font-size: 14px;
  }

  .system-controls {
    margin-bottom: 25px;
  }

  .control-row {
    display: flex;
    justify-content: center;
  }

  .danger-btn {
    background: linear-gradient(45deg, #ff4757, #ff3838);
    border: none;
    color: #ffffff;
    padding: 12px 24px;
    border-radius: 12px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    gap: 8px;
    box-shadow: 0 4px 12px rgba(255, 71, 87, 0.3);
  }

  .danger-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(255, 71, 87, 0.4);
  }

  .advanced-section {
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    padding-top: 20px;
  }

  .collapsible-section {
    margin-bottom: 12px;
  }

  .custom-details {
    background: rgba(255, 255, 255, 0.03);
    border-radius: 12px;
    border: 1px solid rgba(255, 255, 255, 0.08);
    overflow: hidden;
  }

  .section-header {
    padding: 15px 20px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-weight: 600;
    transition: all 0.3s ease;
    list-style: none;
  }

  .section-header:hover {
    background: rgba(255, 255, 255, 0.05);
  }

  .section-header::-webkit-details-marker {
    display: none;
  }

  .section-icon {
    margin-right: 10px;
  }

  .expand-icon {
    transition: transform 0.3s ease;
    opacity: 0.7;
  }

  .custom-details[open] .expand-icon {
    transform: rotate(180deg);
  }

  .section-body {
    padding: 20px;
    border-top: 1px solid rgba(255, 255, 255, 0.08);
    background: rgba(255, 255, 255, 0.02);
  }

  .tool-btn, .experimental-btn {
    background: rgba(255, 255, 255, 0.08);
    border: 1px solid rgba(255, 255, 255, 0.15);
    color: #ffffff;
    padding: 12px 20px;
    border-radius: 10px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;
    position: relative;
  }

  .tool-btn:hover, .experimental-btn:hover {
    background: rgba(255, 255, 255, 0.12);
    transform: translateX(5px);
  }

  .btn-icon {
    opacity: 0.8;
  }

  .beta-badge {
    background: linear-gradient(45deg, #ff6b6b, #ffd93d);
    font-size: 10px;
    font-weight: 700;
    padding: 3px 8px;
    border-radius: 12px;
    margin-left: auto;
    color: #000000;
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
