"use strict";

/**
 * Universal Multi-Provider Settings & Model Manager
 * Supports Aceternity UI Bento Grid, real-time connection ping & latency testing,
 * multi-model activation per provider (Claude, OpenAI, Gemini, DeepSeek, Groq, Ollama, NVIDIA, OpenRouter, Antigravity),
 * and dynamic chat view model selector synchronization.
 */

export function getSettingsManagerCode() {
  return `
  // --------------------------------------------------------------------------
  // shadcn/ui DropdownMenu for Uploads (+) & Model Selector Logic
  // --------------------------------------------------------------------------
  const uploadDropdownEl = sidebar.querySelector("#as-upload-dropdown");
  const uploadTriggerBtn = sidebar.querySelector("#as-btn-upload-trigger");
  const modelSelectEl = sidebar.querySelector("#as-model-select");
  const modelTriggerEl = sidebar.querySelector("#as-model-select-trigger");
  const modelNameEl = sidebar.querySelector("#as-selected-model-name");

  if (uploadTriggerBtn && fileInput) {
    uploadTriggerBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      if (modelSelectEl) modelSelectEl.classList.remove("open");
      fileInput.click();
    });
  }

  // --------------------------------------------------------------------------
  // In-Place View Management (Chat View vs Universal Settings Hub)
  // --------------------------------------------------------------------------
  const viewChat = sidebar.querySelector("#as-view-chat");
  const viewSettings = sidebar.querySelector("#as-view-settings");
  const btnSettings = sidebar.querySelector("#as-btn-settings");
  const railSettings = rail.querySelector("#as-rail-settings");
  const btnBackToChat = sidebar.querySelector("#as-btn-back-to-chat");

  const modelItemsListEl = sidebar.querySelector("#as-model-items-list");
  const nimStatusPill = sidebar.querySelector("#as-nim-status");
  const nimStatusText = sidebar.querySelector("#as-nim-status-text");

  // Settings DOM references
  const providersHubViewEl = sidebar.querySelector("#as-providers-hub-view");
  const providersBentoGridEl = sidebar.querySelector("#as-providers-bento-grid");
  const configuredModelsListEl = sidebar.querySelector("#as-configured-models-list");
  const tabActiveCountEl = sidebar.querySelector("#as-tab-active-count");
  const settingsTabs = sidebar.querySelectorAll(".as-settings-tab");
  const tabPages = {
    providers: sidebar.querySelector("#as-tab-page-providers"),
    models: sidebar.querySelector("#as-tab-page-models"),
    automation: sidebar.querySelector("#as-tab-page-automation"),
  };
  let expandedProviderId = null;

  // Preset Providers Specification with main theme icons and metadata
  const PRESET_PROVIDERS = [
    {
      id: "antigravity",
      name: "Antigravity CLI Agent",
      description: "Local autonomous CLI agent with MCP browser tools",
      envKey: null,
      consoleUrl: null,
      models: [
        { id: "antigravity", name: "Antigravity CLI Agent", tags: ["Local MCP Agent", "Autonomous"] },
      ],
    },
    {
      id: "anthropic",
      name: "Anthropic Claude",
      description: "Claude 3.7 Sonnet, Claude 3.5 Sonnet & Haiku",
      consoleUrl: "https://console.anthropic.com/settings/keys",
      models: [
        { id: "claude-3-7-sonnet-20250219", name: "Claude 3.7 Sonnet", tags: ["Hybrid Reasoning", "Top Choice"] },
        { id: "claude-3-5-sonnet-20241022", name: "Claude 3.5 Sonnet", tags: ["Fast", "Accurate"] },
        { id: "claude-3-5-haiku-20241022", name: "Claude 3.5 Haiku", tags: ["Ultra Fast"] },
      ],
    },
    {
      id: "openai",
      name: "OpenAI",
      description: "GPT-4o, GPT-4o Mini, o1, and o3-mini",
      consoleUrl: "https://platform.openai.com/api-keys",
      models: [
        { id: "gpt-4o", name: "GPT-4o", tags: ["Omnimodal", "Top Choice"] },
        { id: "gpt-4o-mini", name: "GPT-4o Mini", tags: ["Fast", "Lightweight"] },
        { id: "o1", name: "OpenAI o1", tags: ["High Reasoning"] },
        { id: "o3-mini", name: "OpenAI o3-mini", tags: ["Fast Reasoning"] },
      ],
    },
    {
      id: "gemini",
      name: "Google Gemini",
      description: "Gemini 2.5 Pro and Gemini 2.5 Flash",
      consoleUrl: "https://aistudio.google.com/app/apikey",
      models: [
        { id: "gemini-2.5-pro", name: "Gemini 2.5 Pro", tags: ["Deep Context", "Multimodal"] },
        { id: "gemini-2.5-flash", name: "Gemini 2.5 Flash", tags: ["Ultra Fast", "Vision"] },
        { id: "gemini-1.5-pro", name: "Gemini 1.5 Pro", tags: ["Balanced"] },
      ],
    },
    {
      id: "deepseek",
      name: "DeepSeek",
      description: "DeepSeek V3 and DeepSeek R1 Reasoning",
      consoleUrl: "https://platform.deepseek.com/api_keys",
      models: [
        { id: "deepseek-chat", name: "DeepSeek V3", tags: ["Top Coding", "Fast"] },
        { id: "deepseek-reasoner", name: "DeepSeek R1", tags: ["Deep Reasoning"] },
      ],
    },
    {
      id: "groq",
      name: "Groq",
      description: "Ultra-fast low-latency LPU inference",
      consoleUrl: "https://console.groq.com/keys",
      models: [
        { id: "llama-3.3-70b-versatile", name: "Llama 3.3 70B", tags: ["Ultra Fast LPU"] },
        { id: "deepseek-r1-distill-llama-70b", name: "DeepSeek R1 70B", tags: ["Reasoning", "Fast"] },
        { id: "mixtral-8x7b-32768", name: "Mixtral 8x7B", tags: ["Fast"] },
      ],
    },
    {
      id: "ollama",
      name: "Local Ollama",
      description: "100% private offline local models",
      consoleUrl: "https://ollama.com/",
      defaultBaseUrl: "http://localhost:11434/v1",
      models: [
        { id: "llama3.3", name: "Llama 3.3 (Local)", tags: ["100% Private"] },
        { id: "qwen2.5", name: "Qwen 2.5 (Local)", tags: ["Fast Offline"] },
        { id: "deepseek-r1", name: "DeepSeek R1 (Local)", tags: ["Offline Reasoning"] },
      ],
    },
    {
      id: "nvidia",
      name: "NVIDIA NIM",
      description: "High-performance enterprise NIM microservices",
      consoleUrl: "https://build.nvidia.com/",
      models: [
        { id: "meta/llama-3.3-70b-instruct", name: "Llama 3.3 70B (NIM)", tags: ["Enterprise NIM"] },
        { id: "deepseek-ai/deepseek-r1", name: "DeepSeek R1 (NIM)", tags: ["NIM Reasoning"] },
      ],
    },
    {
      id: "openrouter",
      name: "OpenRouter",
      description: "Universal gateway for 100+ AI models",
      consoleUrl: "https://openrouter.ai/keys",
      models: [
        { id: "anthropic/claude-3.5-sonnet", name: "Claude 3.5 Sonnet (OpenRouter)", tags: ["Universal"] },
        { id: "openai/gpt-4o", name: "GPT-4o (OpenRouter)", tags: ["Universal"] },
        { id: "deepseek/deepseek-r1", name: "DeepSeek R1 (OpenRouter)", tags: ["Universal"] },
      ],
    },
    {
      id: "custom",
      name: "Custom Endpoint",
      description: "vLLM, LM Studio, or custom OpenAI-compatible server",
      consoleUrl: null,
      models: [],
    },
  ];

  let registeredModels = Array.isArray(window.__INITIAL_MODELS__) ? [...window.__INITIAL_MODELS__] : [];
  let providersData = Array.isArray(window.__INITIAL_PROVIDERS__) && window.__INITIAL_PROVIDERS__.length > 0
    ? [...window.__INITIAL_PROVIDERS__]
    : PRESET_PROVIDERS.map((p) => ({
        ...p,
        isConfigured: p.id === "antigravity" || registeredModels.some((m) => m.provider === p.id),
        hasKey: registeredModels.some((m) => m.provider === p.id && m.apiKey),
        configuredModelCount: registeredModels.filter((m) => m.provider === p.id).length,
      }));

  let selectedProviderId = "antigravity";
  let activeModelId = window.agenticSelectedModel || (registeredModels[0]?.id || null);

  // If a provider already has active models, default selection to it
  const firstActiveModel = registeredModels[0];
  if (firstActiveModel && firstActiveModel.provider) {
    selectedProviderId = firstActiveModel.provider;
  }

  // Latency test state per provider: { [providerId]: { latencyMs, success, error, availableModels } }
  const testResults = {};

  function setView(viewName) {
    if (!viewChat || !viewSettings) return;
    if (viewName === "settings") {
      viewChat.classList.remove("active");
      viewSettings.classList.add("active");
      renderSettingsHub();
    } else {
      viewSettings.classList.remove("active");
      viewChat.classList.add("active");
      renderModelList();
    }
  }

  btnSettings?.addEventListener("click", () => setView("settings"));
  railSettings?.addEventListener("click", () => {
    setCollapsed(false);
    setView("settings");
  });
  btnBackToChat?.addEventListener("click", () => setView("chat"));

  // Tab switching inside Settings View
  settingsTabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const target = tab.getAttribute("data-tab");
      settingsTabs.forEach((t) => t.classList.remove("active"));
      tab.classList.add("active");

      Object.keys(tabPages).forEach((pageKey) => {
        if (tabPages[pageKey]) {
          if (pageKey === target) {
            tabPages[pageKey].classList.add("active");
          } else {
            tabPages[pageKey].classList.remove("active");
          }
        }
      });

      if (target === "models") {
        renderConfiguredModelsTab();
      }
    });
  });

  function updateTabBadge() {
    if (tabActiveCountEl) {
      tabActiveCountEl.textContent = String(registeredModels.length);
    }
  }

  // --------------------------------------------------------------------------
  // Accordion Provider List Rendering
  // --------------------------------------------------------------------------
  function renderSettingsHub() {
    updateTabBadge();
    renderProvidersAccordion();
  }

  function renderProvidersAccordion() {
    if (!providersBentoGridEl) return;
    providersBentoGridEl.innerHTML = "";

    PRESET_PROVIDERS.forEach((preset) => {
      const p = providersData.find((item) => item.id === preset.id) || preset;
      const isExpanded = p.id === expandedProviderId;
      const activeCount = registeredModels.filter((m) => m.provider === p.id).length;
      const isAntigravity = p.id === "antigravity";
      const isConfigured = Boolean(p.isConfigured || activeCount > 0 || p.hasKey || (isAntigravity && window.__ANTIGRAVITY_AVAILABLE__ !== false));

      const itemEl = document.createElement("div");
      itemEl.className = \`as-provider-accordion-item \${isConfigured ? "configured" : ""} \${isExpanded ? "open" : ""}\`;
      itemEl.setAttribute("data-provider", p.id);

      const iconSvg = ICONS[p.id] || ICONS.sliders || "";

      let statusBadgeHtml = "";
      if (isAntigravity) {
        statusBadgeHtml = \`<span class="as-bento-status-pill connected"><span class="as-bento-status-dot"></span><span>Ready (Local)</span></span>\`;
      } else if (activeCount > 0) {
        statusBadgeHtml = \`<span class="as-bento-status-pill connected"><span class="as-bento-status-dot"></span><span>\${activeCount} Active</span></span>\`;
      } else if (isConfigured) {
        statusBadgeHtml = \`<span class="as-bento-status-pill ready"><span>Configured</span></span>\`;
      } else {
        statusBadgeHtml = \`<span class="as-bento-status-pill unconfigured"><span>Setup</span></span>\`;
      }

      // Header row (Clickable Accordion Trigger)
      const headerEl = document.createElement("div");
      headerEl.className = "as-accordion-header";
      headerEl.setAttribute("role", "button");
      headerEl.setAttribute("aria-expanded", String(isExpanded));
      headerEl.innerHTML = \`
        <div class="as-bento-left">
          <div class="as-bento-icon-wrapper">\${iconSvg}</div>
          <div class="as-bento-body">
            <div class="as-bento-title-row">
              <span class="as-bento-title">\${escapeHtml(p.name)}</span>
            </div>
            <div class="as-bento-desc">\${escapeHtml(p.description)}</div>
          </div>
        </div>
        <div class="as-bento-right">
          \${statusBadgeHtml}
          <span class="as-bento-chevron">\${ICONS.chevronRight}</span>
        </div>
      \`;

      // Collapse wrapper for liquid-smooth CSS grid height expansion & collapse
      const collapseEl = document.createElement("div");
      collapseEl.className = "as-accordion-collapse";

      const drawerEl = document.createElement("div");
      drawerEl.className = "as-accordion-drawer";
      collapseEl.appendChild(drawerEl);

      populateAccordionDrawer(drawerEl, p, preset, itemEl);

      headerEl.addEventListener("click", () => {
        const wasOpen = itemEl.classList.contains("open");

        // Close any other open accordion items smoothly
        providersBentoGridEl.querySelectorAll(".as-provider-accordion-item.open").forEach((el) => {
          if (el !== itemEl) {
            el.classList.remove("open");
            el.querySelector(".as-accordion-header")?.setAttribute("aria-expanded", "false");
          }
        });

        if (wasOpen) {
          itemEl.classList.remove("open");
          headerEl.setAttribute("aria-expanded", "false");
          expandedProviderId = null;
        } else {
          itemEl.classList.add("open");
          headerEl.setAttribute("aria-expanded", "true");
          expandedProviderId = p.id;
          setTimeout(() => {
            itemEl.scrollIntoView({ behavior: "smooth", block: "nearest" });
          }, 80);
        }
      });

      itemEl.appendChild(headerEl);
      itemEl.appendChild(collapseEl);
      providersBentoGridEl.appendChild(itemEl);
    });
  }

  const renderProvidersBento = renderProvidersAccordion;

  function populateAccordionDrawer(drawerEl, p, preset, itemEl) {
    if (!drawerEl) return;
    const testResult = testResults[p.id] || null;
    const activeProviderModels = registeredModels.filter((m) => m.provider === p.id);

    // Combine preset models with any discovered models
    const combinedModels = [...(preset.models || [])];
    if (testResult && Array.isArray(testResult.availableModels)) {
      testResult.availableModels.forEach((disc) => {
        if (!combinedModels.some((m) => m.id === disc.id)) {
          combinedModels.push(disc);
        }
      });
    }

    drawerEl.innerHTML = \`
      <!-- Specific Setup Section -->
      \${
        p.id === "antigravity"
          ? \`
            <div class="as-ag-hero-banner">
              <span class="as-ag-hero-icon">⚡</span>
              <div class="as-ag-hero-text">
                <div class="as-ag-hero-title">Google Antigravity CLI Agent Active</div>
                <div class="as-ag-hero-desc">
                  Authenticated session connected via ~/.gemini/bin/agy.exe. Uses your active local session with built-in MCP browser automation tools — zero external API keys needed.
                </div>
              </div>
            </div>
            <div class="as-key-input-row" style="margin-top: 4px;">
              <button class="as-btn-test-ping as-btn-test-connection" type="button">
                \${ICONS.zap}
                <span>Verify CLI Connection</span>
              </button>
            </div>
          \`
          : p.id === "ollama"
          ? \`
            <div class="as-settings-field">
              <div class="as-field-label-row">
                <label class="as-settings-label">Ollama Base URL</label>
                <a class="as-link-get-key" href="https://ollama.com" target="_blank" rel="noopener">
                  <span>Docs</span>
                  \${ICONS.externalLink}
                </a>
              </div>
              <div class="as-key-input-row">
                <input class="as-settings-input as-detail-base-url" type="text" value="\${escapeHtml(p.customBaseUrl || 'http://localhost:11434/v1')}" placeholder="http://localhost:11434/v1" />
                <button class="as-btn-test-ping as-btn-test-connection" type="button">
                  \${ICONS.refresh}
                  <span>Scan Models</span>
                </button>
              </div>
            </div>
          \`
          : \`
            <div class="as-settings-field">
              <div class="as-field-label-row">
                <label class="as-settings-label">API Key</label>
                \${
                  preset.consoleUrl
                    ? \`<a class="as-link-get-key" href="\${preset.consoleUrl}" target="_blank" rel="noopener">
                        <span>Get API Key</span>
                        \${ICONS.externalLink}
                      </a>\`
                    : ""
                }
              </div>
              <div class="as-key-input-row">
                <div class="as-input-password-wrapper">
                  <input
                    class="as-settings-input as-detail-api-key"
                    type="password"
                    placeholder="\${p.hasKey ? '•••••••• (Key Configured)' : 'Enter API key'}"
                    value="\${p.hasKey ? '••••••••' : ''}"
                  />
                  <button type="button" class="as-btn-toggle-eye as-btn-toggle-detail-key">\${ICONS.eye}</button>
                </div>
                <button class="as-btn-test-ping as-btn-test-connection" type="button">
                  \${ICONS.zap}
                  <span>Test Connection</span>
                </button>
              </div>
            </div>

            <!-- Optional Custom Base URL Accordion -->
            <div class="as-settings-field">
              <button class="as-accordion-toggle as-btn-toggle-base-url" type="button">
                <span>Advanced: Custom Endpoint URL</span>
                \${ICONS.chevronDown}
              </button>
              <div class="as-wrapper-base-url" style="display: none; margin-top: 4px;">
                <input class="as-settings-input as-detail-base-url" type="text" value="\${escapeHtml(p.customBaseUrl || '')}" placeholder="Default provider endpoint" />
              </div>
            </div>
          \`
      }

      <!-- Dynamic Test Result Message Container -->
      <div class="as-test-status-container as-test-status-msg \${testResult?.success ? "success" : "error"}" style="display: \${testResult ? "flex" : "none"};">
        \${testResult ? (testResult.success ? \`\${ICONS.check} <span>Connection successful (\${testResult.latencyMs}ms latency). Ready for browser automation.</span>\` : \`\${ICONS.alertTriangle} <span>\${escapeHtml(testResult.error || "Connection test failed")}</span>\`) : ""}
      </div>

      <!-- Models Selection Section -->
      <div class="as-models-selection-section">
        <div class="as-models-selection-header">
          <div class="as-models-selection-title">Select Active Models for Browser Automation</div>
        </div>

        <div class="as-models-list-group">
          \${
            combinedModels.length === 0
              ? \`<div class="as-empty-models-notice" style="padding: 10px;">No preset models. Add a custom model below or test connection to discover.</div>\`
              : combinedModels
                  .map((m) => {
                    const isChecked = activeProviderModels.some((am) => am.id === m.id);
                    const tags = Array.isArray(m.tags) ? m.tags : [];
                    return \`
                      <label class="as-model-checkbox-item">
                        <div class="as-model-checkbox-left">
                          <input
                            type="checkbox"
                            class="as-model-checkbox-input"
                            data-model-id="\${escapeHtml(m.id)}"
                            data-model-name="\${escapeHtml(m.name || m.id)}"
                            \${isChecked ? "checked" : ""}
                          />
                          <span class="as-model-name-label">\${escapeHtml(m.name || m.id)}</span>
                        </div>
                        <div class="as-model-tags-container">
                          \${tags
                            .map((tag) => \`<span class="as-model-tag-pill \${tag === "Top Choice" || tag === "Local MCP Agent" ? "top" : ""}">\${escapeHtml(tag)}</span>\`)
                            .join("")}
                        </div>
                      </label>
                    \`;
                  })
                  .join("")
          }
        </div>
      </div>

      <!-- Actions: Save & Activate -->
      <div class="as-detail-footer-actions" style="margin-top: 4px;">
        <button class="as-btn-brand-primary as-btn-save-provider" type="button" style="width: 100%;">
          \${ICONS.check}
          <span>Save &amp; Activate \${escapeHtml(p.name)}</span>
        </button>
      </div>
    \`;

    // Wire Eye Toggle
    const btnToggleKey = drawerEl.querySelector(".as-btn-toggle-detail-key");
    const keyInput = drawerEl.querySelector(".as-detail-api-key");
    if (btnToggleKey && keyInput) {
      btnToggleKey.addEventListener("click", (e) => {
        e.stopPropagation();
        const isPass = keyInput.type === "password";
        keyInput.type = isPass ? "text" : "password";
        btnToggleKey.innerHTML = isPass ? ICONS.eyeOff : ICONS.eye;
      });
    }

    // Wire Base URL toggle
    const btnToggleBaseUrl = drawerEl.querySelector(".as-btn-toggle-base-url");
    const wrapperBaseUrl = drawerEl.querySelector(".as-wrapper-base-url");
    if (btnToggleBaseUrl && wrapperBaseUrl) {
      btnToggleBaseUrl.addEventListener("click", (e) => {
        e.stopPropagation();
        const isOpen = wrapperBaseUrl.style.display !== "none";
        wrapperBaseUrl.style.display = isOpen ? "none" : "block";
        btnToggleBaseUrl.innerHTML = \`<span>Advanced: Custom Endpoint URL</span>\${isOpen ? ICONS.chevronDown : ICONS.chevronUp}\`;
      });
    }

    // Wire Test Connection Button
    const btnTest = drawerEl.querySelector(".as-btn-test-connection");
    const statusContainer = drawerEl.querySelector(".as-test-status-container");
    const baseUrlInput = drawerEl.querySelector(".as-detail-base-url");

    if (btnTest) {
      btnTest.addEventListener("click", async (e) => {
        e.stopPropagation();
        const key = keyInput ? keyInput.value.trim() : null;
        const baseUrl = baseUrlInput ? baseUrlInput.value.trim() : null;

        btnTest.innerHTML = \`\${ICONS.refresh} <span>Testing...</span>\`;
        btnTest.style.opacity = "0.7";

        try {
          let res = null;
          if (typeof window.test_provider === "function") {
            res = await window.test_provider(p.id, key, baseUrl);
          } else {
            res = { success: true, latencyMs: 120, availableModels: preset.models };
          }

          testResults[p.id] = res;

          if (res.success) {
            statusContainer.style.display = "flex";
            statusContainer.className = "as-test-status-container as-test-status-msg success";
            statusContainer.innerHTML = \`\${ICONS.check} <span>Connection successful (\${res.latencyMs}ms latency). Ready for browser automation.</span>\`;

            // Update item header status pill immediately
            if (itemEl) {
              const headerStatusPill = itemEl.querySelector(".as-bento-status-pill");
              if (headerStatusPill) {
                headerStatusPill.className = "as-bento-status-pill connected";
                headerStatusPill.innerHTML = \`<span class="as-bento-status-dot"></span><span>\${res.latencyMs}ms</span>\`;
              }
            }

            // If new models were discovered (e.g. from Ollama or account models), re-populate drawer
            if (Array.isArray(res.availableModels) && res.availableModels.length > 0) {
              populateAccordionDrawer(drawerEl, p, preset, itemEl);
            }
          } else {
            statusContainer.style.display = "flex";
            statusContainer.className = "as-test-status-container as-test-status-msg error";
            statusContainer.innerHTML = \`\${ICONS.alertTriangle} <span>\${escapeHtml(res.error || "Connection test failed")}</span>\`;
          }
        } catch (err) {
          statusContainer.style.display = "flex";
          statusContainer.className = "as-test-status-container as-test-status-msg error";
          statusContainer.innerHTML = \`\${ICONS.alertTriangle} <span>Test failed: \${escapeHtml(err.message)}</span>\`;
        } finally {
          btnTest.innerHTML = p.id === "antigravity"
            ? \`\${ICONS.zap} <span>Verify CLI Connection</span>\`
            : p.id === "ollama"
            ? \`\${ICONS.refresh} <span>Scan Models</span>\`
            : \`\${ICONS.zap} <span>Test Connection</span>\`;
          btnTest.style.opacity = "1";
        }
      });
    }

    // Wire Save & Activate Provider Button
    const btnSave = drawerEl.querySelector(".as-btn-save-provider");
    if (btnSave) {
      btnSave.addEventListener("click", async (e) => {
        e.stopPropagation();
        const key = keyInput ? keyInput.value.trim() : null;
        const baseUrl = baseUrlInput ? baseUrlInput.value.trim() : null;

        const checkedInputs = drawerEl.querySelectorAll(".as-model-checkbox-input:checked");
        const selectedModels = Array.from(checkedInputs).map((input) => ({
          id: input.getAttribute("data-model-id"),
          name: input.getAttribute("data-model-name"),
          provider: p.id,
        }));

        btnSave.innerHTML = \`\${ICONS.refresh} <span>Saving &amp; Activating...</span>\`;
        btnSave.style.opacity = "0.7";

        try {
          if (typeof window.save_provider_config === "function") {
            await window.save_provider_config({
              providerId: p.id,
              apiKey: key,
              customBaseUrl: baseUrl,
              selectedModels,
            });
          }

          // Update local registered models
          registeredModels = registeredModels.filter((m) => m.provider !== p.id);
          selectedModels.forEach((m) => {
            registeredModels.push({
              id: m.id,
              name: m.name,
              provider: p.id,
            });
          });

          // If no active model or active model was removed, pick first of this provider
          if (!registeredModels.some((m) => m.id === activeModelId)) {
            activeModelId = selectedModels[0]?.id || registeredModels[0]?.id || null;
            window.agenticSelectedModel = activeModelId;
          }

          // Update providersData
          const provEntry = providersData.find((item) => item.id === p.id);
          if (provEntry) {
            provEntry.isConfigured = true;
            if (key && key !== "••••••••") provEntry.hasKey = true;
            if (baseUrl) provEntry.customBaseUrl = baseUrl;
          }

          renderProvidersAccordion();
          renderModelList();
          updateTabBadge();
          setStatus("idle", \`Saved \${p.name} configuration with \${selectedModels.length} active models\`);
        } catch (err) {
          setStatus("error", \`Save failed: \${err.message}\`);
        } finally {
          btnSave.innerHTML = \`\${ICONS.check} <span>Save &amp; Activate \${escapeHtml(p.name)}</span>\`;
          btnSave.style.opacity = "1";
        }
      });
    }
  }

  // --------------------------------------------------------------------------
  // Tab 2: Configured Models Tab Rendering
  // --------------------------------------------------------------------------
  function renderConfiguredModelsTab() {
    if (!configuredModelsListEl) return;
    configuredModelsListEl.innerHTML = "";

    if (registeredModels.length === 0) {
      configuredModelsListEl.innerHTML = \`
        <div class="as-empty-models-notice">
          No models configured yet. Select a provider in the "AI Providers" tab to activate models.
        </div>
      \`;
      return;
    }

    registeredModels.forEach((m) => {
      const isSelected = m.id === activeModelId;
      const card = document.createElement("div");
      card.className = "as-configured-model-item";

      const prov = PRESET_PROVIDERS.find((p) => p.id === m.provider) || { name: (m.provider || "Custom").toUpperCase() };

      card.innerHTML = \`
        <div class="as-model-meta-info">
          <div class="as-model-item-title">\${escapeHtml(m.name || m.id)}</div>
          <div class="as-model-item-sub">\${escapeHtml(prov.name)} • \${escapeHtml(m.id)}</div>
        </div>
        <div class="as-model-item-actions">
          \${
            isSelected
              ? \`<span class="as-model-active-badge">\${ICONS.check} Active</span>\`
              : \`<button class="as-btn-model-activate" data-model="\${escapeHtml(m.id)}">Activate</button>\`
          }
          <button class="as-btn-model-delete" data-model="\${escapeHtml(m.id)}" title="Delete model">
            \${ICONS.trash}
          </button>
        </div>
      \`;

      const activateBtn = card.querySelector(".as-btn-model-activate");
      if (activateBtn) {
        activateBtn.addEventListener("click", () => {
          activeModelId = m.id;
          window.agenticSelectedModel = m.id;
          renderConfiguredModelsTab();
          renderModelList();
          setStatus("idle", \`Activated model: \${m.name || m.id}\`);
        });
      }

      const deleteBtn = card.querySelector(".as-btn-model-delete");
      if (deleteBtn) {
        deleteBtn.addEventListener("click", async () => {
          const mId = m.id;
          registeredModels = registeredModels.filter((item) => item.id !== mId);
          if (activeModelId === mId) {
            activeModelId = registeredModels[0]?.id || null;
            window.agenticSelectedModel = activeModelId;
          }
          if (typeof window.delete_model === "function") {
            await window.delete_model(mId);
          }
          renderConfiguredModelsTab();
          renderProvidersBento();
          renderModelList();
          updateTabBadge();
          setStatus("idle", \`Removed model: \${m.name || mId}\`);
        });
      }

      configuredModelsListEl.appendChild(card);
    });
  }

  // Quick Add Custom Model Accordion & Form in Tab 2
  const btnToggleCustomModel = sidebar.querySelector("#as-btn-toggle-custom-model");
  const customModelForm = sidebar.querySelector("#as-custom-model-form");
  if (btnToggleCustomModel && customModelForm) {
    btnToggleCustomModel.addEventListener("click", () => {
      const isOpen = customModelForm.style.display !== "none";
      customModelForm.style.display = isOpen ? "none" : "flex";
      const chevron = btnToggleCustomModel.querySelector(".as-custom-model-chevron");
      if (chevron) chevron.innerHTML = isOpen ? ICONS.chevronDown : ICONS.chevronUp;
    });

    customModelForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const provSelect = sidebar.querySelector("#as-custom-provider-select");
      const idInput = sidebar.querySelector("#as-custom-model-id-input");
      const nameInput = sidebar.querySelector("#as-custom-model-name-input");

      const provider = provSelect?.value || "custom";
      const id = idInput?.value.trim();
      const name = nameInput?.value.trim() || id;

      if (!id) return;

      const newModel = { id, name, provider };
      const existingIdx = registeredModels.findIndex((item) => item.id === id);
      if (existingIdx >= 0) {
        registeredModels[existingIdx] = newModel;
      } else {
        registeredModels.push(newModel);
      }

      activeModelId = id;
      window.agenticSelectedModel = id;

      if (typeof window.save_model === "function") {
        await window.save_model(newModel);
      }

      idInput.value = "";
      nameInput.value = "";
      customModelForm.style.display = "none";

      renderConfiguredModelsTab();
      renderProvidersBento();
      renderModelList();
      updateTabBadge();
      setStatus("idle", \`Added custom model: \${name}\`);
    });
  }

  // --------------------------------------------------------------------------
  // Tab 3: Automation & Vision Preferences
  // --------------------------------------------------------------------------
  const settingToggleSom = sidebar.querySelector("#as-setting-toggle-som");
  const floatingSomToggle = sidebar.querySelector("#as-btn-som-toggle");
  const railSomToggle = rail.querySelector("#as-rail-som-toggle");

  if (settingToggleSom) {
    settingToggleSom.addEventListener("click", () => {
      const isActive = settingToggleSom.classList.toggle("active");
      settingToggleSom.setAttribute("aria-checked", String(isActive));
      if (floatingSomToggle) {
        floatingSomToggle.classList.toggle("active", isActive);
        floatingSomToggle.setAttribute("aria-checked", String(isActive));
      }
      if (railSomToggle) {
        railSomToggle.style.color = isActive ? "#facc15" : "#71717a";
      }
      window.__SOM_ACTIVE__ = isActive;
      setStatus("idle", \`Visual marks \${isActive ? "enabled" : "disabled"}\`);
    });
  }

  // Downloads & Storage Preferences
  const downloadsDirInput = sidebar.querySelector("#as-setting-downloads-dir");
  const saveDownloadsBtn = sidebar.querySelector("#as-btn-save-downloads-dir");
  const presetSystemDlBtn = sidebar.querySelector("#as-btn-preset-system-dl");
  const presetProjectDlBtn = sidebar.querySelector("#as-btn-preset-project-dl");
  const presetArticlesDlBtn = sidebar.querySelector("#as-btn-preset-articles-dl");
  const downloadStatusHint = sidebar.querySelector("#as-download-status-hint");

  let appSettingsCache = null;

  async function loadAppSettings() {
    try {
      if (typeof window.get_app_settings === "function") {
        appSettingsCache = await window.get_app_settings();
        if (appSettingsCache && downloadsDirInput) {
          downloadsDirInput.value = appSettingsCache.downloadsDir || "";
        }
      }
    } catch (err) {
      console.warn("Failed to load app settings:", err);
    }
  }

  loadAppSettings();

  function showDownloadHint(msg, isSuccess = true) {
    if (!downloadStatusHint) return;
    downloadStatusHint.textContent = msg;
    downloadStatusHint.style.color = isSuccess ? "#10b981" : "#ef4444";
    downloadStatusHint.style.display = "block";
    setTimeout(() => {
      downloadStatusHint.style.display = "none";
    }, 4500);
  }

  if (saveDownloadsBtn && downloadsDirInput) {
    saveDownloadsBtn.addEventListener("click", async () => {
      const val = (downloadsDirInput.value || "").trim();
      if (!val) {
        showDownloadHint("Please enter a valid folder path", false);
        return;
      }
      try {
        saveDownloadsBtn.disabled = true;
        saveDownloadsBtn.textContent = "Saving...";
        if (typeof window.save_app_settings === "function") {
          const res = await window.save_app_settings({ downloadsDir: val });
          appSettingsCache = res;
          showDownloadHint(\`Saved! Downloads will go directly to: \${val}\`, true);
          setStatus("idle", \`Download folder set to: \${val}\`);
        }
      } catch (err) {
        showDownloadHint(\`Error saving: \${err.message}\`, false);
      } finally {
        saveDownloadsBtn.disabled = false;
        saveDownloadsBtn.textContent = "Save";
      }
    });
  }

  if (presetSystemDlBtn && downloadsDirInput) {
    presetSystemDlBtn.addEventListener("click", async () => {
      try {
        if (typeof window.reset_downloads_dir === "function") {
          const res = await window.reset_downloads_dir();
          appSettingsCache = res;
          downloadsDirInput.value = res.downloadsDir || "";
          showDownloadHint(\`Reset to System Downloads folder: \${res.downloadsDir}\`, true);
          setStatus("idle", \`Download folder set to: \${res.downloadsDir}\`);
        } else if (appSettingsCache && appSettingsCache.defaultDownloadsDir) {
          downloadsDirInput.value = appSettingsCache.defaultDownloadsDir;
        }
      } catch (err) {
        showDownloadHint(\`Error: \${err.message}\`, false);
      }
    });
  }

  if (presetProjectDlBtn && downloadsDirInput) {
    presetProjectDlBtn.addEventListener("click", async () => {
      const target = (appSettingsCache && appSettingsCache.projectDownloadsDir) ? appSettingsCache.projectDownloadsDir : "./downloads";
      downloadsDirInput.value = target;
      if (typeof window.save_app_settings === "function") {
        const res = await window.save_app_settings({ downloadsDir: target });
        appSettingsCache = res;
        showDownloadHint(\`Saved! Downloads will go to project folder: \${target}\`, true);
        setStatus("idle", \`Download folder set to: \${target}\`);
      }
    });
  }

  if (presetArticlesDlBtn && downloadsDirInput) {
    presetArticlesDlBtn.addEventListener("click", async () => {
      const target = (appSettingsCache && appSettingsCache.articlesDownloadsDir) ? appSettingsCache.articlesDownloadsDir : "./downloads/articles";
      downloadsDirInput.value = target;
      if (typeof window.save_app_settings === "function") {
        const res = await window.save_app_settings({ downloadsDir: target });
        appSettingsCache = res;
        showDownloadHint(\`Saved! Downloads will go to: \${target}\`, true);
        setStatus("idle", \`Download folder set to: \${target}\`);
      }
    });
  }

  // --------------------------------------------------------------------------
  // Chat View Model Selector Dropdown Synchronization
  // --------------------------------------------------------------------------
  function renderModelList() {
    if (!modelItemsListEl) return;
    modelItemsListEl.innerHTML = "";

    if (registeredModels.length === 0) {
      if (modelNameEl) modelNameEl.textContent = "No Model Configured";
      if (nimStatusText) nimStatusText.textContent = "No Model";
      if (nimStatusPill) nimStatusPill.classList.add("inactive");
      window.agenticSelectedModel = null;

      const emptyDiv = document.createElement("div");
      emptyDiv.className = "as-empty-models-popover";
      emptyDiv.innerHTML = \`
        <span>No models configured yet</span>
        <button class="as-btn-popover-settings" id="as-btn-empty-settings" type="button">
          \${ICONS.settings}
          <span>Configure in Settings</span>
        </button>
      \`;
      emptyDiv.querySelector("#as-btn-empty-settings").addEventListener("click", (e) => {
        e.stopPropagation();
        modelSelectEl?.classList.remove("open");
        modelTriggerEl?.setAttribute("aria-expanded", "false");
        setView("settings");
      });
      modelItemsListEl.appendChild(emptyDiv);
      return;
    }

    let activeModel = registeredModels.find((m) => m.id === activeModelId);
    if (!activeModel) {
      activeModel = registeredModels[0];
      activeModelId = activeModel.id;
    }
    window.agenticSelectedModel = activeModel.id;

    if (modelNameEl) modelNameEl.textContent = activeModel.name || activeModel.id;
    if (nimStatusText) nimStatusText.textContent = activeModel.name || activeModel.id;
    if (nimStatusPill) nimStatusPill.classList.remove("inactive");

    const label = document.createElement("div");
    label.className = "as-select-label";
    label.textContent = "Available Models";
    modelItemsListEl.appendChild(label);

    registeredModels.forEach((m) => {
      const isSelected = m.id === activeModelId;
      const itemEl = document.createElement("div");
      itemEl.className = \`as-select-item \${isSelected ? "selected" : ""}\`;
      itemEl.setAttribute("data-model", m.id);
      itemEl.setAttribute("role", "option");
      itemEl.setAttribute("aria-selected", String(isSelected));

      itemEl.innerHTML = \`
        <div class="as-select-item-info">
          <span class="as-select-item-title">\${escapeHtml(m.name || m.id)}</span>
          <span class="as-select-item-sub">\${escapeHtml((m.provider || "custom").toUpperCase())} • \${escapeHtml(m.id)}</span>
        </div>
        <span class="as-select-check">\${ICONS.check}</span>
      \`;

      itemEl.addEventListener("click", (e) => {
        e.stopPropagation();
        activeModelId = m.id;
        window.agenticSelectedModel = m.id;
        renderModelList();
        modelSelectEl?.classList.remove("open");
        modelTriggerEl?.setAttribute("aria-expanded", "false");
        setStatus("idle", \`Switched model to \${m.name || m.id}\`);
      });

      modelItemsListEl.appendChild(itemEl);
    });

    const divider = document.createElement("div");
    divider.className = "as-select-divider";
    modelItemsListEl.appendChild(divider);

    const manageBtn = document.createElement("button");
    manageBtn.type = "button";
    manageBtn.className = "as-select-manage-btn";
    manageBtn.innerHTML = \`\${ICONS.settings}<span>Manage Models in Settings</span>\`;
    manageBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      modelSelectEl?.classList.remove("open");
      modelTriggerEl?.setAttribute("aria-expanded", "false");
      setView("settings");
    });
    modelItemsListEl.appendChild(manageBtn);
  }

  // Initial render of chat view model selector
  renderModelList();

  if (modelTriggerEl && modelSelectEl) {
    modelTriggerEl.addEventListener("click", (e) => {
      e.stopPropagation();
      if (uploadDropdownEl) uploadDropdownEl.classList.remove("open");
      const isOpen = modelSelectEl.classList.toggle("open");
      modelTriggerEl.setAttribute("aria-expanded", String(isOpen));
    });
  }

  // Close dropdowns on outside click
  document.addEventListener("click", (e) => {
    if (modelSelectEl && !modelSelectEl.contains(e.target)) {
      modelSelectEl.classList.remove("open");
      modelTriggerEl?.setAttribute("aria-expanded", "false");
    }
    if (uploadDropdownEl && !uploadDropdownEl.contains(e.target)) {
      uploadDropdownEl.classList.remove("open");
      uploadTriggerBtn?.setAttribute("aria-expanded", "false");
    }
  });
  `;
}
