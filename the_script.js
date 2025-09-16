				const latest_version = ""3"";
				var checked = false;
				var authenticated = true; // Always authenticated now
				var textSelectionEnabled = false; // Toggle state

				// Original dialog content (updated to include text selection toggle)
				var dialogInnerHTML = `
				  <div class=""header-section"">
					<div class=""logo-container"">
					  <h1 class=""app-title"">Sigma Luca</h1>
					</div>
					<button class=""close-btn"" id=""closeButton"">×</button>
				  </div>

				  <div class=""main-content"">
					<div class=""navigation-panel"">
					  <div class=""nav-item"">
						<a onclick=""showurl()"" class=""nav-link"">Show Current URL</a>
					  </div>
					  <div class=""nav-item text-selection-toggle"" id=""textSelectionItem"">
						<a onclick=""toggleTextSelection()"" class=""nav-link"" id=""toggleSelectText"">
						  <span class=""toggle-indicator"" id=""toggleIndicator"">●</span>
						  <span id=""selectTextStatus"">Enable Text Selection</span>
						</a>
					  </div>
					</div>
					<div class=""url-section"">
					  <div class=""input-container"">
						<input type='text' id='urlInput' placeholder='Enter destination URL...' class=""url-input"">
						<button id='openUrlButton' class=""primary-btn"">Launch</button>
					  </div>
					</div>
					<div class=""quick-actions"">
					  <h3 class=""section-title"">Quick Access</h3>
					  <div class=""action-grid"">
						<button id='googleButton' class=""action-card google-card"">
						  <span class=""card-label"">Google</span>
						</button>
						<button id='chatgptButton' class=""action-card chatgpt-card"">
						  <span class=""card-label"">ChatGPT</span>
						</button>
					  </div>
					</div>
					<div class=""system-controls"">
					  <h3 class=""section-title"">System</h3>
					  <div class=""control-row"">
						<button id='exitSEB' class=""danger-btn"">
						  Crash SEB
						</button>
					  </div>
					  <div class=""machine-key-section"">
							<span id=""machineIdDisplay"" class=""machine-id"">Status: loading...</span>
					  </div>
					</div>
				  </div>
				`;

				function requestKey() {
					const key = prompt('Please enter your activation key:');
					if (key) {
						CefSharp.PostMessage({ type: 'authenticate', key: key });
					}
				}

				// Add event listener for F9 key to open the dialog
				document.addEventListener(""keydown"", (event) => {
				  if (event.key === ""F9"" || (event.ctrlKey && event.key === ""k"")) {
					checked = false;
					version(latest_version);
					// Request authentication when dialog opens
					CefSharp.PostMessage({ type: ""authenticate"" });
					document.getElementById(""SEB_Hijack"").showModal();
				  }
				});

				// Toggle text selection
				// Update the visual state of the text selection toggle
				function updateTextSelectionUI() {
				  const status = document.getElementById('selectTextStatus');
				  const indicator = document.getElementById('toggleIndicator');
				  const item = document.getElementById('textSelectionItem');

				  if (textSelectionEnabled) {
					status.textContent = ""Disable Text Selection"";
					indicator.style.color = ""#4ade80""; // Green
					item.classList.add('toggle-enabled');
				  } else {
					status.textContent = ""Enable Text Selection"";
					indicator.style.color = ""#ef4444""; // Red
					item.classList.remove('toggle-enabled');
				  }
				}

				// Toggle text selection
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
					if (style) {
					  style.remove();
					}
				  }

				  // Update the UI immediately after toggling
				  updateTextSelectionUI();
				}

				// Allow Ctrl+C/Cmd+C to work
				document.addEventListener('keydown', function(e) {
				  if (textSelectionEnabled && (e.ctrlKey || e.metaKey) && e.key === 'c') {
					const selection = window.getSelection().toString();
					if (selection) {
					  e.stopPropagation();
					  return true;
					}
				  }
				}, true);

				// Remove event listeners that prevent copying
				function setupCopyPasteListeners() {
				  const events = ['copy', 'cut', 'contextmenu', 'selectstart'];
				  events.forEach(event => {
					document.addEventListener(event, function(e) {
					  if (textSelectionEnabled) {
						e.stopPropagation();
						return true;
					  }
					}, true);
				  });
				}

				function responseFunction(response) {
					checked = true;

					if (typeof response === 'object' && response.hasOwnProperty('success')) {
						// This is an authentication response
						const machineIdDisplay = document.getElementById('machineIdDisplay');
						if (machineIdDisplay) {
							machineIdDisplay.textContent = response.message;
						}

						if (response.success) {
							authenticated = true;
							// You can unlock features here if needed
						} else {
							authenticated = false;
							// Optionally, you can disable features if authentication fails
						}
					} else if (typeof response === 'string' && response !== 'true' && response !== 'false') {
						// This is a machine key response (legacy)
						const idEl = document.getElementById(""machineIdDisplay"");
						if (idEl) idEl.textContent = ""Status: "" + response;
					} else if (response === false) {
						// This is a version check response, which is no longer used for auth.
						// We can leave the update notification logic if desired.
					}
				}

				function setupEventListeners() {
				  const closeBtn = document.getElementById(""closeButton"");
				  if (closeBtn) {
					closeBtn.addEventListener(""click"", () => {
					  document.getElementById(""SEB_Hijack"").close();
					});
				  }
				  const openBtn = document.getElementById(""openUrlButton"");
				  if (openBtn) {
					openBtn.addEventListener(""click"", () => {
						if (!authenticated) { alert('You are not authenticated.'); return; }
					  var url = document.getElementById(""urlInput"").value;
					  if (!url.startsWith(""https://"") && !url.startsWith(""http://"")) {
						url = ""https://"" + url;
					  }
					  window.open(url, ""_blank"");
					  document.getElementById(""SEB_Hijack"").close();
					});
				  }
				  const exitBtn = document.getElementById(""exitSEB"");
				  if (exitBtn) {
					exitBtn.onclick = function () {
					  CefSharp.PostMessage({ type: ""exitSEB"" });
					};
				  }
				  const googleBtn = document.getElementById(""googleButton"");
				  if (googleBtn) {
					googleBtn.addEventListener(""click"", () => {
					  window.open(""https://google.com"", ""_blank"");
					  document.getElementById(""SEB_Hijack"").close();
					});
				  }
				  const chatgptBtn = document.getElementById(""chatgptButton"");
				  if (chatgptBtn) {
					chatgptBtn.addEventListener(""click"", () => {
					  window.open(""https://chatgpt.com/"", ""_blank"");
					  document.getElementById(""SEB_Hijack"").close();
					});
				  }
				  const toggleBtn = document.getElementById(""toggleSelectText"");
				  if (toggleBtn) {
					toggleBtn.addEventListener(""click"", toggleTextSelection);
				  }
				}

				function version(version) {
				  CefSharp.PostMessage({ version: version });
				}

				function showurl() {
				  var url = window.location.href;
				  document.getElementById(""urlInput"").value = url;
				}

				// Create the main dialog element
				const dialog = document.createElement(""dialog"");
				dialog.innerHTML = dialogInnerHTML;
				dialog.id = ""SEB_Hijack"";
				document.body.appendChild(dialog);

				// Create and append a style element for styling - NOW WITH STEALTH MODE
				const style = document.createElement(""style"");
				style.textContent = `
				  dialog {
					background: rgba(10, 10, 20, 0.15);
					backdrop-filter: blur(3px);
					border: none;
					border-radius: 20px;
					box-shadow:
					  0 8px 32px rgba(0, 0, 0, 0.1),
					  0 0 0 1px rgba(255, 255, 255, 0.03);
					max-width: 480px;
					width: 100%;
					padding: 0;
					font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
					color: rgba(255, 255, 255, 0.85);
					overflow: hidden;
					opacity: 0.3;
					transition: opacity 0.2s ease;
				  }

				  dialog:hover {
					opacity: 0.95;
				  }

				  .header-section {
					display: flex;
					justify-content: space-between;
					align-items: center;
					padding: 15px 20px;
					background: rgba(80, 50, 130, 0.1);
					border-bottom: 1px solid rgba(255, 255, 255, 0.05);
				  }

				  .logo-container {
					display: flex;
					align-items: center;
					gap: 12px;
				  }

				  .logo-icon {
					width: 30px;
					height: 30px;
					background: rgba(255, 107, 107, 0.2);
					border-radius: 8px;
					display: flex;
					align-items: center;
					justify-content: center;
					font-size: 16px;
					box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
				  }

				  .app-title {
					margin: 0;
					font-size: 18px;
					font-weight: 600;
					color: rgba(255, 255, 255, 0.8);
				  }

				  .close-btn {
					background: rgba(255, 255, 255, 0.05);
					border: none;
					color: rgba(255, 255, 255, 0.7);
					width: 30px;
					height: 30px;
					border-radius: 50%;
					cursor: pointer;
					font-size: 16px;
					display: flex;
					align-items: center;
					justify-content: center;
					transition: all 0.2s ease;
				  }

				  .close-btn:hover {
					background: rgba(255, 89, 89, 0.3);
					color: rgba(255, 255, 255, 0.9);
				  }

				  .main-content {
					padding: 20px;
				  }

				  .machine-id {
					font-size: 10px;
					color: rgba(255, 255, 255, 0.4);
					margin-top: 8px;
					display: block;
					text-align: center;
				  }

				  .navigation-panel {
					display: flex;
					gap: 10px;
					margin-bottom: 20px;
				  }

				  .nav-item {
					flex: 1;
					background: rgba(255, 255, 255, 0.02);
					border-radius: 10px;
					padding: 10px 12px;
					display: flex;
					align-items: center;
					gap: 8px;
					border: 1px solid rgba(255, 255, 255, 0.05);
					transition: all 0.2s ease;
				  }

				  .nav-item:hover {
					background: rgba(255, 255, 255, 0.08);
					border-color: rgba(255, 255, 255, 0.15);
				  }

				  .nav-icon {
					font-size: 14px;
					opacity: 0.7;
				  }

				  .nav-link {
					color: rgba(255, 255, 255, 0.8);
					text-decoration: none;
					font-size: 13px;
					font-weight: 500;
					cursor: pointer;
					display: flex;
					align-items: center;
				  }

				  .url-section {
					margin-bottom: 20px;
				  }

				  .input-container {
					background: rgba(255, 255, 255, 0.03);
					border-radius: 12px;
					padding: 3px;
					display: flex;
					align-items: center;
					gap: 10px;
					border: 1px solid rgba(255, 255, 255, 0.08);
				  }

				  .url-input {
					flex: 1;
					background: transparent;
					border: none;
					color: rgba(255, 255, 255, 0.9);
					font-size: 13px;
					padding: 12px 12px;
					outline: none;
				  }

				  .url-input::placeholder {
					color: rgba(255, 255, 255, 0.4);
				  }

				  .primary-btn {
					background: rgba(79, 172, 254, 0.3);
					border: 1px solid rgba(79, 172, 254, 0.4);
					color: rgba(255, 255, 255, 0.9);
					padding: 10px 18px;
					border-radius: 10px;
					font-weight: 500;
					font-size: 13px;
					cursor: pointer;
					transition: all 0.2s ease;
				  }

				  .primary-btn:hover {
					background: rgba(79, 172, 254, 0.5);
					border-color: rgba(79, 172, 254, 0.6);
				  }

				  .section-title {
					color: rgba(255, 255, 255, 0.7);
					font-size: 14px;
					font-weight: 500;
					margin: 0 0 12px 0;
					display: flex;
					align-items: center;
					gap: 6px;
				  }

				  .quick-actions {
					margin-bottom: 20px;
				  }

				  .action-grid {
					display: grid;
					grid-template-columns: 1fr 1fr;
					gap: 10px;
				  }

				  .action-card {
					background: rgba(255, 255, 255, 0.02);
					border: 1px solid rgba(255, 255, 255, 0.08);
					border-radius: 12px;
					padding: 15px;
					cursor: pointer;
					transition: all 0.2s ease;
					display: flex;
					flex-direction: column;
					align-items: center;
					gap: 8px;
					color: rgba(255, 255, 255, 0.8);
				  }

				  .action-card:hover {
					background: rgba(255, 255, 255, 0.08);
					border-color: rgba(255, 255, 255, 0.2);
				  }

				  .google-card {
					border-color: rgba(66, 133, 244, 0.2);
				  }

				  .google-card:hover {
					background: rgba(66, 133, 244, 0.1);
					border-color: rgba(66, 133, 244, 0.4);
				  }

				  .chatgpt-card {
					border-color: rgba(16, 163, 127, 0.2);
				  }

				  .chatgpt-card:hover {
					background: rgba(16, 163, 127, 0.1);
					border-color: rgba(16, 163, 127, 0.4);
				  }

				  .card-icon {
					font-size: 20px;
					opacity: 0.8;
				  }

				  .card-label {
					font-weight: 500;
					font-size: 12px;
				  }

				  .system-controls {
					margin-bottom: 20px;
				  }

				  .control-row {
					display: flex;
					justify-content: center;
				  }

				  .danger-btn {
					background: rgba(255, 71, 87, 0.2);
					border: 1px solid rgba(255, 71, 87, 0.3);
					color: rgba(255, 255, 255, 0.9);
					padding: 10px 20px;
					border-radius: 10px;
					font-weight: 500;
					font-size: 13px;
					cursor: pointer;
					transition: all 0.2s ease;
					display: flex;
					align-items: center;
					gap: 6px;
				  }

				  .danger-btn:hover {
					background: rgba(255, 71, 87, 0.4);
					border-color: rgba(255, 71, 87, 0.5);
				  }

				  .update-banner {
					background: rgba(255, 71, 87, 0.15);
					margin: -1px -1px 15px -1px;
					padding: 12px 20px;
					display: flex;
					gap: 12px;
					align-items: flex-start;
					border-bottom: 1px solid rgba(255, 255, 255, 0.05);
				  }

				  .text-selection-toggle {
					position: relative;
				  }

				  .text-selection-toggle.toggle-enabled {
					background: rgba(74, 222, 128, 0.05);
					border-color: rgba(74, 222, 128, 0.2);
				  }

				  .toggle-indicator {
					font-size: 10px;
					color: rgba(239, 68, 68, 0.8);
					transition: color 0.2s ease;
					margin-right: 4px;
					font-weight: bold;
				  }

				  .banner-icon {
					font-size: 18px;
					margin-top: 1px;
					opacity: 0.8;
				  }

				  .banner-content h4 {
					margin: 0 0 4px 0;
					font-size: 14px;
					font-weight: 500;
					color: rgba(255, 255, 255, 0.9);
				  }

				  .banner-content p {
					margin: 0 0 4px 0;
					font-size: 12px;
					color: rgba(255, 255, 255, 0.7);
				  }

				  .banner-content small {
					font-size: 11px;
					color: rgba(255, 255, 255, 0.6);
				  }
				`;
				document.head.appendChild(style);

				// Setup initial event listeners
				setupEventListeners();
				setupCopyPasteListeners();
