const latest_version = "3";
const API_ENDPOINT = "https://68c676d90016b02b3ad8.fra.appwrite.run/";
var checked = false;
var authenticated = false;

// Password authentication dialog
var passwordDialogInnerHTML = `
  <div class="header-section">
    <div class="logo-container">
      <h1 class="app-title">Sigma Luca</h1>
    </div>
    <button class="close-btn" id="closePasswordButton">×</button>
  </div>
  
  <div class="password-content">
    <h2 class="password-title">Authentication Required</h2>
    <p class="password-subtitle">Enter your license key to activate Sigma Luca</p>
    
    <div class="password-input-container">
      <input type="password" id="passwordInput" placeholder="Enter license key..." class="password-input">
      <button id="submitPasswordButton" class="submit-btn">Unlock</button>
    </div>
    
    <div id="passwordError" class="password-error" style="display: none;">
      <span class="error-icon">❌</span>
      <span class="error-text">Activation failed. Please try again.</span>
    </div>
  </div>
`;

// Original dialog content
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
      <div class="machine-key-section">
        <span id="machineIdDisplay" class="machine-id">Machine ID: loading...</span>
      </div>
    </div>

  </div>
`;

// Add event listener for F9 key to open the password dialog
document.addEventListener("keydown", (event) => {
  if (event.key === "F9" || (event.ctrlKey && event.key === "k")) {
    checked = false;
    version(latest_version);
    initiateAuthFlow();
  }
});

function showPasswordDialog() {
  const passwordDialog = document.getElementById("SEB_Password");
  if (passwordDialog) {
    passwordDialog.showModal();
  }
}

// Store and propagate the machine ID once received
function setMachineId(id) {
  responseFunction.machineKey = id;
  try { localStorage.setItem("machineId", id); } catch (e) {}
  try { window.setMachineId = setMachineId; } catch (e) {}
  try { window.machineId = id; } catch (e) {}
  const idEl = document.getElementById("machineIdDisplay");
  if (idEl) idEl.textContent = "Machine ID: " + id;
  if (typeof setMachineId._resolvers !== "undefined" && Array.isArray(setMachineId._resolvers)) {
    setMachineId._resolvers.forEach((r) => {
      try { r(id); } catch (e) {}
    });
    setMachineId._resolvers = [];
  }
  try { console.debug("[auth] machineId set:", id); } catch (e) {}
}
setMachineId._resolvers = [];

// Try to discover machineId from URL params or localStorage
function getMachineIdFromHints() {
  try {
    const params = new URLSearchParams(window.location.search);
    const q = params.get("machineId") || params.get("machine_id") || params.get("id");
    if (q && q.length > 0) return q;
  } catch (e) {}
  try {
    const saved = localStorage.getItem("machineId");
    if (saved) return saved;
  } catch (e) {}
  return null;
}

// Ask the host for a machine id using different message types (for compatibility)
function requestMachineId() {
  try { CefSharp.PostMessage({ type: "getMachineKey" }); } catch (e) {}
  try { CefSharp.PostMessage({ type: "getMachineId" }); } catch (e) {}
  try { CefSharp.PostMessage({ type: "machineId" }); } catch (e) {}
}

// Accept machine id via postMessage or WebView2
try {
  window.addEventListener("message", (evt) => {
    const d = evt.data;
    if (!d) return;
    if (typeof d === "string") {
      // heuristic for hash-like id
      if (/^[a-f0-9-]{16,}$/i.test(d)) setMachineId(d);
    } else if (typeof d === "object") {
      if (d.machineId) setMachineId(d.machineId);
      else if (d.machineID) setMachineId(d.machineID);
      else if (d.type === "machineId" && d.value) setMachineId(d.value);
    }
  });
} catch (e) {}

try {
  if (window.chrome && window.chrome.webview && window.chrome.webview.addEventListener) {
    window.chrome.webview.addEventListener("message", (evt) => {
      const d = evt.data;
      if (!d) return;
      if (typeof d === "string" && /^[a-f0-9-]{16,}$/i.test(d)) setMachineId(d);
      else if (d.machineId) setMachineId(d.machineId);
      else if (d.machineID) setMachineId(d.machineID);
      else if (d.type === "machineId" && d.value) setMachineId(d.value);
    });
  }
} catch (e) {}

async function waitForMachineId(timeoutMs = 15000) {
  if (responseFunction.machineKey) return responseFunction.machineKey;
  const hinted = getMachineIdFromHints();
  if (hinted) { setMachineId(hinted); return hinted; }
  return new Promise((resolve) => {
    let done = false;
    const timer = setTimeout(() => {
      if (!done) {
        done = true;
        resolve(null);
      }
    }, timeoutMs);
    setMachineId._resolvers.push((id) => {
      if (!done) {
        done = true;
        clearTimeout(timer);
        resolve(id);
      }
    });
  });
}

async function tryAutoLoginWithMachineId(machineId) {
  try {
    const res = await fetch(API_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ machineId })
    });
    return res.status === 200;
  } catch (e) {
    return false;
  }
}

async function activateWithKey(key, machineId) {
  try {
    const res = await fetch(API_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ machineId, key })
    });
    if (res.status === 200) {
      return { ok: true };
    } else {
      let msg = "Activation failed. Please try again.";
      try {
        const data = await res.json();
        if (data && data.message) msg = data.message;
      } catch (_) {}
      return { ok: false, message: msg };
    }
  } catch (e) {
    return { ok: false, message: "Network error. Please try again." };
  }
}

async function initiateAuthFlow() {
  // Always request latest machine key from host
  requestMachineId();
  const machineId = await waitForMachineId(15000);

  if (machineId) {
    const ok = await tryAutoLoginWithMachineId(machineId);
    if (ok) {
      authenticated = true;
      const passwordDlg = document.getElementById("SEB_Password");
      if (passwordDlg && passwordDlg.open) passwordDlg.close();
      const mainDlg = document.getElementById("SEB_Hijack");
      mainDlg.showModal();
      return;
    }
  }

  // Fallback: show activation (password) dialog
  showPasswordDialog();
}

async function checkPassword() {
  const passwordInput = document.getElementById("passwordInput");
  const passwordError = document.getElementById("passwordError");
  const errorText = passwordError ? passwordError.querySelector(".error-text") : null;
  const key = (passwordInput.value || "").trim();

  // Ensure we have a machine ID
  let machineId = responseFunction.machineKey;
  if (!machineId) {
    requestMachineId();
    machineId = await waitForMachineId(15000);
  }

  if (!machineId) {
    authenticated = false;
    if (passwordError) {
      passwordError.style.display = "flex";
      if (errorText) errorText.textContent = "Machine ID not available yet. Please wait a moment and try again.";
    }
    passwordInput.focus();
    return;
  }

  const result = await activateWithKey(key, machineId);
  if (result.ok) {
    authenticated = true;
    const dlg = document.getElementById("SEB_Password");
    if (dlg && dlg.open) dlg.close();
    document.getElementById("SEB_Hijack").showModal();
    if (machineId) setMachineId(machineId);

    passwordInput.value = "";
    if (passwordError) passwordError.style.display = "none";
  } else {
    authenticated = false;
    if (passwordError) {
      passwordError.style.display = "flex";
      if (errorText) errorText.textContent = result.message || "Activation failed. Please try again.";
    }
    passwordInput.value = "";
    passwordInput.focus();
  }
}

function responseFunction(response) {
  checked = true;

  // If response is the machine key, store and show it immediately
  if (response !== true && response !== false) {
    setMachineId(response);
    return;
  }

  if (response === true) {
    // up-to-date, do nothing special
    return;
  } else {
    // Outdated dialog
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
            <span id="machineIdDisplay" class="machine-id">Machine ID: loading...</span>
          </div>
        </div>
      </div>
    `;
    
    // Re-add event listeners
    setupEventListeners();

    // Set machine ID after dialog is rendered
    const idEl = document.getElementById("machineIdDisplay");
    if (idEl && typeof responseFunction.machineKey !== "undefined") {
      idEl.textContent = "Machine ID: " + responseFunction.machineKey;
    }
  }
}
responseFunction.storeMachineKey = function(key) {
  setMachineId(key);
};
function handleMachineKey(response) {
  setMachineId(response);
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

function setupPasswordEventListeners() {
  // Close password dialog button
  const closePasswordBtn = document.getElementById("closePasswordButton");
  if (closePasswordBtn) {
    closePasswordBtn.addEventListener("click", () => {
      document.getElementById("SEB_Password").close();
    });
  }

  // Submit password button
  const submitPasswordBtn = document.getElementById("submitPasswordButton");
  if (submitPasswordBtn) {
    submitPasswordBtn.addEventListener("click", checkPassword);
  }

  // Enter key in password field
  const passwordInput = document.getElementById("passwordInput");
  if (passwordInput) {
    passwordInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        checkPassword();
      }
    });
  }
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

// Create the password dialog element
const passwordDialog = document.createElement("dialog");
passwordDialog.innerHTML = passwordDialogInnerHTML;
passwordDialog.id = "SEB_Password";
document.body.appendChild(passwordDialog);

// Create the main dialog element
const dialog = document.createElement("dialog");
dialog.innerHTML = dialogInnerHTML;
dialog.id = "SEB_Hijack";
document.body.appendChild(dialog);

// Create and append a style element for styling (including password styles)
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

  .password-content {
    padding: 40px 25px;
    text-align: center;
  }

  .password-title {
    font-size: 24px;
    font-weight: 700;
    margin-bottom: 10px;
    background: linear-gradient(45deg, #ffffff, #e0e0e0);
    background-clip: text;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }
  .machine-id {
    font-size: 12px;
    color: rgba(255, 255, 255, 0.7);
    margin-top: 10px;
    display: block;
    text-align: center;
  }

  .password-subtitle {
    color: rgba(255, 255, 255, 0.7);
    margin-bottom: 30px;
    font-size: 16px;
  }

  .password-input-container {
    display: flex;
    gap: 10px;
    margin-bottom: 15px;
  }

  .password-input {
    flex: 1;
    background: rgba(255, 255, 255, 0.08);
    border: 1px solid rgba(255, 255, 255, 0.15);
    border-radius: 12px;
    color: #ffffff;
    font-size: 16px;
    padding: 15px;
    outline: none;
    transition: all 0.3s ease;
  }

  .password-input:focus {
    border-color: #4facfe;
    box-shadow: 0 0 0 2px rgba(79, 172, 254, 0.2);
  }

  .password-input::placeholder {
    color: rgba(255, 255, 255, 0.6);
  }

  .submit-btn {
    background: linear-gradient(45deg, #4facfe, #00f2fe);
    border: none;
    color: #ffffff;
    padding: 15px 30px;
    border-radius: 12px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: 0 4px 12px rgba(79, 172, 254, 0.3);
  }

  .submit-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(79, 172, 254, 0.4);
  }

  .password-error {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    color: #ff4757;
    font-size: 14px;
    margin-top: 10px;
  }

  .error-icon {
    font-size: 16px;
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
`;
document.head.appendChild(style);

// Setup initial event listeners
setupEventListeners();
setupPasswordEventListeners();

// Attempt auto-login on page load as well
try {
  window.addEventListener("DOMContentLoaded", () => { requestMachineId(); initiateAuthFlow(); });
} catch (e) {}
