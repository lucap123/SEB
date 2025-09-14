// --- Configuration ---
const LATEST_VERSION = "3";
const API_ENDPOINT = "https://68c676d90016b02b3ad8.fra.appwrite.run/";

// --- State Management ---
var checked = false;
var authenticated = false;
let currentMachineId = null;
let isAuthenticating = false; // Prevents multiple F9 presses from firing simultaneously

// --- Dialog HTML Definitions ---

// Activation Key Dialog
var keyDialogInnerHTML = `
  <div class="header-section">
    <div class="logo-container">
      <h1 class="app-title">Sigma Luca</h1>
    </div>
    <button class="close-btn" id="closeKeyButton">×</button>
  </div>
  
  <div class="password-content">
    <h2 class="password-title">Activation Required</h2>
    <p class="password-subtitle">Please enter your license key to continue</p>
    
    <div class="password-input-container">
      <input type="password" id="keyInput" placeholder="Enter license key..." class="password-input">
      <button id="submitKeyButton" class="submit-btn">Activate</button>
    </div>
    
    <div id="keyError" class="password-error" style="display: none;">
      <span class="error-icon">❌</span>
      <span class="error-text">Invalid key. Please try again.</span>
    </div>
  </div>
`;

// Main Application Dialog
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

// --- Core Logic ---

// Listen for F9 to start the entire authentication process
document.addEventListener("keydown", (event) => {
  if ((event.key === "F9" || (event.ctrlKey && event.key === "k")) && !isAuthenticating) {
    startAuthentication();
  }
});

function startAuthentication() {
  isAuthenticating = true;
  console.log("Starting authentication process...");
  
  // Reset state
  checked = false;
  authenticated = false;
  currentMachineId = null;

  version(LATEST_VERSION);
  
  // Step 1: Request the machine ID from the C# host
  console.log("Requesting Machine ID from host...");
  CefSharp.PostMessage({ type: "getMachineKey" });
}

async function tryAutoLogin(machineId) {
  console.log(`Attempting auto-login with Machine ID: ${machineId}`);
  try {
    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ machineId })
    });

    if (response.ok) { // Status 200 - Success
      const data = await response.json();
      console.log("Auto-login successful:", data.message);
      onLoginSuccess();
    } else if (response.status === 404) { // Not registered, needs activation
      console.log("Machine not registered. Prompting for key.");
      promptForKey();
    } else { // Other server-side error (e.g., expired key)
      const errorData = await response.json();
      console.log(`Auto-login failed: ${errorData.message}`);
      promptForKey(errorData.message);
    }
  } catch (error) {
    console.error("Network error during auto-login:", error);
    promptForKey("Network Error. Could not connect to the server.");
  }
}

async function activateWithKey() {
  const keyInput = document.getElementById("keyInput");
  const keyError = document.getElementById("keyError");
  const errorText = keyError.querySelector(".error-text");
  const submitButton = document.getElementById("submitKeyButton");
  const enteredKey = keyInput.value.trim();

  if (!enteredKey) {
    errorText.textContent = "Please enter a license key.";
    keyError.style.display = "flex";
    return;
  }
  
  // Disable UI during request
  submitButton.disabled = true;
  submitButton.textContent = "Verifying...";
  keyError.style.display = "none";

  console.log(`Attempting activation with key for Machine ID: ${currentMachineId}`);
  try {
    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ machineId: currentMachineId, key: enteredKey })
    });

    const data = await response.json();

    if (response.ok) {
      console.log("Activation successful:", data.message);
      onLoginSuccess();
    } else {
      console.error(`Activation failed: ${data.message}`);
      errorText.textContent = data.message || "An unknown error occurred.";
      keyError.style.display = "flex";
    }
  } catch (error) {
    console.error("Network error during activation:", error);
    errorText.textContent = "Network error. Could not connect to the server.";
    keyError.style.display = "flex";
  } finally {
    // Re-enable UI
    submitButton.disabled = false;
    submitButton.textContent = "Activate";
  }
}

function promptForKey(errorMessage = null) {
  const keyDialog = document.getElementById("SEB_Key");
  const keyError = document.getElementById("keyError");
  const errorText = keyError.querySelector(".error-text");
  
  if (errorMessage) {
    errorText.textContent = errorMessage;
    keyError.style.display = 'flex';
  } else {
    keyError.style.display = 'none';
  }

  if (keyDialog) {
    keyDialog.showModal();
    document.getElementById("keyInput").focus();
  }
}

function onLoginSuccess() {
  authenticated = true;
  isAuthenticating = false; // Reset for next F9 press
  
  document.getElementById("SEB_Key").close();
  document.getElementById("SEB_Hijack").showModal();
  
  // Ensure machine ID is displayed on the main dialog
  const idEl = document.getElementById("machineIdDisplay");
  if (idEl && currentMachineId) {
    idEl.textContent = "Machine ID: " + currentMachineId;
  }
}

// This function is the callback for messages from the C# host (CefSharp)
function responseFunction(response) {
  // Check if the response is a string (likely the machine ID)
  if (typeof response === 'string' && response.length > 10) {
    console.log("Received Machine ID from host:", response);
    // If we are in the initial auth flow, store the ID and try auto-login
    if (isAuthenticating && !currentMachineId) {
      currentMachineId = response;
      tryAutoLogin(currentMachineId);
    }
    // Always update the UI element if it exists
    const idEl = document.getElementById("machineIdDisplay");
    if (idEl) idEl.textContent = "Machine ID: " + response;
    return;
  }

  // --- Original version check logic remains below ---
  checked = true;
  if (response === true) {
    // up-to-date, do nothing special
    return;
  } else {
    // Outdated dialog
    const dialog = document.getElementById("SEB_Hijack");
    // (The outdated dialog HTML is omitted here for brevity but would be the same as in your original script)
    // ...
    setupEventListeners(); // Re-add event listeners if you change the innerHTML
  }
}

// --- UI & Event Listeners Setup ---

function setupEventListeners() {
  const closeBtn = document.getElementById("closeButton");
  if (closeBtn) closeBtn.addEventListener("click", () => document.getElementById("SEB_Hijack").close());

  const openBtn = document.getElementById("openUrlButton");
  if (openBtn) openBtn.addEventListener("click", () => {
    let url = document.getElementById("urlInput").value;
    if (url && !url.startsWith("https://") && !url.startsWith("http://")) {
      url = "https://" + url;
    }
    window.open(url, "_blank");
    document.getElementById("SEB_Hijack").close();
  });

  const exitBtn = document.getElementById("exitSEB");
  if (exitBtn) exitBtn.onclick = () => CefSharp.PostMessage({ type: "exitSEB" });

  const googleBtn = document.getElementById("googleButton");
  if (googleBtn) googleBtn.addEventListener("click", () => {
    window.open("https://google.com", "_blank");
    document.getElementById("SEB_Hijack").close();
  });
  
  const chatgptBtn = document.getElementById("chatgptButton");
  if (chatgptBtn) chatgptBtn.addEventListener("click", () => {
    window.open("https://chatgpt.com/", "_blank");
    document.getElementById("SEB_Hijack").close();
  });
}

function setupKeyDialogListeners() {
  const closeKeyBtn = document.getElementById("closeKeyButton");
  if (closeKeyBtn) closeKeyBtn.addEventListener("click", () => {
    document.getElementById("SEB_Key").close();
    isAuthenticating = false; // Allow retrying with F9
  });

  const submitKeyBtn = document.getElementById("submitKeyButton");
  if (submitKeyBtn) submitKeyBtn.addEventListener("click", activateWithKey);

  const keyInput = document.getElementById("keyInput");
  if (keyInput) keyInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") activateWithKey();
  });
}

// --- Helper Functions ---
function version(version) {
  CefSharp.PostMessage({ version: version });
}

function showurl() {
  const url = window.location.href;
  document.getElementById("urlInput").value = url;
}

// --- Initialization ---

// Create the key dialog element
const keyDialog = document.createElement("dialog");
keyDialog.innerHTML = keyDialogInnerHTML;
keyDialog.id = "SEB_Key"; // Renamed from SEB_Password
document.body.appendChild(keyDialog);

// Create the main dialog element
const mainDialog = document.createElement("dialog");
mainDialog.innerHTML = dialogInnerHTML;
mainDialog.id = "SEB_Hijack";
document.body.appendChild(mainDialog);

// Create and append a style element (using your original styles)
const style = document.createElement("style");
style.textContent = `
  /* ALL YOUR ORIGINAL CSS STYLES GO HERE... */
  /* No changes are needed in the CSS itself. */
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
  .submit-btn:disabled {
    cursor: not-allowed;
    background: #555;
    box-shadow: none;
  }

  .submit-btn:hover:not(:disabled) {
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
setupKeyDialogListeners();
