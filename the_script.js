// NEW: Configuration for the licensing API
const API_ENDPOINT = "https://68c676d90016b02b3ad8.fra.appwrite.run/";
let machineId = null; // NEW: A variable to store the machine ID once we get it.

const latest_version = "3";
var checked = false;

// NEW: This dialog is now for License Key Activation, not a password.
var activationDialogInnerHTML = `
  <div class="header-section">
    <div class="logo-container">
      <h1 class="app-title">Sigma Luca</h1>
    </div>
    <button class="close-btn" id="closeActivationButton">×</button>
  </div>
  
  <div class="password-content">
    <h2 class="password-title">License Activation Required</h2>
    <p class="password-subtitle">Please enter your license key to activate this machine.</p>
    
    <div class="password-input-container">
      <input type="text" id="licenseKeyInput" placeholder="Enter license key..." class="password-input">
      <button id="submitLicenseKeyButton" class="submit-btn">Activate</button>
    </div>
    
    <div id="activationError" class="password-error" style="display: none;">
      <span class="error-icon">❌</span>
      <span id="activationErrorText" class="error-text">Invalid key. Please try again.</span>
    </div>
  </div>
`;

// Original main dialog content (unchanged)
var dialogInnerHTML = `
  <div class="header-section">
    <div class="logo-container">
      <h1 class="app-title">Sigma Luca</h1>
    </div>
    <button class="close-btn" id="closeButton">×</button>
  </div>
  <div class="main-content">
    <div class="navigation-panel"><div class="nav-item"><a onclick="showurl()" class="nav-link">Show Current URL</a></div></div>
    <div class="url-section"><div class="input-container"><input type='text' id='urlInput' placeholder='Enter destination URL...' class="url-input"><button id='openUrlButton' class="primary-btn">Launch</button></div></div>
    <div class="quick-actions"><h3 class="section-title">Quick Access</h3><div class="action-grid"><button id='googleButton' class="action-card google-card"><span class="card-label">Google</span></button><button id='chatgptButton' class="action-card chatgpt-card"><span class="card-label">ChatGPT</span></button></div></div>
    <div class="system-controls"><h3 class="section-title">System</h3><div class="control-row"><button id='exitSEB' class="danger-btn">Crash SEB</button></div><div class="machine-key-section"><span id="machineIdDisplay" class="machine-id">Machine ID: loading...</span></div></div>
  </div>
`;


// --- NEW: API Communication Functions ---

async function tryAutoLogin(currentMachineId) {
  console.log("Attempting auto-login for machine:", currentMachineId);
  try {
    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ machineId: currentMachineId })
    });
    
    const data = await response.json();
    console.log("Auto-login response:", data);
    
    // The API returns 200 OK on success
    if (response.ok && data.success) {
      return { success: true, message: data.message };
    } else {
      // Return the error message from the API
      return { success: false, message: data.message || "Machine not registered." };
    }
  } catch (error) {
    console.error("Network error during auto-login:", error);
    return { success: false, message: "Could not connect to the activation server." };
  }
}

async function activateWithKey(key, currentMachineId) {
  console.log("Attempting activation with key:", key);
  try {
    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ machineId: currentMachineId, key: key })
    });

    const data = await response.json();
    console.log("Activation response:", data);

    if (response.ok && data.success) {
      return { success: true, message: data.message };
    } else {
      return { success: false, message: data.message || "Activation failed." };
    }
  } catch (error) {
    console.error("Network error during activation:", error);
    return { success: false, message: "Could not connect to the activation server." };
  }
}

// --- NEW: Authentication Flow ---

// This function is called by your C# application after you request the machine key.
// It is the starting point of our entire authentication process.
function handleMachineKey(receivedMachineId) {
  machineId = receivedMachineId;
  console.log("Received Machine ID:", machineId);

  // Update the UI immediately in the main dialog (even though it's hidden)
  const idEl = document.getElementById("machineIdDisplay");
  if (idEl) idEl.textContent = "Machine ID: " + machineId;
  
  // Now, try to log in automatically
  tryAutoLogin(machineId).then(result => {
    if (result.success) {
      console.log("Auto-login successful!");
      // If successful, just show the main application.
      document.getElementById("SEB_Hijack").showModal();
    } else {
      console.log("Auto-login failed. Reason:", result.message, "Showing activation dialog.");
      // If it fails, we need to ask for a key.
      showActivationDialog();
    }
  });
}

function showActivationDialog() {
  const activationDialog = document.getElementById("SEB_Activation");
  if (activationDialog) {
    // Clear any previous input and hide errors
    document.getElementById('licenseKeyInput').value = '';
    document.getElementById('activationError').style.display = 'none';
    activationDialog.showModal();
  }
}

// Replaces the old `checkPassword` function.
function submitLicenseKey() {
  const licenseKeyInput = document.getElementById("licenseKeyInput");
  const activationError = document.getElementById("activationError");
  const errorText = document.getElementById("activationErrorText");
  const enteredKey = licenseKeyInput.value.trim();

  if (!enteredKey) {
    errorText.textContent = "Please enter a license key.";
    activationError.style.display = 'flex';
    return;
  }
  
  // Disable button to prevent multiple clicks
  document.getElementById('submitLicenseKeyButton').disabled = true;
  document.getElementById('submitLicenseKeyButton').textContent = "Activating...";

  activateWithKey(enteredKey, machineId).then(result => {
    // Re-enable button
    document.getElementById('submitLicenseKeyButton').disabled = false;
    document.getElementById('submitLicenseKeyButton').textContent = "Activate";
  
    if (result.success) {
      console.log("Activation successful!");
      document.getElementById("SEB_Activation").close();
      document.getElementById("SEB_Hijack").showModal();
    } else {
      console.log("Activation failed:", result.message);
      errorText.textContent = result.message; // Show the specific error from the API
      activationError.style.display = "flex";
      licenseKeyInput.value = "";
      licenseKeyInput.focus();
    }
  });
}


// --- MODIFIED Event Listeners and Setup ---

// MODIFIED: F9 now just asks for the machine key. The `handleMachineKey` function takes over from there.
document.addEventListener("keydown", (event) => {
  if (event.key === "F9" || (event.ctrlKey && event.key === "k")) {
    version(latest_version);
    // This is the trigger. Ask C# for the key. C# will then call `handleMachineKey`.
    CefSharp.PostMessage({ type: "getMachineKey" });
  }
});


// This function is for your version check, it is left as is.
function responseFunction(response) {
  checked = true;
  if (response === true || response === false) {
    // Handle version logic if necessary, but auth is separate now.
  }
}

function setupEventListeners() {
  // Main Dialog event listeners (unchanged)
  document.getElementById("closeButton")?.addEventListener("click", () => document.getElementById("SEB_Hijack").close());
  document.getElementById("openUrlButton")?.addEventListener("click", () => {
    let url = document.getElementById("urlInput").value;
    if (url && !url.startsWith("https://") && !url.startsWith("http://")) url = "https://" + url;
    if (url) window.open(url, "_blank");
    document.getElementById("SEB_Hijack").close();
  });
  document.getElementById("exitSEB")?.addEventListener("click", () => CefSharp.PostMessage({ type: "exitSEB" }));
  document.getElementById("googleButton")?.addEventListener("click", () => { window.open("https://google.com", "_blank"); document.getElementById("SEB_Hijack").close(); });
  document.getElementById("chatgptButton")?.addEventListener("click", () => { window.open("https://chatgpt.com/", "_blank"); document.getElementById("SEB_Hijack").close(); });
}

// MODIFIED: This function now sets up listeners for the activation dialog.
function setupActivationEventListeners() {
  document.getElementById("closeActivationButton")?.addEventListener("click", () => document.getElementById("SEB_Activation").close());
  document.getElementById("submitLicenseKeyButton")?.addEventListener("click", submitLicenseKey);
  document.getElementById("licenseKeyInput")?.addEventListener("keypress", (e) => {
    if (e.key === "Enter") submitLicenseKey();
  });
}

function version(version) {
  CefSharp.PostMessage({ version: version });
}

function showurl() {
  var url = window.location.href;
  document.getElementById("urlInput").value = url;
}

// --- HTML and CSS Injection (MODIFIED) ---

// Create the activation dialog element
const activationDialog = document.createElement("dialog");
activationDialog.innerHTML = activationDialogInnerHTML;
activationDialog.id = "SEB_Activation"; // Changed ID
document.body.appendChild(activationDialog);

// Create the main dialog element
const dialog = document.createElement("dialog");
dialog.innerHTML = dialogInnerHTML;
dialog.id = "SEB_Hijack";
document.body.appendChild(dialog);

// Create and append a style element for styling (styles are fine, no changes needed)
const style = document.createElement("style");
style.textContent = `
  dialog { background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%); border: none; border-radius: 20px; box-shadow: 0 25px 50px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.1); max-width: 480px; width: 100%; padding: 0; font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; color: #ffffff; backdrop-filter: blur(10px); overflow: hidden; }
  .header-section { display: flex; justify-content: space-between; align-items: center; padding: 20px 25px; background: linear-gradient(90deg, #533483, #7209b7); border-bottom: 1px solid rgba(255, 255, 255, 0.1); }
  .logo-container { display: flex; align-items: center; gap: 12px; }
  .app-title { margin: 0; font-size: 22px; font-weight: 700; background: linear-gradient(45deg, #ffffff, #e0e0e0); background-clip: text; -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
  .close-btn { background: rgba(255, 255, 255, 0.1); border: none; color: #ffffff; width: 35px; height: 35px; border-radius: 50%; cursor: pointer; font-size: 20px; display: flex; align-items: center; justify-content: center; transition: all 0.3s ease; }
  .close-btn:hover { background: rgba(255, 89, 89, 0.8); transform: scale(1.1); }
  .main-content { padding: 25px; }
  .password-content { padding: 40px 25px; text-align: center; }
  .password-title { font-size: 24px; font-weight: 700; margin-bottom: 10px; background: linear-gradient(45deg, #ffffff, #e0e0e0); background-clip: text; -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
  .machine-id { font-size: 12px; color: rgba(255, 255, 255, 0.7); margin-top: 10px; display: block; text-align: center; }
  .password-subtitle { color: rgba(255, 255, 255, 0.7); margin-bottom: 30px; font-size: 16px; }
  .password-input-container { display: flex; gap: 10px; margin-bottom: 15px; }
  .password-input { flex: 1; background: rgba(255, 255, 255, 0.08); border: 1px solid rgba(255, 255, 255, 0.15); border-radius: 12px; color: #ffffff; font-size: 16px; padding: 15px; outline: none; transition: all 0.3s ease; }
  .password-input:focus { border-color: #4facfe; box-shadow: 0 0 0 2px rgba(79, 172, 254, 0.2); }
  .password-input::placeholder { color: rgba(255, 255, 255, 0.6); }
  .submit-btn { background: linear-gradient(45deg, #4facfe, #00f2fe); border: none; color: #ffffff; padding: 15px 30px; border-radius: 12px; font-weight: 600; cursor: pointer; transition: all 0.3s ease; box-shadow: 0 4px 12px rgba(79, 172, 254, 0.3); }
  .submit-btn:hover { transform: translateY(-2px); box-shadow: 0 6px 16px rgba(79, 172, 254, 0.4); }
  .submit-btn:disabled { background: #555; cursor: not-allowed; box-shadow: none; }
  .password-error { display: flex; align-items: center; justify-content: center; gap: 8px; color: #ff4757; font-size: 14px; margin-top: 10px; }
  .error-icon { font-size: 16px; }
  .nav-item { flex: 1; background: rgba(255, 255, 255, 0.05); border-radius: 12px; padding: 12px 16px; display: flex; align-items: center; gap: 10px; border: 1px solid rgba(255, 255, 255, 0.1); transition: all 0.3s ease; }
  .nav-item:hover { background: rgba(255, 255, 255, 0.1); transform: translateY(-2px); }
  .nav-link { color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 500; cursor: pointer; }
  .url-section { margin-bottom: 25px; }
  .input-container { background: rgba(255, 255, 255, 0.08); border-radius: 15px; padding: 4px; display: flex; align-items: center; gap: 12px; border: 1px solid rgba(255, 255, 255, 0.15); }
  .url-input { flex: 1; background: transparent; border: none; color: #ffffff; font-size: 15px; padding: 15px 15px; outline: none; }
  .url-input::placeholder { color: rgba(255, 255, 255, 0.6); }
  .primary-btn { background: linear-gradient(45deg, #4facfe, #00f2fe); border: none; color: #ffffff; padding: 12px 24px; border-radius: 12px; font-weight: 600; cursor: pointer; transition: all 0.3s ease; box-shadow: 0 4px 12px rgba(79, 172, 254, 0.3); }
  .primary-btn:hover { transform: translateY(-2px); box-shadow: 0 6px 16px rgba(79, 172, 254, 0.4); }
  .section-title { color: rgba(255, 255, 255, 0.9); font-size: 16px; font-weight: 600; margin: 0 0 15px 0; display: flex; align-items: center; gap: 8px; }
  .quick-actions { margin-bottom: 25px; }
  .action-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  .action-card { background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 15px; padding: 20px; cursor: pointer; transition: all 0.3s ease; display: flex; flex-direction: column; align-items: center; gap: 10px; color: #ffffff; }
  .action-card:hover { transform: translateY(-3px); box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2); }
  .google-card { background: linear-gradient(135deg, #4285f4, #34a853); }
  .chatgpt-card { background: linear-gradient(135deg, #10a37f, #059669); }
  .card-label { font-weight: 600; font-size: 14px; }
  .system-controls { margin-bottom: 25px; }
  .danger-btn { background: linear-gradient(45deg, #ff4757, #ff3838); border: none; color: #ffffff; padding: 12px 24px; border-radius: 12px; font-weight: 600; cursor: pointer; transition: all 0.3s ease; display: flex; align-items: center; gap: 8px; box-shadow: 0 4px 12px rgba(255, 71, 87, 0.3); }
  .danger-btn:hover { transform: translateY(-2px); box-shadow: 0 6px 16px rgba(255, 71, 87, 0.4); }
`;
document.head.appendChild(style);

// Setup initial event listeners for both dialogs
setupEventListeners();
setupActivationEventListeners(); // MODIFIED
