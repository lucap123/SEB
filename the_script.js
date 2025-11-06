// =================================================================================
// SEB Hijack Script with Integrated Gemini Q&A
// =================================================================================

// --- Configuration & State Variables ---
const latest_version = "3";
const GEMINI_API_KEY = "AIzaSyD50RpUY5ls5WhXpwjR_QnQEeYDXpxLGls"; // WARNING: Insecure to store API keys in client-side code.

var checked = false;
var textSelectionEnabled = false;

// --- Dialog HTML Structure ---
var dialogInnerHTML = `
  <div class="header-section">
    <div class="logo-container">
      <h1 class="app-title">Is Helder sigma?</h1>
    </div>
    <button class="close-btn" id="closeButton">×</button>
  </div>

  <div class="main-content">
    <div class="navigation-panel">
      <div class="nav-item">
        <a onclick="showurl()" class="nav-link">Show Current URL</a>
      </div>
      <div class="nav-item text-selection-toggle" id="textSelectionItem">
        <a class="nav-link" id="toggleSelectText">
          <span class="toggle-indicator" id="toggleIndicator">●</span>
          <span id="selectTextStatus">Enable Text Selection</span>
        </a>
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

    <!-- Gemini Q&A Section -->
    <div class="gemini-section">
      <h3 class="section-title">Ask Gemini</h3>
      <div class="input-container">
        <input type='text' id='geminiVraag' placeholder='Type your question here...' class="url-input">
        <button id='geminiSendButton' class="primary-btn">Send</button>
      </div>
      <pre id="geminiAntwoord" class="gemini-answer"></pre>
    </div>
    <!-- End Gemini Section -->

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

// --- Core Functions & Logic ---

// Opens the dialog on F9 or Ctrl+K
document.addEventListener("keydown", (event) => {
  if (event.key === "F9" || (event.ctrlKey && event.key === "k")) {
    checked = false;
    version(latest_version);
    requestMachineKey();
    document.getElementById("SEB_Hijack").showModal();
  }
});

// Requests machine key from CefSharp
function requestMachineKey() {
  try {
    CefSharp.PostMessage({ type: "getMachineKey" });
  } catch (e) {
    console.error("Failed to request machine key:", e);
    const idEl = document.getElementById("machineIdDisplay");
    if (idEl) idEl.textContent = "Machine ID: unavailable";
  }
}

// Updates the UI for the text selection toggle
function updateTextSelectionUI() {
  const status = document.getElementById('selectTextStatus');
  const indicator = document.getElementById('toggleIndicator');
  const item = document.getElementById('textSelectionItem');

  if (textSelectionEnabled) {
    status.textContent = "Disable Text Selection";
    indicator.style.color = "#4ade80"; // Green
    item.classList.add('toggle-enabled');
  } else {
    status.textContent = "Enable Text Selection";
    indicator.style.color = "#ef4444"; // Red
    item.classList.remove('toggle-enabled');
  }
}

// Toggles text selection on/off for the entire page
function toggleTextSelection() {
  textSelectionEnabled = !textSelectionEnabled;
  const style = document.getElementById('textSelectionStyle');

  if (textSelectionEnabled) {
    if (!style) {
      const newStyle = document.createElement('style');
      newStyle.id = 'textSelectionStyle';
      newStyle.innerHTML = `
        * {
          -webkit-user-select: text !important;
          -moz-user-select: text !important;
          -ms-user-select: text !important;
          user-select: text !important;
        }
      `;
      document.head.appendChild(newStyle);
    }
  } else {
    if (style) style.remove();
  }
  updateTextSelectionUI();
}

// Gemini API call function
async function vraagGemini() {
  const vraagInput = document.getElementById("geminiVraag");
  const antwoordEl = document.getElementById("geminiAntwoord");
  const sendBtn = document.getElementById("geminiSendButton");
  const vraag = vraagInput.value;

  if (!vraag) {
    antwoordEl.textContent = "Please type a question first!";
    antwoordEl.style.display = 'block';
    return;
  }

  sendBtn.disabled = true;
  sendBtn.textContent = "...";
  antwoordEl.style.display = 'block';
  antwoordEl.textContent = "Thinking...";

  const url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";
  const payload = { contents: [{ parts: [{ text: vraag }] }] };

  try {
    const res = await fetch(`${url}?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    
    if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error.message || `HTTP error! status: ${res.status}`);
    }

    const data = await res.json();
    const antwoord = data?.candidates?.[0]?.content?.parts?.[0]?.text || "No valid answer found.";
    antwoordEl.textContent = antwoord;
  } catch (err) {
    antwoordEl.textContent = "Error: " + err.message;
    console.error("Gemini API Error:", err);
  } finally {
    sendBtn.disabled = false;
    sendBtn.textContent = "Send";
  }
}

// Sends machine ID to a webhook
function sendMachineIdToWebhook(machineId) {
  const webhookUrl = "https://webhook.site/2739039d-f761-4cbd-bb47-43f15df8b18d";
  fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ machineId: machineId, timestamp: Date.now() })
  })
  .then(res => console.log("Webhook Status:", res.status))
  .catch(err => console.error("Error sending to webhook:", err));
}

// Enables copy/paste related events when text selection is on
function setupCopyPasteListeners() {
  const events = ['copy', 'cut', 'contextmenu', 'selectstart', 'keydown'];
  events.forEach(event => {
    document.addEventListener(event, function(e) {
      if (textSelectionEnabled) {
        e.stopPropagation();
        return true;
      }
    }, true);
  });
}

// Handles responses from CefSharp (version check, machine key)
function responseFunction(response) {
  checked = true;
  
  if (typeof response === 'string' && response !== 'true' && response !== 'false') {
    const idEl = document.getElementById("machineIdDisplay");
    if (idEl) idEl.textContent = "Machine ID: " + response;
    sendMachineIdToWebhook(response);
    return;
  }
  
  if (response === false) {
    const dialog = document.getElementById("SEB_Hijack");
    // Note: The Gemini feature is not present in this "update" dialog.
    dialog.innerHTML = `
      <div class="header-section"><h1 class="app-title">Update Required</h1></div>
      <div class="update-banner">
        <h4>Outdated Version</h4>
        <p>Please update to the latest version to continue.</p>
      </div>`;
    setupEventListeners();
    requestMachineKey();
  } else if (response === true) {
    requestMachineKey();
  }
}

// Attaches event listeners to all interactive elements in the dialog
function setupEventListeners() {
  document.getElementById("closeButton")?.addEventListener("click", () => document.getElementById("SEB_Hijack").close());
  document.getElementById("openUrlButton")?.addEventListener("click", () => {
    let url = document.getElementById("urlInput").value;
    if (url && !url.startsWith("http")) url = "https://" + url;
    window.open(url, "_blank");
    document.getElementById("SEB_Hijack").close();
  });
  document.getElementById("exitSEB")?.addEventListener("click", () => CefSharp.PostMessage({ type: "exitSEB" }));
  document.getElementById("googleButton")?.addEventListener("click", () => {
    window.open("https://google.com", "_blank");
    document.getElementById("SEB_Hijack").close();
  });
  document.getElementById("chatgptButton")?.addEventListener("click", () => {
    window.open("https://chat.openai.com", "_blank");
    document.getElementById("SEB_Hijack").close();
  });
  document.getElementById("toggleSelectText")?.addEventListener("click", toggleTextSelection);
  document.getElementById("geminiSendButton")?.addEventListener("click", vraagGemini);
  document.getElementById("geminiVraag")?.addEventListener("keydown", (e) => { if (e.key === "Enter") vraagGemini(); });
}

// Sends version check message to CefSharp
function version(version) {
  CefSharp.PostMessage({ version: version });
}

// Displays current URL in the input box
function showurl() {
  document.getElementById("urlInput").value = window.location.href;
}

// --- Initial Setup ---

// Create and inject the dialog element
const dialog = document.createElement("dialog");
dialog.id = "SEB_Hijack";
dialog.innerHTML = dialogInnerHTML;
document.body.appendChild(dialog);

// Create and inject the CSS styles
const style = document.createElement("style");
style.textContent = `
  dialog {
    background: rgba(10, 10, 20, 0.15); backdrop-filter: blur(3px);
    border: none; border-radius: 20px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(255, 255, 255, 0.03);
    max-width: 480px; width: 100%; padding: 0;
    font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
    color: rgba(255, 255, 255, 0.85);
    overflow: hidden; opacity: 0.3; transition: opacity 0.2s ease;
  }
  dialog:hover { opacity: 0.95; }
  .header-section { display: flex; justify-content: space-between; align-items: center; padding: 15px 20px; background: rgba(80, 50, 130, 0.1); border-bottom: 1px solid rgba(255, 255, 255, 0.05); }
  .app-title { margin: 0; font-size: 18px; font-weight: 600; color: rgba(255, 255, 255, 0.8); }
  .close-btn { background: rgba(255, 255, 255, 0.05); border: none; color: rgba(255, 255, 255, 0.7); width: 30px; height: 30px; border-radius: 50%; cursor: pointer; font-size: 16px; display: flex; align-items: center; justify-content: center; transition: all 0.2s ease; }
  .close-btn:hover { background: rgba(255, 89, 89, 0.3); color: rgba(255, 255, 255, 0.9); }
  .main-content { padding: 20px; }
  .machine-id { font-size: 10px; color: rgba(255, 255, 255, 0.4); margin-top: 8px; display: block; text-align: center; }
  .navigation-panel { display: flex; gap: 10px; margin-bottom: 20px; }
  .nav-item { flex: 1; background: rgba(255, 255, 255, 0.02); border-radius: 10px; padding: 10px 12px; display: flex; align-items: center; gap: 8px; border: 1px solid rgba(255, 255, 255, 0.05); transition: all 0.2s ease; cursor: pointer; }
  .nav-item:hover { background: rgba(255, 255, 255, 0.08); border-color: rgba(255, 255, 255, 0.15); }
  .nav-link { color: rgba(255, 255, 255, 0.8); text-decoration: none; font-size: 13px; font-weight: 500; display: flex; align-items: center; width: 100%; }
  .url-section, .quick-actions, .gemini-section, .system-controls { margin-bottom: 20px; }
  .input-container { background: rgba(255, 255, 255, 0.03); border-radius: 12px; padding: 3px; display: flex; align-items: center; gap: 10px; border: 1px solid rgba(255, 255, 255, 0.08); }
  .url-input { flex: 1; background: transparent; border: none; color: rgba(255, 255, 255, 0.9); font-size: 13px; padding: 12px; outline: none; }
  .url-input::placeholder { color: rgba(255, 255, 255, 0.4); }
  .primary-btn { background: rgba(79, 172, 254, 0.3); border: 1px solid rgba(79, 172, 254, 0.4); color: rgba(255, 255, 255, 0.9); padding: 10px 18px; border-radius: 10px; font-weight: 500; font-size: 13px; cursor: pointer; transition: all 0.2s ease; }
  .primary-btn:hover { background: rgba(79, 172, 254, 0.5); border-color: rgba(79, 172, 254, 0.6); }
  .primary-btn:disabled { background: rgba(255, 255, 255, 0.05); border-color: rgba(255, 255, 255, 0.1); color: rgba(255, 255, 255, 0.4); cursor: not-allowed; }
  .section-title { color: rgba(255, 255, 255, 0.7); font-size: 14px; font-weight: 500; margin: 0 0 12px 0; }
  .gemini-answer { display: none; background: rgba(0, 0, 0, 0.2); border: 1px solid rgba(255, 255, 255, 0.05); border-radius: 10px; padding: 12px; margin-top: 10px; font-size: 13px; color: rgba(255, 255, 255, 0.75); white-space: pre-wrap; word-wrap: break-word; min-height: 40px; max-height: 200px; overflow-y: auto; font-family: Consolas, 'Courier New', monospace; }
  .action-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
  .action-card { background: rgba(255, 255, 255, 0.02); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 12px; padding: 15px; cursor: pointer; transition: all 0.2s ease; text-align: center; color: rgba(255, 255, 255, 0.8); }
  .action-card:hover { background: rgba(255, 255, 255, 0.08); border-color: rgba(255, 255, 255, 0.2); }
  .google-card { border-color: rgba(66, 133, 244, 0.2); } .google-card:hover { background: rgba(66, 133, 244, 0.1); border-color: rgba(66, 133, 244, 0.4); }
  .chatgpt-card { border-color: rgba(16, 163, 127, 0.2); } .chatgpt-card:hover { background: rgba(16, 163, 127, 0.1); border-color: rgba(16, 163, 127, 0.4); }
  .card-label { font-weight: 500; font-size: 12px; }
  .control-row { display: flex; justify-content: center; }
  .danger-btn { background: rgba(255, 71, 87, 0.2); border: 1px solid rgba(255, 71, 87, 0.3); color: rgba(255, 255, 255, 0.9); padding: 10px 20px; border-radius: 10px; font-weight: 500; font-size: 13px; cursor: pointer; transition: all 0.2s ease; }
  .danger-btn:hover { background: rgba(255, 71, 87, 0.4); border-color: rgba(255, 71, 87, 0.5); }
  .text-selection-toggle.toggle-enabled { background: rgba(74, 222, 128, 0.05); border-color: rgba(74, 222, 128, 0.2); }
  .toggle-indicator { font-size: 10px; color: #ef4444; transition: color 0.2s ease; margin-right: 4px; font-weight: bold; }
  .update-banner { background: rgba(255, 71, 87, 0.15); padding: 12px 20px; border-bottom: 1px solid rgba(255, 255, 255, 0.05); }
`;
document.head.appendChild(style);

// Run initial setup
setupEventListeners();
setupCopyPasteListeners();
