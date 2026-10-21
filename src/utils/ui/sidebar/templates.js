"use strict";

/**
 * HTML Templates for Rail Dock and Expanded Sidebar Overlay.
 */
export function getRailHtml(ICONS) {
  return `
    <!-- Top Action / Open Sidebar -->
    <div class="as-rail-item">
      <button class="as-rail-top-btn" id="as-rail-expand" aria-label="Open Agentic Browser">
        ${ICONS.panelOpen}
      </button>
      <div class="as-rail-tooltip">Open Sidebar</div>
    </div>

    <!-- New Chat -->
    <div class="as-rail-item">
      <button class="as-rail-btn" id="as-rail-new" aria-label="New Chat">
        ${ICONS.plus}
      </button>
      <div class="as-rail-tooltip">New Chat</div>
    </div>

    <div class="as-rail-divider"></div>

    <!-- Theme Toggle -->
    <div class="as-rail-item">
      <button class="as-rail-btn" id="as-rail-theme" aria-label="Toggle Theme">
        ${ICONS.moon}
      </button>
      <div class="as-rail-tooltip">Toggle Theme</div>
    </div>

    <!-- Clear Chat -->
    <div class="as-rail-item">
      <button class="as-rail-btn" id="as-rail-clear" aria-label="Clear Chat">
        ${ICONS.trash}
      </button>
      <div class="as-rail-tooltip">Clear Chat</div>
    </div>

    <!-- Toggle Visual Marks -->
    <div class="as-rail-item">
      <button class="as-rail-btn" id="as-rail-som-toggle" aria-label="Toggle Visual Marks">
        ${ICONS.eyeOff}
      </button>
      <div class="as-rail-tooltip">Visual Marks (Alt+M)</div>
    </div>

    <!-- Toggle Kira Voice / Continuous Mic -->
    <div class="as-rail-item">
      <button class="as-rail-btn" id="as-rail-voice-toggle" aria-label="Toggle Kira Voice Mic" title="Kira Voice: Continuous Mic (Alt+V)">
        ${ICONS.micOff}
      </button>
      <div class="as-rail-tooltip">Kira Voice Mic (Alt+V)</div>
    </div>

    <!-- Model & Provider Settings -->
    <div class="as-rail-item">
      <button class="as-rail-btn" id="as-rail-settings" aria-label="Model Settings" title="Model &amp; Provider Settings">
        ${ICONS.settings}
      </button>
      <div class="as-rail-tooltip">Settings</div>
    </div>
  `;
}

export function getSidebarHtml(ICONS, VOXLE_CUBE_SVG) {
  return `
    <!-- shadcn Sheet Overlay (Drawer for Sessions / History) -->
    <div class="as-sheet-overlay" id="as-sheet-overlay"></div>
    <div class="as-sheet" id="as-sheet">
      <!-- Sheet Header with Title, Session Badge & Close Button -->
      <div class="as-sheet-header">
        <div class="as-sheet-header-left">
          <span class="as-sheet-title">Chat History</span>
          <span class="as-sheet-header-badge" id="as-sheet-session-count">0</span>
        </div>
        <button class="as-sheet-close-btn" id="as-sheet-close-btn" title="Close drawer (Esc)">
          ${ICONS.close}
        </button>
      </div>

      <!-- + New Chat Button with global radius matching other components -->
      <button class="as-sheet-new-btn" id="as-sheet-new-chat">
        ${ICONS.plus}
        <span>New chat</span>
      </button>

      <!-- Search conversations filter -->
      <div class="as-sheet-search-box">
        <span class="as-sheet-search-icon">${ICONS.search}</span>
        <input type="text" class="as-sheet-search-input" id="as-sheet-search" placeholder="Search conversations..." />
      </div>

      <!-- Section Label -->
      <div class="as-sheet-section-title">Recent Conversations</div>
      
      <!-- Session List Container -->
      <div class="as-sheet-history-list" id="as-sheet-history-list"></div>
    </div>

    <!-- Inside Chat Container with Rounded Edges -->
    <div class="as-inner-container" id="as-inner-container">
      <!-- Header Navbar -->
      <div class="as-header">
      <div class="as-header-left">
        <button class="as-header-title-btn" id="as-header-chat-menu" type="button" title="Chat History">
          <span>New AI Chat</span>
          <span class="as-header-chevron">${ICONS.chevronDown}</span>
        </button>
        <button class="as-icon-btn" id="as-btn-drawer" title="Open Navigation Menu" style="display: none;">
          ${ICONS.menu}
        </button>
      </div>

      <div class="as-header-right">
        <button class="as-icon-btn" id="as-btn-settings" title="Model &amp; Provider Settings">${ICONS.settings}</button>
        <button class="as-icon-btn" id="as-btn-clear" title="Clear Chat" style="display: none;">${ICONS.trash}</button>
        <button class="as-icon-btn" id="as-btn-collapse" title="Close (Ctrl+B)">${ICONS.panelClose}</button>
      </div>
    </div>

    <!-- VIEW 1: Main Chat View (#as-view-chat) -->
    <div class="as-view-chat active" id="as-view-chat">

      <!-- Plan Wrapper (Hidden - Plan rendered inline in feed) -->
      <div class="as-plan-wrapper" id="as-plan-wrapper" style="display: none !important;"></div>

      <!-- Feed / Content Area (Clean Canvas matching Reference) -->
      <div class="as-content-area" id="as-content-area"></div>

      <!-- Floating Responsive Input Card -->
      <div class="as-input-footer">
        <input type="file" id="as-file-input" multiple accept="image/*,.pdf,.txt,.doc,.docx,.csv,.json" style="display: none;" />

        <div class="as-voxle-card" id="as-voxle-card">
          <!-- Attachment Chips Container -->
          <div class="as-attachment-list" id="as-attachment-list" style="display: none;"></div>

          <!-- Textarea Area -->
          <textarea
            class="as-voxle-textarea"
            id="as-textarea"
            placeholder="Ask anything or describe a task..."
            rows="1"
          ></textarea>

          <!-- Bottom Action Toolbar inside the card -->
          <div class="as-voxle-toolbar">
            <div class="as-voxle-tools-left">
              <!-- Upload / Attachment Paperclip Trigger (Direct System File Picker) -->
              <button class="as-upload-trigger-btn" id="as-btn-upload-trigger" type="button" title="Attach files or screenshots">
                ${ICONS.paperclip}
              </button>

              <!-- Hairline separator -->
              <div class="as-input-divider"></div>

              <!-- Model Selector Dropdown -->
              <div class="as-shadcn-select" id="as-model-select">
                <button class="as-shadcn-select-trigger" id="as-model-select-trigger" type="button" aria-haspopup="listbox" aria-expanded="false" title="Switch AI Model">
                  <span id="as-selected-model-name">No Model Configured</span>
                  <span class="as-select-chevron">${ICONS.chevronDown}</span>
                </button>

                <div class="as-shadcn-select-popover" id="as-model-select-popover" role="listbox">
                  <div id="as-model-items-list">
                    <!-- Populated dynamically via renderModelList() -->
                  </div>
                </div>
              </div>

              <!-- Visual Marks Toggle Switch (Closed by default) -->
              <button
                class="as-som-switch"
                id="as-btn-som-toggle"
                type="button"
                role="switch"
                aria-checked="false"
                title="Show Visual Marks (Alt+M)"
              >
                <span class="as-som-switch-thumb">
                  <span class="as-som-switch-icon">${ICONS.eyeOff}</span>
                </span>
              </button>

              <!-- Kira Voice Microphone Switch (Same toggle design as visual marks eye switch, right beside it) -->
              <button
                class="as-som-switch as-voice-switch"
                id="as-btn-voice-toggle"
                type="button"
                role="switch"
                aria-checked="false"
                title="Kira Voice: Continuous Mic (Alt+V)"
              >
                <span class="as-som-switch-thumb">
                  <span class="as-som-switch-icon">${ICONS.micOff}</span>
                </span>
              </button>
            </div>

            <div class="as-voxle-tools-right">
              <button class="as-voxle-send-btn" id="as-btn-send" title="Send message (Enter)" aria-label="Send message">
                ${ICONS.arrowUp}
              </button>
            </div>
          </div>
        </div>

        <div class="as-input-hint" style="display: none;"></div>
      </div>
    </div>

    <!-- VIEW 2: In-Place Model Settings Screen (#as-view-settings) -->
    <div class="as-view-settings" id="as-view-settings">
      <!-- Topbar Header -->
      <div class="as-settings-topbar">
        <button class="as-btn-back" id="as-btn-back-to-chat" type="button" title="Back to chat">
          ${ICONS.arrowLeft}
          <span>Back to Chat</span>
        </button>
        <div class="as-settings-topbar-title">Settings &amp; AI Models</div>
        <div class="as-settings-topbar-actions">
          <span class="as-settings-hub-badge">${ICONS.sparkles} Universal Hub</span>
        </div>
      </div>

      <!-- Settings Navigation Tabs (shadcn tabs) -->
      <div class="as-settings-tabs-bar">
        <button class="as-settings-tab active" data-tab="providers" type="button">
          ${ICONS.cpu}
          <span>AI Providers</span>
        </button>
        <button class="as-settings-tab" data-tab="models" type="button">
          ${ICONS.bot}
          <span>Active Models</span>
          <span class="as-tab-badge" id="as-tab-active-count">0</span>
        </button>
        <button class="as-settings-tab" data-tab="automation" type="button">
          ${ICONS.sliders}
          <span>Automation</span>
        </button>
        <button class="as-settings-tab" data-tab="voice" type="button">
          ${ICONS.volume2}
          <span>Kira Voice</span>
        </button>
      </div>

      <!-- Settings Scrollable Content Area -->
      <div class="as-settings-scroll-area">
        <!-- TAB 1: AI Providers & Setup (shadcn Accordion) -->
        <div class="as-settings-tab-page active" id="as-tab-page-providers">
          <div class="as-providers-hub-view" id="as-providers-hub-view">
            <!-- Provider Directory Header -->
            <div class="as-section-header">
              <div class="as-section-title-row">
                <span class="as-section-title">Available AI Providers</span>
                <span class="as-provider-count-pill" id="as-provider-count-pill">10 providers</span>
              </div>
              <div class="as-section-sub">Click on any provider to expand its configuration, manage API keys, test connection latency, and select active models.</div>
            </div>

            <!-- Accordion Provider List -->
            <div class="as-providers-bento-grid" id="as-providers-bento-grid">
              <!-- Populated dynamically via renderProvidersAccordion() in settingsManager.js -->
            </div>
          </div>
        </div>

        <!-- TAB 2: Active Configured Models List -->
        <div class="as-settings-tab-page" id="as-tab-page-models">
          <div class="as-section-header">
            <div class="as-section-title">Configured Models</div>
            <div class="as-section-sub">Models currently enabled and ready for autonomous browser task automation.</div>
          </div>

          <div class="as-configured-models-list" id="as-configured-models-list">
            <!-- Populated dynamically via renderConfiguredModels() -->
          </div>

          <!-- Quick Add Custom Model Card -->
          <div class="as-custom-model-card">
            <div class="as-custom-model-header" id="as-btn-toggle-custom-model">
              <div class="as-custom-model-title">
                ${ICONS.plus}
                <span>Add Custom Model ID</span>
              </div>
              <span class="as-custom-model-chevron">${ICONS.chevronDown}</span>
            </div>
            <form id="as-custom-model-form" class="as-custom-model-body" style="display: none;">
              <div class="as-settings-field">
                <label class="as-settings-label" for="as-custom-provider-select">Provider</label>
                <select class="as-settings-select" id="as-custom-provider-select">
                  <option value="nvidia">NVIDIA NIM</option>
                  <option value="openai">OpenAI</option>
                  <option value="anthropic">Anthropic Claude</option>
                  <option value="gemini">Google Gemini</option>
                  <option value="deepseek">DeepSeek</option>
                  <option value="groq">Groq</option>
                  <option value="ollama">Local Ollama</option>
                  <option value="openrouter">OpenRouter</option>
                  <option value="custom">Custom Endpoint</option>
                </select>
              </div>
              <div class="as-settings-field">
                <label class="as-settings-label" for="as-custom-model-id-input">Model ID</label>
                <input class="as-settings-input" id="as-custom-model-id-input" type="text" placeholder="e.g. gpt-4o-2024-11-20 or custom-model" required />
              </div>
              <div class="as-settings-field">
                <label class="as-settings-label" for="as-custom-model-name-input">Display Name (Optional)</label>
                <input class="as-settings-input" id="as-custom-model-name-input" type="text" placeholder="e.g. GPT-4o Custom" />
              </div>
              <div class="as-settings-form-actions">
                <button class="as-btn-brand-primary" type="submit">
                  ${ICONS.plus}
                  <span>Add to Active Models</span>
                </button>
              </div>
            </form>
          </div>
        </div>

        <!-- TAB 3: Automation & Vision Preferences -->
        <div class="as-settings-tab-page" id="as-tab-page-automation">
          <div class="as-section-header">
            <div class="as-section-title">Browser Automation &amp; Vision</div>
            <div class="as-section-sub">Configure grounding visual markers, screenshot resolution, and execution safety.</div>
          </div>

          <div class="as-settings-card">
            <div class="as-setting-row">
              <div class="as-setting-info">
                <div class="as-setting-label">Visual Set-of-Marks (SoM)</div>
                <div class="as-setting-desc">Inject interactive numerical bounding labels on DOM elements for high-precision model clicking.</div>
              </div>
              <button class="as-switch-btn active" id="as-setting-toggle-som" type="button" role="switch" aria-checked="true">
                <span class="as-switch-thumb"></span>
              </button>
            </div>

            <div class="as-setting-divider"></div>

            <div class="as-setting-row">
              <div class="as-setting-info">
                <div class="as-setting-label">Vision Resolution</div>
                <div class="as-setting-desc">High resolution increases element recognition accuracy; standard resolution reduces latency and token usage.</div>
              </div>
              <select class="as-settings-select as-select-sm" id="as-setting-vision-res">
                <option value="high" selected>High (1280px Crisp)</option>
                <option value="standard">Standard (1024px Fast)</option>
              </select>
            </div>

            <div class="as-setting-divider"></div>

            <div class="as-setting-row">
              <div class="as-setting-info">
                <div class="as-setting-label">Step Timeout</div>
                <div class="as-setting-desc">Maximum duration to wait for page animations and network responses before taking the next step.</div>
              </div>
              <select class="as-settings-select as-select-sm" id="as-setting-timeout">
                <option value="15000">15 seconds</option>
                <option value="30000" selected>30 seconds (Default)</option>
                <option value="60000">60 seconds</option>
              </select>
            </div>
          </div>

          <!-- Downloads & Storage Card -->
          <div class="as-settings-card" id="as-settings-downloads-card">
            <div class="as-settings-card-header">
              <div class="as-settings-card-title">${ICONS.download} Downloads &amp; Storage</div>
              <div class="as-settings-card-sub">Choose where research articles, PDFs, and downloaded files are directly saved.</div>
            </div>

            <div class="as-setting-row" style="align-items: flex-start; flex-direction: column; gap: 8px;">
              <div class="as-setting-info" style="width: 100%;">
                <div class="as-setting-label">Download Directory</div>
                <div class="as-setting-desc">Files downloaded during browser automation will be placed directly in this folder.</div>
              </div>
              <div class="as-download-input-row" style="width: 100%; display: flex; gap: 6px; align-items: center;">
                <input class="as-settings-input" id="as-setting-downloads-dir" type="text" placeholder="e.g. C:\\Users\\...\\Downloads" spellcheck="false" style="flex: 1; font-family: monospace; font-size: 11px;" />
                <button class="as-btn-primary as-btn-sm" id="as-btn-save-downloads-dir" type="button" style="white-space: nowrap; height: 32px; padding: 0 12px;">Save</button>
              </div>
              <div class="as-download-presets" style="display: flex; gap: 6px; margin-top: 4px; flex-wrap: wrap;">
                <button class="as-settings-tag-pill" id="as-btn-preset-system-dl" type="button" title="Set to OS Downloads folder">
                  📁 System Downloads
                </button>
                <button class="as-settings-tag-pill" id="as-btn-preset-project-dl" type="button" title="Set to ./downloads in workspace">
                  📦 Project ./downloads
                </button>
                <button class="as-settings-tag-pill" id="as-btn-preset-articles-dl" type="button" title="Set to ./downloads/articles in workspace">
                  📑 ./downloads/articles
                </button>
              </div>
              <div class="as-download-status-hint" id="as-download-status-hint" style="font-size: 11px; color: #10b981; display: none; margin-top: 4px;"></div>
            </div>
          </div>

          <div class="as-settings-card">
            <div class="as-settings-card-header">
              <div class="as-settings-card-title">Security &amp; Privacy</div>
              <div class="as-settings-card-sub">All credentials and configurations remain strictly on your local machine in data/models_config.json. No third-party data tracking.</div>
            </div>
          </div>
        </div>

        <!-- TAB 4: Kira Voice & Audio Preferences -->
        <div class="as-settings-tab-page" id="as-tab-page-voice">
          <div class="as-section-header">
            <div class="as-section-title">Kira Voice &amp; Speech</div>
            <div class="as-section-sub">Configure Kira's offline Kokoro-82M neural voice, speech speed, and auto-read responses.</div>
          </div>

            <!-- Speech Recognition Language & Accent -->
            <div class="as-setting-row" style="flex-direction: column; align-items: stretch; gap: 8px;">
              <div class="as-setting-info">
                <div class="as-setting-label">Speech Recognition Language &amp; Accent</div>
                <div class="as-setting-desc">Real-time streaming speech recognition engine tuned to your regional accent.</div>
              </div>
              <select class="as-settings-select" id="as-voice-lang-select" style="width: 100%; margin-top: 4px;">
                <option value="en-IN">English (India) — en-IN (Recommended)</option>
                <option value="en-US">English (United States) — en-US</option>
                <option value="en-GB">English (United Kingdom) — en-GB</option>
                <option value="en-AU">English (Australia) — en-AU</option>
              </select>
            </div>

            <div class="as-setting-divider"></div>

            <!-- Voice Synthesis Engine -->
            <div class="as-setting-row" style="flex-direction: column; align-items: stretch; gap: 8px;">
              <div class="as-setting-info">
                <div class="as-setting-label">Voice Synthesis Mode</div>
                <div class="as-setting-desc">Choose between Instant Web Speech, Studio HD Edge Neural Voice, or 100% Offline Kokoro ONNX.</div>
              </div>
              <select class="as-settings-select" id="as-voice-engine-select" style="width: 100%; margin-top: 4px;">
                <option value="browser">Instant Natural Speech (Fastest, 0ms Delay)</option>
                <option value="edge">Microsoft Edge Neural Voice (Studio HD, Fast)</option>
                <option value="kokoro">Kokoro-82M Neural Voice (Offline ONNX)</option>
              </select>
            </div>

            <div class="as-setting-divider"></div>

            <!-- Voice Persona Selector -->
            <div class="as-setting-row" style="flex-direction: column; align-items: stretch; gap: 8px;">
              <div class="as-setting-info">
                <div class="as-setting-label">Voice Persona</div>
                <div class="as-setting-desc">Choose Kira's speech character and accent (powered by Microsoft Edge Neural & Kokoro).</div>
              </div>
              <select class="as-settings-select" id="as-voice-select" style="width: 100%; margin-top: 4px;">
                <option value="af_heart">Kira — Warm &amp; Natural (Default)</option>
                <option value="in_neerja">Kira — Indian Natural (Female)</option>
                <option value="in_prabhat">Kira — Indian Natural (Male)</option>
                <option value="af_sky">Kira — Gentle &amp; Friendly</option>
                <option value="af_bella">Kira — Confident &amp; Energetic</option>
                <option value="af_nicole">Kira — Professional &amp; Crisp</option>
                <option value="bf_emma">Kira — British Articulate</option>
                <option value="bf_isabella">Kira — British Soft</option>
                <option value="bm_george">Kira — British Butler (Male)</option>
                <option value="am_michael">Kira — American Natural (Male)</option>
              </select>
            </div>

            <div class="as-setting-divider"></div>

            <!-- Speech Recognition Accent Selector -->
            <div class="as-setting-row" style="flex-direction: column; align-items: stretch; gap: 8px;">
              <div class="as-setting-info">
                <div class="as-setting-label">Microphone Recognition Accent</div>
                <div class="as-setting-desc">Tuning for your natural spoken English pronunciation.</div>
              </div>
              <select class="as-settings-select" id="as-voice-lang-select" style="width: 100%; margin-top: 4px;">
                <option value="en-IN">English (India) — en-IN</option>
                <option value="en-US">English (United States) — en-US</option>
                <option value="en-GB">English (United Kingdom) — en-GB</option>
              </select>
            </div>

            <div class="as-setting-divider"></div>

            <!-- Speech Synthesis Engine Selector -->
            <div class="as-setting-row" style="flex-direction: column; align-items: stretch; gap: 8px;">
              <div class="as-setting-info">
                <div class="as-setting-label">Speech Synthesis Engine</div>
                <div class="as-setting-desc">Microsoft Edge Neural (Studio Quality) or Browser Speech.</div>
              </div>
              <select class="as-settings-select" id="as-voice-engine-select" style="width: 100%; margin-top: 4px;">
                <option value="edge">Microsoft Edge Neural (Studio Human Quality)</option>
                <option value="browser">Instant Browser Speech (Low Latency)</option>
                <option value="kokoro">Kokoro-82M (100% Offline Local Model)</option>
              </select>
            </div>

            <div class="as-setting-divider"></div>

            <!-- Auto-Speak Responses Switch -->
            <div class="as-setting-row">
              <div class="as-setting-info">
                <div class="as-setting-label">Auto-Read Responses</div>
                <div class="as-setting-desc">Kira automatically speaks her responses aloud when automation tasks finish.</div>
              </div>
              <button class="as-switch-btn active" id="as-setting-toggle-autospeak" type="button" role="switch" aria-checked="true">
                <span class="as-switch-thumb"></span>
              </button>
            </div>

            <div class="as-setting-divider"></div>

            <!-- Speech Speed Slider -->
            <div class="as-setting-row" style="flex-direction: column; align-items: stretch; gap: 8px;">
              <div class="as-setting-info" style="display: flex; justify-content: space-between; align-items: center;">
                <div>
                  <div class="as-setting-label">Speech Speed</div>
                  <div class="as-setting-desc">Adjust pacing of spoken words (0.8x to 1.3x).</div>
                </div>
                <span id="as-voice-speed-val" style="font-size: 12px; font-weight: 600; color: #a1a1aa;">1.00x</span>
              </div>
              <input type="range" id="as-voice-speed-slider" min="0.8" max="1.3" step="0.05" value="1.0" class="as-range-slider" style="width: 100%;" />
            </div>

            <div class="as-setting-divider"></div>

            <!-- Test Voice Button -->
            <div class="as-setting-row" style="justify-content: flex-end;">
              <button class="as-btn-brand-primary" id="as-btn-test-voice" type="button" style="padding: 6px 14px; font-size: 12px;">
                ${ICONS.volume2}
                <span>Test Kira Voice</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
    </div>
  `;
}
