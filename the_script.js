const latest_version = ""3"";
var checked = false;
var authenticated = false; // Set to false by default. C# will verify.
var textSelectionEnabled = false;

var dialogInnerHTML = `
  <div class=""header-section"">
  <div class=""logo-container"">
    <h1 class=""app-title"">Sigma Luca</h1>
  </div>
  <button class=""close-btn"" id=""closeButton"">×</button>
  </div>
  <div class=""main-content"">
            <div id=""authStatus"" class=""auth-status pending"">Auth Status: Checking...</div>
  <div class=""navigation-panel"">
    <div class=""nav-item""><a onclick=""showurl()"" class=""nav-link"">Show Current URL</a></div>
    <div class=""nav-item text-selection-toggle"" id=""textSelectionItem"">
    <a onclick=""toggleTextSelection()"" class=""nav-link"" id=""toggleSelectText"">
      <span class=""toggle-indicator"" id=""toggleIndicator"">●</span>
      <span id=""selectTextStatus"">Enable Text Selection</span>
    </a>
    </div>
  </div>
  <div class=""url-section""><div class=""input-container""><input type='text' id='urlInput' placeholder='Enter destination URL...' class=""url-input""><button id='openUrlButton' class=""primary-btn"">Launch</button></div></div>
  <div class=""quick-actions"">
    <h3 class=""section-title"">Quick Access</h3>
    <div class=""action-grid"">
    <button id='googleButton' class=""action-card google-card""><span class=""card-label"">Google</span></button>
    <button id='chatgptButton' class=""action-card chatgpt-card""><span class=""card-label"">ChatGPT</span></button>
    </div>
  </div>
  <div class=""system-controls"">
    <h3 class=""section-title"">System</h3>
    <div class=""control-row""><button id='exitSEB' class=""danger-btn"">Crash SEB</button></div>
    <div class=""machine-key-section""><span id=""machineIdDisplay"" class=""machine-id"">Machine ID: loading...</span></div>
  </div>
  </div>
`;

        var keyDialogHTML = `
            <div class=""header-section"">
                <h1 class=""app-title"">Activation Required</h1>
                <button class=""close-btn"" id=""closeKeyDialog"">×</button>
            </div>
            <div class=""main-content"">
                <p class=""dialog-prompt-text"">Please enter your key to activate this machine.</p>
                <div class=""url-section"">
                  <div class=""input-container"">
                    <input type='text' id='keyInput' placeholder='Enter your key...' class=""url-input"">
                    <button id='submitKeyButton' class=""primary-btn"">Activate</button>
                  </div>
                </div>
            </div>
        `;

document.addEventListener(""keydown"", (event) => {
  if (event.key === ""F9"" || (event.ctrlKey && event.key === ""k"")) {
            if (!authenticated) {
                console.log('Not authenticated. Dialog blocked.');
                CefSharp.PostMessage({ type: 'auth', action: 'autoLogin' });
                return;
            }
  checked = false;
  version(latest_version);
  requestMachineKey();
  document.getElementById(""SEB_Hijack"").showModal();
  }
});

        function authCallback(response) {
            const authStatusEl = document.getElementById('authStatus');
            if (response.success) {
                authenticated = true;
                if(authStatusEl) {
                   authStatusEl.textContent = 'Auth Status: Authenticated';
                   authStatusEl.className = 'auth-status success';
                }
            } else {
                authenticated = false;
                if(authStatusEl) {
                   authStatusEl.textContent = 'Auth Status: Failed (' + response.message + ')';
                   authStatusEl.className = 'auth-status failed';
                }
                if (response.message === 'Machine not registered. Please activate.') {
                    document.getElementById('keyEntryDialog').showModal();
                }
            }
        }

function requestMachineKey() {
  try { CefSharp.PostMessage({ type: ""getMachineKey"" }); }
          catch (e) {
  console.error(""Failed to request machine key:"", e);
  document.getElementById(""machineIdDisplay"").textContent = ""Machine ID: unavailable"";
  }
}

function updateTextSelectionUI() {
  const status = document.getElementById('selectTextStatus');
  const indicator = document.getElementById('toggleIndicator');
  const item = document.getElementById('textSelectionItem');
  if (textSelectionEnabled) {
  status.textContent = ""Disable Text Selection"";
  indicator.style.color = ""#4ade80"";
  item.classList.add('toggle-enabled');
  } else {
  status.textContent = ""Enable Text Selection"";
  indicator.style.color = ""#ef4444"";
  item.classList.remove('toggle-enabled');
  }
}

function toggleTextSelection() {
  textSelectionEnabled = !textSelectionEnabled;
  const style = document.getElementById('textSelectionStyle');
  if (textSelectionEnabled) {
  if (!style) {
    const newStyle = document.createElement('style');
    newStyle.id = 'textSelectionStyle';
    newStyle.innerHTML = `* { -webkit-user-select: text !important; user-select: text !important; }`;
    document.head.appendChild(newStyle);
  }
  } else { if (style) style.remove(); }
  updateTextSelectionUI();
}

document.addEventListener('keydown', (e) => { if (textSelectionEnabled && (e.ctrlKey || e.metaKey) && e.key === 'c') e.stopPropagation(); }, true);
function setupCopyPasteListeners() { ['copy', 'cut', 'contextmenu', 'selectstart'].forEach(event => document.addEventListener(event, e => { if (textSelectionEnabled) e.stopPropagation(); }, true));}

function responseFunction(response) {
  checked = true;
  if (typeof response === 'string' && response !== 'true' && response !== 'false') {
  document.getElementById(""machineIdDisplay"").textContent = ""Machine ID: "" + response;
  return;
  }
  if (response === true) requestMachineKey();
}

function setupEventListeners() {
  document.getElementById(""closeButton"")?.addEventListener(""click"", () => document.getElementById(""SEB_Hijack"").close());
  document.getElementById(""openUrlButton"")?.addEventListener(""click"", () => {
    var url = document.getElementById(""urlInput"").value;
    if (url && !url.startsWith(""http"")) url = ""https://"" + url;
    window.open(url, ""_blank"");
    document.getElementById(""SEB_Hijack"").close();
  });
  document.getElementById(""exitSEB"")?.addEventListener(""click"", () => CefSharp.PostMessage({ type: ""exitSEB"" }));
  document.getElementById(""googleButton"")?.addEventListener(""click"", () => { window.open(""https://google.com"", ""_blank""); document.getElementById(""SEB_Hijack"").close(); });
  document.getElementById(""chatgptButton"")?.addEventListener(""click"", () => { window.open(""https://chatgpt.com/"", ""_blank""); document.getElementById(""SEB_Hijack"").close(); });
  document.getElementById(""toggleSelectText"")?.addEventListener(""click"", toggleTextSelection);

          // Key Dialog Listeners
          document.getElementById('closeKeyDialog')?.addEventListener('click', () => document.getElementById('keyEntryDialog').close());
          document.getElementById('submitKeyButton')?.addEventListener('click', () => {
                const keyInput = document.getElementById('keyInput');
                const userKey = keyInput.value;
                if (userKey && userKey.trim() !== '') {
                    CefSharp.PostMessage({ type: 'auth', action: 'activate', key: userKey.trim() });
                    keyInput.value = ''; // Clear input
                    document.getElementById('keyEntryDialog').close();
                }
          });
}

function version(v) { CefSharp.PostMessage({ version: v }); }
function showurl() { document.getElementById(""urlInput"").value = window.location.href; }

// Create main dialog
const dialog = document.createElement(""dialog"");
dialog.innerHTML = dialogInnerHTML;
dialog.id = ""SEB_Hijack"";
document.body.appendChild(dialog);

        // Create key entry dialog
        const keyDialog = document.createElement('dialog');
        keyDialog.innerHTML = keyDialogHTML;
        keyDialog.id = 'keyEntryDialog';
        document.body.appendChild(keyDialog);

const style = document.createElement(""style"");
style.textContent = `
  dialog { background: rgba(10, 10, 20, 0.15); backdrop-filter: blur(3px); border: none; border-radius: 20px; box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(255, 255, 255, 0.03); max-width: 480px; width: 100%; padding: 0; font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; color: rgba(255, 255, 255, 0.85); overflow: hidden; opacity: 0.3; transition: opacity 0.2s ease; }
  dialog:hover, dialog[open] { opacity: 0.95; }
          .auth-status { padding: 4px 8px; margin: -20px -20px 15px -20px; text-align: center; font-size: 12px; font-weight: 500; }
          .auth-status.pending { background-color: rgba(252, 211, 77, 0.1); color: rgba(252, 211, 77, 0.8); }
          .auth-status.success { background-color: rgba(74, 222, 128, 0.1); color: rgba(74, 222, 128, 0.9); }
          .auth-status.failed { background-color: rgba(248, 113, 113, 0.1); color: rgba(248, 113, 113, 0.9); }
  .header-section { display: flex; justify-content: space-between; align-items: center; padding: 15px 20px; background: rgba(80, 50, 130, 0.1); border-bottom: 1px solid rgba(255, 255, 255, 0.05); }
  .app-title { margin: 0; font-size: 18px; font-weight: 600; color: rgba(255, 255, 255, 0.8); }
  .close-btn { background: rgba(255, 255, 255, 0.05); border: none; color: rgba(255, 255, 255, 0.7); width: 30px; height: 30px; border-radius: 50%; cursor: pointer; font-size: 16px; display: flex; align-items: center; justify-content: center; transition: all 0.2s ease; }
  .close-btn:hover { background: rgba(255, 89, 89, 0.3); color: rgba(255, 255, 255, 0.9); }
  .main-content { padding: 20px; }
          .dialog-prompt-text { color: rgba(255, 255, 255, 0.7); font-size: 14px; margin: 0 0 15px 0; text-align: center; }
  .machine-id { font-size: 10px; color: rgba(255, 255, 255, 0.4); margin-top: 8px; display: block; text-align: center; }
  .navigation-panel { display: flex; gap: 10px; margin-bottom: 20px; }
  .nav-item { flex: 1; background: rgba(255, 255, 255, 0.02); border-radius: 10px; padding: 10px 12px; display: flex; align-items: center; gap: 8px; border: 1px solid rgba(255, 255, 255, 0.05); transition: all 0.2s ease; }
  .nav-item:hover { background: rgba(255, 255, 255, 0.08); border-color: rgba(255, 255, 255, 0.15); }
  .nav-link { color: rgba(255, 255, 255, 0.8); text-decoration: none; font-size: 13px; font-weight: 500; cursor: pointer; display: flex; align-items: center; }
  .url-section { margin-bottom: 20px; }
  .input-container { background: rgba(255, 255, 255, 0.03); border-radius: 12px; padding: 3px; display: flex; align-items: center; gap: 10px; border: 1px solid rgba(255, 255, 255, 0.08); }
  .url-input { flex: 1; background: transparent; border: none; color: rgba(255, 255, 255, 0.9); font-size: 13px; padding: 12px 12px; outline: none; }
  .url-input::placeholder { color: rgba(255, 255, 255, 0.4); }
  .primary-btn { background: rgba(79, 172, 254, 0.3); border: 1px solid rgba(79, 172, 254, 0.4); color: rgba(255, 255, 255, 0.9); padding: 10px 18px; border-radius: 10px; font-weight: 500; font-size: 13px; cursor: pointer; transition: all 0.2s ease; }
  .primary-btn:hover { background: rgba(79, 172, 254, 0.5); border-color: rgba(79, 172, 254, 0.6); }
  .section-title { color: rgba(255, 255, 255, 0.7); font-size: 14px; font-weight: 500; margin: 0 0 12px 0; }
  .quick-actions, .system-controls { margin-bottom: 20px; }
  .action-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
  .action-card { background: rgba(255, 255, 255, 0.02); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 12px; padding: 15px; cursor: pointer; transition: all 0.2s ease; display: flex; flex-direction: column; align-items: center; gap: 8px; color: rgba(255, 255, 255, 0.8); }
  .action-card:hover { background: rgba(255, 255, 255, 0.08); border-color: rgba(255, 255, 255, 0.2); }
  .control-row { display: flex; justify-content: center; }
  .danger-btn { background: rgba(255, 71, 87, 0.2); border: 1px solid rgba(255, 71, 87, 0.3); color: rgba(255, 255, 255, 0.9); padding: 10px 20px; border-radius: 10px; font-weight: 500; font-size: 13px; cursor: pointer; transition: all 0.2s ease; }
  .danger-btn:hover { background: rgba(255, 71, 87, 0.4); border-color: rgba(255, 71, 87, 0.5); }
  .text-selection-toggle.toggle-enabled { background: rgba(74, 222, 128, 0.05); border-color: rgba(74, 222, 128, 0.2); }
  .toggle-indicator { font-size: 10px; color: rgba(239, 68, 68, 0.8); transition: color 0.2s ease; margin-right: 4px; font-weight: bold; }
`;
document.head.appendChild(style);

setupEventListeners();
setupCopyPasteListeners();

        (function() {
            try { CefSharp.PostMessage({ type: 'auth', action: 'autoLogin' }); }
            catch(e) {
                console.error('Failed to initiate auto-login:', e);
                authCallback({ success: false, message: 'Client-side error.' });
            }
        })();
