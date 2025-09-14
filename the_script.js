const latest_version = "3";
var checked = false;
var authenticated = false;
var machineId = null; // Store machine ID globally

// API Configuration
const API_ENDPOINT = "https://68c676d90016b02b3ad8.fra.appwrite.run/";

// License key authentication dialog (formerly password dialog)
var licenseDialogInnerHTML = `
  <div class="header-section">
    <div class="logo-container">
      <h1 class="app-title">Sigma Luca</h1>
    </div>
    <button class="close-btn" id="closeLicenseButton">×</button>
  </div>
  
  <div class="password-content">
    <h2 class="password-title">License Activation</h2>
    <p class="password-subtitle">Enter your license key to activate Sigma Luca</p>
    
    <div class="password-input-container">
      <input type="text" id="licenseInput" placeholder="Enter license key..." class="password-input">
      <button id="submitLicenseButton" class="submit-btn">Activate</button>
    </div>
    
    <div id="licenseError" class="password-error" style="display: none;">
      <span class="error-icon">❌</span>
      <span class="error-text" id="errorMessage">Activation failed. Please try again.</span>
    </div>
    
    <div id="licenseSuccess" class="license-success" style="display: none;">
      <span class="success-icon">✅</span>
      <span class="success-text">License activated successfully!</span>
    </div>
    
    <div class="machine-key-section">
      <span id="machineIdDisplayAuth" class="machine-id">Machine ID: loading...</span>
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

// Add event listener for F9 key to get machine ID and try auto-login
document.addEventListener("keydown", (event) => {
  if (event.key === "F9" || (event.ctrlKey && event.key === "k")) {
    checked = false;
    version(latest_version);
    
    // Get machine ID first
    CefSharp.PostMessage({ type: "getMachineKey" });
  }
});

// API Functions
async function tryAutoLogin(machineIdParam) {
  try {
    // Add validation to ensure machineId is not empty
    if (!machineIdParam || machineIdParam.trim() === '') {
      console.log("❌ Machine ID is empty or undefined");
      showLicenseDialog();
      return false;
    }

    console.log("🔄 Attempting auto-login with machine ID:", machineIdParam.substring(0, 15) + "...");

    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        machineId: machineIdParam.toString().trim() // Ensure it's a string and trimmed
      })
    });

    if (response.status === 200) {
      console.log("✅ Auto-login successful! Welcome back.");
      authenticated = true;
      document.getElementById("SEB_Hijack").showModal();
      return true;
    } else if (response.status === 404) {
      console.log("ⓘ This machine is not yet registered.");
      showLicenseDialog();
      return false;
    } else {
      const data = await response.json();
      console.log(`❌ Auto-login failed: ${data.message || 'Unknown error'}`);
      showLicenseDialog();
      return false;
    }
  } catch (error) {
    console.log(`❌ Network Error during auto-login: ${error}`);
    showLicenseDialog();
    return false;
  }
}

async function activateWithKey(key, machineIdParam) {
  try {
    // Add validation to ensure both key and machineId are not empty
    if (!key || key.trim() === '') {
      return { success: false, message: 'License key is required.' };
    }
    
    if (!machineIdParam || machineIdParam.trim() === '') {
      return { success: false, message: 'Machine ID is not available.' };
    }

    console.log("🔄 Attempting activation with key:", key.substring(0, 5) + "...", "and machine ID:", machineIdParam.substring(0, 15) + "...");

    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        machineId: machineIdParam.toString().trim(), // Ensure it's a string and trimmed
        key: key.toString().trim() // Ensure it's a string and trimmed
      })
    });

    const data = await response.json();

    if (response.status === 200) {
      console.log("✅ SUCCESS! Activation complete.");
      return { success: true, message: data.message || 'Activation complete.' };
    } else {
      console.log(`❌ ACTIVATION FAILED! Status: ${response.status}`);
      return { success: false, message: data.message || 'Activation failed.' };
    }
  } catch (error) {
    console.log(`❌ NETWORK ERROR! ${error}`);
    return { success: false, message: 'Network error. Please check your connection.' };
  }
}

function showLicenseDialog() {
  const licenseDialog = document.getElementById("SEB_License");
  if (licenseDialog) {
    // Update machine ID display in license dialog
    const idEl = document.getElementById("machineIdDisplayAuth");
    if (idEl && machineId) {
      idEl.textContent = "Machine ID: " + machineId.substring(0, 15) + "...";
    }
    licenseDialog.showModal();
  }
}

async function checkLicense() {
  const licenseInput = document.getElementById("licenseInput");
  const licenseError = document.getElementById("licenseError");
  const licenseSuccess = document.getElementById("licenseSuccess");
  const errorMessage = document.getElementById("errorMessage");
  const enteredKey = licenseInput.value.trim();
  
  if (!enteredKey) {
    errorMessage.textContent = "Please enter a license key.";
    licenseError.style.display = "flex";
    licenseSuccess.style.display = "none";
    return;
  }

  if (!machineId) {
    errorMessage.textContent = "Machine ID not available. Please try again.";
    licenseError.style.display = "flex";
    licenseSuccess.style.display = "none";
    return;
  }

  // Show loading state
  const submitBtn = document.getElementById("submitLicenseButton");
  const originalText = submitBtn.textContent;
  submitBtn.textContent = "Activating...";
  submitBtn.disabled = true;

  const result = await activateWithKey(enteredKey, machineId);

  // Reset button
  submitBtn.textContent = originalText;
  submitBtn.disabled = false;

  if (result.success) {
    authenticated = true;
    licenseSuccess.style.display = "flex";
    licenseError.style.display = "none";
    
    // Close license dialog and open main dialog after short delay
    setTimeout(() => {
      document.getElementById("SEB_License").close();
      document.getElementById("SEB_Hijack").showModal();
      licenseInput.value = ""; // Clear license field
      licenseSuccess.style.display = "none"; // Reset for next time
    }, 1500);
  } else {
    authenticated = false;
    errorMessage.textContent = result.message;
    licenseError.style.display = "flex";
    licenseSuccess.style.display = "none";
    licenseInput.value = ""; // Clear license field
    licenseInput.focus();
  }
}

function responseFunction(response) {
  checked = true;

  // If response is the machine key, store it and try auto-login
  if (response !== true && response !== false) {
    console.log("📋 Received machine ID:", response ? response.substring(0, 15) + "..." : "EMPTY/NULL");
    
    // Validate the machine ID before storing
    if (!response || response.toString().trim() === '') {
      console.log("❌ Machine ID is empty or invalid!");
      showLicenseDialog();
      return;
    }
    
    machineId = response.toString().trim(); // Ensure it's stored as a trimmed string
    
    // Update machine ID display in both dialogs
    const idEl = document.getElementById("machineIdDisplay");
    if (idEl) idEl.textContent = "Machine ID: " + machineId.substring(0, 15) + "...";
    
    const idElAuth = document.getElementById("machineIdDisplayAuth");
    if (idElAuth) idElAuth.textContent = "Machine ID: " + machineId.substring(0, 15) + "...";
    
    // Try auto-login with the validated machine ID
    tryAutoLogin(machineId);
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
            <span id="machineIdDisplay" class="machine-id">Machine ID: ${machineId ? machineId.substring(0, 15) + '...' : 'loading...'}</span>
          </div>
        </div>
      </div>
    `;
    
    // Re-add event listeners
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

function setupLicenseEventListeners() {
  // Close license dialog button
  const closeLicenseBtn = document.getElementById("closeLicenseButton");
  if (closeLicenseBtn) {
    closeLicenseBtn.addEventListener("click", () => {
      document.getElementById("SEB_License").close();
    });
  }

  // Submit license button
  const submitLicenseBtn = document.getElementById("submitLicenseButton");
  if (submitLicenseBtn) {
    submitLicenseBtn.addEventListener("click", checkLicense);
  }

  // Enter key in license field
  const licenseInput = document.getElementById("licenseInput");
  if (licenseInput) {
    licenseInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        checkLicense();
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

// Create the license dialog element (formerly password dialog)
const licenseDialog = document.createElement("dialog");
licenseDialog.innerHTML = licenseDialogInnerHTML;
licenseDialog.id = "SEB_License";
document.body.appendChild(licenseDialog);

// Create the main dialog element
const dialog = document.createElement("dialog");
dialog.innerHTML = dialogInnerHTML;
dialog.id = "SEB_Hijack";
document.body.appendChild(dialog);

// Create and append a style element for styling (including license styles)
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

  .submit-btn:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(79, 172, 254, 0.4);
  }

  .submit-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
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

  .license-success {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    color: #2ed573;
    font-size: 14px;
    margin-top: 10px;
  }

  .error-icon, .success-icon {
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
setupLicenseEventListeners();
