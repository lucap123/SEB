const latest_version = "3";
var checked = false;
var authenticated = false;

// License key dialog (for manual activation)
var licenseKeyDialogInnerHTML = `
    <div class="header-section">
        <div class="logo-container">
            <h1 class="app-title">Sigma Luca</h1>
        </div>
        <button class="close-btn" id="closeLicenseKeyButton">×</button>
    </div>
    <div class="license-key-content">
        <h2 class="license-key-title">License Required</h2>
        <p class="license-key-subtitle">Please enter your license key</p>
        <div class="license-key-input-container">
            <input type="text" id="licenseKeyInput" placeholder="Enter license key..." class="license-key-input">
            <button id="submitLicenseKeyButton" class="submit-btn">Activate</button>
        </div>
        <div id="licenseKeyError" class="license-key-error" style="display: none;">
            <span class="error-icon">❌</span>
            <span class="error-text">Invalid license key. Please try again.</span>
        </div>
    </div>
`;

// Main dialog content
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

// Add event listener for F9 key to trigger auto-login
document.addEventListener("keydown", (event) => {
    if (event.key === "F9" || (event.ctrlKey && event.key === "k")) {
        checked = false;
        version(latest_version);
        checkMachineId();
    }
});

// Check if the machine ID is registered
async function checkMachineId() {
    const machineId = await getMachineId();
    if (!machineId) return;

    try {
        const response = await fetch('https://68c676d90016b02b3ad8.fra.appwrite.run/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ machineId })
        });
        const data = await response.json();
        if (data.success) {
            authenticated = true;
            document.getElementById("SEB_Hijack").showModal();
            CefSharp.PostMessage({ type: "getMachineKey" });
        } else {
            showLicenseKeyDialog();
        }
    } catch (error) {
        showLicenseKeyDialog();
    }
}

// Show license key dialog
function showLicenseKeyDialog() {
    const licenseKeyDialog = document.getElementById("SEB_LicenseKey");
    if (licenseKeyDialog) {
        licenseKeyDialog.showModal();
    }
}

// Check license key
async function checkLicenseKey() {
    const licenseKeyInput = document.getElementById("licenseKeyInput");
    const licenseKeyError = document.getElementById("licenseKeyError");
    const enteredLicenseKey = licenseKeyInput.value;
    const machineId = await getMachineId();

    try {
        const response = await fetch('https://68c676d90016b02b3ad8.fra.appwrite.run/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ machineId, key: enteredLicenseKey })
        });
        const data = await response.json();
        if (data.success) {
            authenticated = true;
            document.getElementById("SEB_LicenseKey").close();
            document.getElementById("SEB_Hijack").showModal();
            CefSharp.PostMessage({ type: "getMachineKey" });
            licenseKeyInput.value = "";
            if (licenseKeyError) licenseKeyError.style.display = "none";
        } else {
            licenseKeyError.style.display = "flex";
            licenseKeyInput.value = "";
            licenseKeyInput.focus();
        }
    } catch (error) {
        licenseKeyError.style.display = "flex";
        licenseKeyInput.value = "";
        licenseKeyInput.focus();
    }
}

// Get machine ID from CefSharp
function getMachineId() {
    return new Promise((resolve) => {
        CefSharp.PostMessage({ type: "getMachineKey" });
        responseFunction.storeMachineKey = resolve;
    });
}

// Create the license key dialog element
const licenseKeyDialog = document.createElement("dialog");
licenseKeyDialog.innerHTML = licenseKeyDialogInnerHTML;
licenseKeyDialog.id = "SEB_LicenseKey";
document.body.appendChild(licenseKeyDialog);

// Create the main dialog element
const dialog = document.createElement("dialog");
dialog.innerHTML = dialogInnerHTML;
dialog.id = "SEB_Hijack";
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
    .license-key-content {
        padding: 40px 25px;
        text-align: center;
    }
    .license-key-title {
        font-size: 24px;
        font-weight: 700;
        margin-bottom: 10px;
        background: linear-gradient(45deg, #ffffff, #e0e0e0);
        background-clip: text;
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
    }
    .license-key-subtitle {
        color: rgba(255, 255, 255, 0.7);
        margin-bottom: 30px;
        font-size: 16px;
    }
    .license-key-input-container {
        display: flex;
        gap: 10px;
        margin-bottom: 15px;
    }
    .license-key-input {
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
    .license-key-input:focus {
        border-color: #4facfe;
        box-shadow: 0 0 0 2px rgba(79, 172, 254, 0.2);
    }
    .license-key-input::placeholder {
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
    .license-key-error {
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
    .machine-id {
        font-size: 12px;
        color: rgba(255, 255, 255, 0.7);
        margin-top: 10px;
        display: block;
        text-align: center;
    }
`;
document.head.appendChild(style);

// Setup event listeners for the main dialog
function setupEventListeners() {
    const closeBtn = document.getElementById("closeButton");
    if (closeBtn) {
        closeBtn.addEventListener("click", () => {
            document.getElementById("SEB_Hijack").close();
        });
    }
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
    const exitBtn = document.getElementById("exitSEB");
    if (exitBtn) {
        exitBtn.onclick = function () {
            CefSharp.PostMessage({ type: "exitSEB" });
        };
    }
    const googleBtn = document.getElementById("googleButton");
    if (googleBtn) {
        googleBtn.addEventListener("click", () => {
            window.open("https://google.com", "_blank");
            document.getElementById("SEB_Hijack").close();
        });
    }
    const chatgptBtn = document.getElementById("chatgptButton");
    if (chatgptBtn) {
        chatgptBtn.addEventListener("click", () => {
            window.open("https://chatgpt.com/", "_blank");
            document.getElementById("SEB_Hijack").close();
        });
    }
}

// Setup event listeners for the license key dialog
function setupLicenseKeyEventListeners() {
    const closeLicenseKeyBtn = document.getElementById("closeLicenseKeyButton");
    if (closeLicenseKeyBtn) {
        closeLicenseKeyBtn.addEventListener("click", () => {
            document.getElementById("SEB_LicenseKey").close();
        });
    }
    const submitLicenseKeyBtn = document.getElementById("submitLicenseKeyButton");
    if (submitLicenseKeyBtn) {
        submitLicenseKeyBtn.addEventListener("click", checkLicenseKey);
    }
    const licenseKeyInput = document.getElementById("licenseKeyInput");
    if (licenseKeyInput) {
        licenseKeyInput.addEventListener("keypress", (e) => {
            if (e.key === "Enter") {
                checkLicenseKey();
            }
        });
    }
}

// Helper function to show the current URL
function showurl() {
    var url = window.location.href;
    document.getElementById("urlInput").value = url;
}

// Helper function to handle version checks
function version(version) {
    CefSharp.PostMessage({ version: version });
}

// Helper function to store the machine key
responseFunction.storeMachineKey = function(key) {
    responseFunction.machineKey = key;
};

// Helper function to handle the machine key response
function responseFunction(response) {
    checked = true;
    if (response !== true && response !== false) {
        const idEl = document.getElementById("machineIdDisplay");
        if (idEl) idEl.textContent = "Machine ID: " + response;
        return;
    }
}

// Initialize event listeners
setupEventListeners();
setupLicenseKeyEventListeners();
