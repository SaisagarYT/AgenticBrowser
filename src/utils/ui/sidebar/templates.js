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
      <button class="as-rail-btn" id="as-rail-som-toggle" aria-label="Toggle Visual Marks" style="color: #facc15;">
        ${ICONS.eye}
      </button>
      <div class="as-rail-tooltip">Visual Marks (Alt+M)</div>
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
      <button class="as-sheet-new-btn" id="as-sheet-new-chat">
        ${ICONS.plus}
        <span>New chat</span>
      </button>

      <div class="as-sheet-nav">
        <div class="as-sheet-link active">
          ${ICONS.messageSquare}
          <span>Chats</span>
        </div>
        <div class="as-sheet-link">
          ${ICONS.folder}
          <span>Automations</span>
        </div>
        <div class="as-sheet-link">
          ${ICONS.fileText}
          <span>Artifacts</span>
        </div>
      </div>

      <div class="as-sheet-section-title">Recent Tasks</div>
      <div class="as-sheet-history-list" id="as-sheet-history-list">
        <div class="as-sheet-history-item" data-task="Search Google for RTX 4050 laptop prices">Search Google for RTX 4050 laptop prices</div>
        <div class="as-sheet-history-item" data-task="Extract top 3 Hacker News stories">Extract top 3 Hacker News stories</div>
        <div class="as-sheet-history-item" data-task="Research Node.js history on Wikipedia">Research Node.js history on Wikipedia</div>
      </div>
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
        <button class="as-icon-btn" id="as-header-new-chat" title="New Chat">${ICONS.edit}</button>
        <button class="as-icon-btn" id="as-btn-settings" title="Model &amp; Provider Settings">${ICONS.settings}</button>
        <button class="as-icon-btn" id="as-btn-theme" title="Toggle Theme">${ICONS.moon}</button>
        <button class="as-icon-btn" id="as-btn-clear" title="Clear Chat" style="display: none;">${ICONS.trash}</button>
        <button class="as-icon-btn" id="as-btn-collapse" title="Close (Ctrl+B)">${ICONS.panelClose}</button>
      </div>
    </div>

    <!-- VIEW 1: Main Chat View (#as-view-chat) -->
    <div class="as-view-chat" id="as-view-chat">

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

              <!-- Visual Marks Toggle Switch -->
              <button
                class="as-som-switch active"
                id="as-btn-som-toggle"
                type="button"
                role="switch"
                aria-checked="true"
                title="Visual Marks (Alt+M)"
              >
                <span class="as-som-switch-thumb">
                  <span class="as-som-switch-icon">${ICONS.eye}</span>
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
    <div class="as-view-settings" id="as-view-settings" style="display: none;">
      <div class="as-settings-topbar">
        <button class="as-btn-back" id="as-btn-back-to-chat" type="button">
          ${ICONS.arrowLeft}
          <span>Back to Chat</span>
        </button>
        <div class="as-settings-header-title">Model Settings</div>
      </div>

      <div class="as-settings-scroll-area">
        <!-- Card 1: Add New Model Form -->
        <div class="as-settings-card">
          <div class="as-settings-card-header">
            <div class="as-settings-card-title">Add New Model</div>
            <div class="as-settings-card-sub">Configure an AI model with your provider and API key to enable the agent.</div>
          </div>

          <form id="as-settings-model-form" class="as-settings-form">
            <div class="as-settings-field">
              <label class="as-settings-label" for="as-input-provider">Provider</label>
              <select class="as-settings-select" id="as-input-provider">
                <option value="nvidia">NVIDIA NIM</option>
                <option value="openai">OpenAI</option>
                <option value="groq">Groq</option>
                <option value="ollama">Local Ollama</option>
                <option value="openrouter">OpenRouter</option>
                <option value="antigravity">Google Antigravity CLI (Local Agent)</option>
                <option value="custom">Custom / Self-Hosted</option>
              </select>
            </div>

            <!-- Antigravity Connected Status Banner (Shown when Provider is Antigravity) -->
            <div class="as-antigravity-status-banner" id="as-field-ag-banner" style="display: none;">
              <span class="as-ag-badge-icon">⚡</span>
              <div class="as-ag-badge-content">
                <div class="as-ag-badge-title">Local Google Antigravity CLI Connected</div>
                <div class="as-ag-badge-desc">Authenticated binary found at ~/.gemini/bin/agy.exe. Uses your active CLI session — zero API keys or remote endpoints required.</div>
              </div>
            </div>

            <div class="as-settings-field" id="as-field-model-id">
              <label class="as-settings-label" for="as-input-model-id">Model ID</label>
              <input class="as-settings-input" id="as-input-model-id" type="text" placeholder="e.g. nvidia/nemotron-3-ultra-550b-a55b or gpt-4o" required />
            </div>

            <div class="as-settings-field">
              <label class="as-settings-label" for="as-input-model-name">Display Name (Optional)</label>
              <input class="as-settings-input" id="as-input-model-name" type="text" placeholder="e.g. Nemotron Ultra or GPT-4o" />
            </div>

            <div class="as-settings-field" id="as-field-api-key">
              <label class="as-settings-label" for="as-input-api-key">API Key</label>
              <div class="as-input-password-wrapper">
                <input class="as-settings-input" id="as-input-api-key" type="password" placeholder="Enter provider API key (nvapi-..., sk-..., etc.)" />
                <button type="button" class="as-btn-toggle-eye" id="as-btn-toggle-key">${ICONS.eye}</button>
              </div>
              <span class="as-settings-hint" id="as-key-hint">Stored locally in data/models_config.json</span>
            </div>

            <div class="as-settings-field" id="as-field-base-url">
              <label class="as-settings-label" for="as-input-base-url">Base URL (Optional)</label>
              <input class="as-settings-input" id="as-input-base-url" type="text" placeholder="Default provider endpoint" />
            </div>

            <div class="as-settings-form-actions">
              <button class="as-settings-btn-save" id="as-btn-save-model" type="submit">
                ${ICONS.plus}
                <span>Save &amp; Activate Model</span>
              </button>
            </div>
          </form>
        </div>

        <!-- Card 2: Configured Models List -->
        <div class="as-settings-card">
          <div class="as-settings-card-header">
            <div class="as-settings-card-title">Configured Models</div>
            <div class="as-settings-card-sub">Models ready for autonomous browser task automation.</div>
          </div>

          <div class="as-configured-models-list" id="as-configured-models-list">
            <div class="as-empty-models-notice">No models configured yet. Add a model above to begin.</div>
          </div>
        </div>
      </div>
    </div>
    </div>
  `;
}
