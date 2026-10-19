"use strict";

/**
 * Settings & Model Manager
 * Handles in-place model settings view swapping, smart provider forms (Antigravity, Ollama, NVIDIA, OpenAI, Groq, OpenRouter),
 * model CRUD operations, and active model synchronization with backend registry.
 */

export function getSettingsManagerCode() {
  return `
  // --------------------------------------------------------------------------
  // shadcn/ui DropdownMenu for Uploads (+) & Model Selector Logic
  // --------------------------------------------------------------------------
  const uploadDropdownEl = sidebar.querySelector("#as-upload-dropdown");
  const uploadTriggerBtn = sidebar.querySelector("#as-btn-upload-trigger");
  const itemUploadDoc = sidebar.querySelector("#as-item-upload-doc");
  const itemUploadImg = sidebar.querySelector("#as-item-upload-img");
  const itemPasteClip = sidebar.querySelector("#as-item-paste-clip");
  const itemPageSnap = sidebar.querySelector("#as-item-page-snap");

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
  // In-Place View Management (Chat View vs Model Settings View)
  // --------------------------------------------------------------------------
  const viewChat = sidebar.querySelector("#as-view-chat");
  const viewSettings = sidebar.querySelector("#as-view-settings");
  const btnSettings = sidebar.querySelector("#as-btn-settings");
  const railSettings = rail.querySelector("#as-rail-settings");
  const btnBackToChat = sidebar.querySelector("#as-btn-back-to-chat");

  const modelItemsListEl = sidebar.querySelector("#as-model-items-list");
  const nimStatusPill = sidebar.querySelector("#as-nim-status");
  const nimStatusText = sidebar.querySelector("#as-nim-status-text");

  const settingsForm = sidebar.querySelector("#as-settings-model-form");
  const settingsProviderSelect = sidebar.querySelector("#as-input-provider");
  const settingsModelIdInput = sidebar.querySelector("#as-input-model-id");
  const settingsModelNameInput = sidebar.querySelector("#as-input-model-name");
  const settingsApiKeyInput = sidebar.querySelector("#as-input-api-key");
  const settingsBaseUrlInput = sidebar.querySelector("#as-input-base-url");
  const btnToggleKey = sidebar.querySelector("#as-btn-toggle-key");
  const configuredModelsListEl = sidebar.querySelector("#as-configured-models-list");

  let registeredModels = Array.isArray(window.__INITIAL_MODELS__) ? [...window.__INITIAL_MODELS__] : [];
  let activeModelId = window.agenticSelectedModel || (registeredModels[0]?.id || null);

  function setView(viewName) {
    if (!viewChat || !viewSettings) return;
    if (viewName === "settings") {
      viewChat.style.display = "none";
      viewSettings.style.display = "flex";
      renderSettingsModelsList();
    } else {
      viewSettings.style.display = "none";
      viewChat.style.display = "flex";
      renderModelList();
    }
  }

  btnSettings?.addEventListener("click", () => setView("settings"));
  railSettings?.addEventListener("click", () => {
    setCollapsed(false);
    setView("settings");
  });
  btnBackToChat?.addEventListener("click", () => setView("chat"));

  // Toggle API Key visibility
  if (btnToggleKey && settingsApiKeyInput) {
    btnToggleKey.addEventListener("click", () => {
      const isPass = settingsApiKeyInput.type === "password";
      settingsApiKeyInput.type = isPass ? "text" : "password";
      btnToggleKey.innerHTML = isPass ? ICONS.eyeOff : ICONS.eye;
    });
  }

  const keyField = sidebar.querySelector("#as-field-api-key");
  const baseUrlField = sidebar.querySelector("#as-field-base-url");
  const agBanner = sidebar.querySelector("#as-field-ag-banner");

  function syncProviderFields(provider) {
    if (!settingsProviderSelect) return;
    const p = provider || settingsProviderSelect.value;

    if (p === "antigravity") {
      if (settingsModelIdInput) settingsModelIdInput.value = "antigravity/local";
      if (settingsModelNameInput) settingsModelNameInput.value = "Antigravity CLI Agent";
      if (keyField) keyField.style.setProperty("display", "none", "important");
      if (baseUrlField) baseUrlField.style.setProperty("display", "none", "important");
      if (agBanner) agBanner.style.setProperty("display", "flex", "important");
    } else {
      if (agBanner) agBanner.style.setProperty("display", "none", "important");
      if (p === "ollama") {
        if (keyField) keyField.style.setProperty("display", "none", "important");
        if (baseUrlField) {
          baseUrlField.style.setProperty("display", "flex", "important");
          if (!settingsBaseUrlInput.value) settingsBaseUrlInput.value = "http://localhost:11434/v1";
        }
        if (!settingsModelIdInput.value || settingsModelIdInput.value === "antigravity/local") {
          settingsModelIdInput.value = "llama3";
          settingsModelNameInput.value = "Llama 3";
        }
      } else {
        if (keyField) keyField.style.setProperty("display", "flex", "important");
        if (baseUrlField) baseUrlField.style.setProperty("display", "flex", "important");

        if (p === "nvidia") {
          if (settingsApiKeyInput) settingsApiKeyInput.placeholder = "Enter NVIDIA API key (nvapi-...)";
          if (!settingsModelIdInput.value || settingsModelIdInput.value === "antigravity/local" || settingsModelIdInput.value === "llama3") {
            settingsModelIdInput.value = "nvidia/nemotron-3-ultra-550b-a55b";
            settingsModelNameInput.value = "Nemotron 550B";
          }
        } else if (p === "openai") {
          if (settingsApiKeyInput) settingsApiKeyInput.placeholder = "Enter OpenAI API key (sk-...)";
          if (!settingsModelIdInput.value || settingsModelIdInput.value === "antigravity/local" || settingsModelIdInput.value === "llama3") {
            settingsModelIdInput.value = "gpt-4o";
            settingsModelNameInput.value = "GPT-4o";
          }
        } else if (p === "groq") {
          if (settingsApiKeyInput) settingsApiKeyInput.placeholder = "Enter Groq API key (gsk_...)";
          if (!settingsModelIdInput.value || settingsModelIdInput.value === "antigravity/local" || settingsModelIdInput.value === "llama3") {
            settingsModelIdInput.value = "llama-3.3-70b-versatile";
            settingsModelNameInput.value = "Llama 3.3 70B (Groq)";
          }
        } else if (p === "openrouter") {
          if (settingsApiKeyInput) settingsApiKeyInput.placeholder = "Enter OpenRouter API key (sk-or-...)";
          if (!settingsModelIdInput.value || settingsModelIdInput.value === "antigravity/local" || settingsModelIdInput.value === "llama3") {
            settingsModelIdInput.value = "deepseek/deepseek-r1";
            settingsModelNameInput.value = "DeepSeek R1 (OpenRouter)";
          }
        } else {
          if (settingsApiKeyInput) settingsApiKeyInput.placeholder = "Enter API key if required";
        }
      }
    }
  }

  // Auto-fill defaults and update visibility based on selected provider
  if (settingsProviderSelect) {
    settingsProviderSelect.addEventListener("change", () => {
      syncProviderFields(settingsProviderSelect.value);
    });
  }

  syncProviderFields();

  async function persistModel(modelData) {
    if (typeof window.save_model === "function") {
      await window.save_model(modelData);
    } else {
      await fetch("/api/models", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(modelData),
      }).catch(() => {});
    }
  }

  async function persistDeleteModel(modelId) {
    if (typeof window.delete_model === "function") {
      await window.delete_model(modelId);
    } else {
      await fetch(\`/api/models/\${encodeURIComponent(modelId)}\`, { method: "DELETE" }).catch(() => {});
    }
  }

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

    // Verify active model exists
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
      itemEl.setAttribute("data-name", m.name || m.id);
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

  function renderSettingsModelsList() {
    if (!configuredModelsListEl) return;
    configuredModelsListEl.innerHTML = "";

    if (registeredModels.length === 0) {
      configuredModelsListEl.innerHTML = \`
        <div class="as-empty-models-notice">
          No models configured yet. Fill out the form above to add your first model.
        </div>
      \`;
      return;
    }

    registeredModels.forEach((m) => {
      const isSelected = m.id === activeModelId;
      const card = document.createElement("div");
      card.className = "as-configured-model-item";

      card.innerHTML = \`
        <div class="as-model-meta-info">
          <div class="as-model-item-title">\${escapeHtml(m.name || m.id)}</div>
          <div class="as-model-item-sub">\${escapeHtml((m.provider || "custom").toUpperCase())} • \${escapeHtml(m.id)}</div>
        </div>
        <div class="as-model-item-actions">
          \${
            isSelected
              ? \`<span class="as-model-active-badge"><span class="as-active-dot"></span> Active</span>\`
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
          renderSettingsModelsList();
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
          await persistDeleteModel(mId);
          renderSettingsModelsList();
          renderModelList();
          setStatus("idle", \`Removed model: \${m.name || mId}\`);
        });
      }

      configuredModelsListEl.appendChild(card);
    });
  }

  // Model Form Submission
  if (settingsForm) {
    settingsForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const provider = settingsProviderSelect.value;
      const id = settingsModelIdInput.value.trim();
      const name = settingsModelNameInput.value.trim() || id;
      const apiKey = settingsApiKeyInput.value.trim();
      const baseURL = settingsBaseUrlInput.value.trim();

      if (!id) return;

      const modelData = {
        id,
        name,
        provider,
        ...(apiKey ? { apiKey } : {}),
        ...(baseURL ? { baseURL } : {}),
      };

      const existingIndex = registeredModels.findIndex((m) => m.id === id);
      if (existingIndex >= 0) {
        registeredModels[existingIndex] = { ...registeredModels[existingIndex], ...modelData };
      } else {
        registeredModels.push(modelData);
      }

      activeModelId = id;
      window.agenticSelectedModel = id;

      await persistModel(modelData);
      renderSettingsModelsList();
      renderModelList();

      settingsModelIdInput.value = "";
      settingsModelNameInput.value = "";
      settingsApiKeyInput.value = "";
      settingsBaseUrlInput.value = "";

      setView("chat");
      setStatus("idle", \`Added and activated model: \${name}\`);
    });
  }

  // Initial render of models list
  renderModelList();

  if (modelTriggerEl && modelSelectEl) {
    modelTriggerEl.addEventListener("click", (e) => {
      e.stopPropagation();
      if (uploadDropdownEl) uploadDropdownEl.classList.remove("open");
      const isOpen = modelSelectEl.classList.toggle("open");
      modelTriggerEl.setAttribute("aria-expanded", String(isOpen));
    });
  }

  // Close both popovers when clicking outside
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
