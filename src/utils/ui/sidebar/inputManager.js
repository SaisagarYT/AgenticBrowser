"use strict";

/**
 * Input Manager
 * Handles user textarea input, auto-resize, file attachment handling (drag & drop, image preview, removal),
 * task submission lifecycle, prompt chips, and chat clearing.
 */

export function getInputManagerCode() {
  return `
  // --------------------------------------------------------------------------
  // Clear Chat History
  // --------------------------------------------------------------------------
  function clearChat() {
    hideSkeleton();
    if (typeof finishActiveTypewriter === "function") finishActiveTypewriter();
    currentStreamingCard = null;
    activeTimelineContainer = null;
    activeTimelineStream = null;
    activeTimelineCountBadge = null;
    activeTimelineItemCount = 0;
    const cards = contentEl.querySelectorAll(".as-bubble-user, .as-card-step, .as-action-timeline-container, .as-ai-response-container, .as-inline-plan-card, .as-skeleton-container, .as-artifact-card");
    cards.forEach((c) => c.remove());
    if (heroView) heroView.style.display = "flex";
    if (statusLabel) statusLabel.textContent = "Ready. Type a prompt below to automate.";
    if (statusSpinner) statusSpinner.style.display = "none";
    attachedFiles = [];
    attachmentListEl.innerHTML = "";
    attachmentListEl.style.display = "none";
    currentTaskThoughts = [];
    resetPlan();
  }

  clearBtn.addEventListener("click", clearChat);
  railClearBtn.addEventListener("click", () => {
    clearChat();
    setCollapsed(false);
  });

  // --------------------------------------------------------------------------
  // File Upload & Drag & Drop Handling
  // --------------------------------------------------------------------------
  fileInput.addEventListener("change", (e) => {
    if (e.target.files) handleFiles(e.target.files);
    fileInput.value = "";
  });

  voxleCardEl.addEventListener("dragover", (e) => {
    e.preventDefault();
    voxleCardEl.classList.add("drag-over");
  });

  voxleCardEl.addEventListener("dragleave", () => {
    voxleCardEl.classList.remove("drag-over");
  });

  voxleCardEl.addEventListener("drop", (e) => {
    e.preventDefault();
    voxleCardEl.classList.remove("drag-over");
    if (e.dataTransfer?.files) handleFiles(e.dataTransfer.files);
  });

  function handleFiles(files) {
    Array.from(files).forEach((file) => {
      const isImg = file.type.startsWith("image/");
      const reader = new FileReader();

      reader.onload = (evt) => {
        const fileObj = {
          name: file.name,
          size: file.size,
          type: file.type,
          isImage: isImg,
          dataUrl: isImg ? evt.target.result : null,
        };
        attachedFiles.push(fileObj);
        renderAttachmentPill(fileObj);
      };

      if (isImg) {
        reader.readAsDataURL(file);
      } else {
        reader.readAsArrayBuffer(file);
      }
    });
  }

  function renderAttachmentPill(fileObj) {
    attachmentListEl.style.display = "flex";
    const pill = document.createElement("div");
    pill.className = "as-attachment-pill";

    const thumbHtml = fileObj.isImage
      ? \`<img class="as-attachment-thumb" src="\${fileObj.dataUrl}" alt="" />\`
      : \`<span style="display:flex;align-items:center;color:#a1a1aa;">\${ICONS.fileText}</span>\`;

    pill.innerHTML = \`
      \${thumbHtml}
      <span class="as-attachment-name" title="\${escapeHtml(fileObj.name)}">\${escapeHtml(fileObj.name)}</span>
      <button class="as-attachment-remove" title="Remove attachment">\${ICONS.close}</button>
    \`;

    pill.querySelector(".as-attachment-remove").addEventListener("click", () => {
      attachedFiles = attachedFiles.filter((f) => f !== fileObj);
      pill.remove();
      if (attachedFiles.length === 0) {
        attachmentListEl.style.display = "none";
      }
    });

    attachmentListEl.appendChild(pill);
  }

  // --------------------------------------------------------------------------
  // Prompt Chips & History Submissions
  // --------------------------------------------------------------------------
  sidebar.querySelectorAll(".as-chip-btn").forEach((chip) => {
    chip.addEventListener("click", () => {
      textareaEl.value = chip.getAttribute("data-prompt") || "";
      textareaEl.focus();
      triggerSubmit();
    });
  });

  sheetHistoryList.querySelectorAll(".as-sheet-history-item").forEach((item) => {
    item.addEventListener("click", () => {
      textareaEl.value = item.getAttribute("data-task") || item.textContent.trim();
      setSheetOpen(false);
      textareaEl.focus();
      triggerSubmit();
    });
  });

  // --------------------------------------------------------------------------
  // Submit & Textarea Management
  // --------------------------------------------------------------------------
  function triggerSubmit() {
    const text = textareaEl.value.trim();
    if (!text && attachedFiles.length === 0) return;

    const activeModel = window.agenticSelectedModel || (registeredModels[0]?.id || null);
    if (!activeModel) {
      setStatus("idle", "No model configured. Opening Settings to configure a model...");
      setView("settings");
      return;
    }

    resetPlan();
    currentTaskStartTime = Date.now();
    currentTaskThoughts = [];
    lastSubmittedCommand = text;

    const currentAttachments = [...attachedFiles];
    textareaEl.value = "";
    textareaEl.style.height = "40px";
    textareaEl.scrollTop = 0;
    attachedFiles = [];
    attachmentListEl.innerHTML = "";
    attachmentListEl.style.display = "none";

    if (heroView) heroView.style.display = "none";
    appendUserBubble(text, currentAttachments);
    showSkeleton();
    setStatus("processing", "Planning step-by-step strategy...");

    let fullCommand = text;
    if (currentAttachments.length > 0) {
      const fileNames = currentAttachments.map((f) => f.name).join(", ");
      fullCommand = fullCommand ? \`\${fullCommand} (Attached: \${fileNames})\` : \`Process attached: \${fileNames}\`;
    }

    // Initialize or maintain active session ID across multi-turn prompts
    if (!window.__ACTIVE_SESSION_ID__) {
      window.__ACTIVE_SESSION_ID__ = "sess_" + Date.now() + "_" + Math.random().toString(36).slice(2, 8);
      const titleSpan = headerChatMenuBtn?.querySelector("span");
      if (titleSpan && text) {
        titleSpan.textContent = text.length > 22 ? text.slice(0, 22) + "..." : text;
      }
    }

    if (typeof window.process_task === "function") {
      window.process_task({
        command: fullCommand,
        model: activeModel,
        sessionId: window.__ACTIVE_SESSION_ID__,
      });
    } else {
      console.warn("window.process_task is not attached yet.");
    }
  }

  sendBtn.addEventListener("click", triggerSubmit);

  // Stop keyboard events on textarea from bubbling to host web pages (like GitHub, YouTube, Jira)
  // which register global listeners on document/window for shortcuts (e.g. "/", "s", "?")
  // and hijack keystrokes or steal focus away.
  textareaEl.addEventListener("keydown", (e) => {
    e.stopPropagation();
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      triggerSubmit();
    }
  });

  textareaEl.addEventListener("keyup", (e) => {
    e.stopPropagation();
  });

  textareaEl.addEventListener("keypress", (e) => {
    e.stopPropagation();
  });

  // Stop mousedown/pointerdown from bubbling so host web apps cannot cancel focus
  textareaEl.addEventListener("mousedown", (e) => {
    e.stopPropagation();
  });

  textareaEl.addEventListener("pointerdown", (e) => {
    e.stopPropagation();
  });

  // Card click-to-focus delegation:
  // If the user clicks anywhere inside the card padding or dead space, ensure the textarea is focused
  // (unless clicking an interactive element like a button, dropdown, or attachment chip)
  if (voxleCardEl) {
    voxleCardEl.addEventListener("click", (e) => {
      if (e.target.closest("button, select, input, .as-shadcn-select, .as-attachment-pill, a")) {
        return;
      }
      if (textareaEl && document.activeElement !== textareaEl) {
        textareaEl.focus();
      }
    });

    voxleCardEl.addEventListener("mousedown", (e) => {
      if (!e.target.closest("button, select, input, .as-shadcn-select, .as-attachment-pill, a")) {
        e.stopPropagation();
      }
    });

    voxleCardEl.addEventListener("pointerdown", (e) => {
      if (!e.target.closest("button, select, input, .as-shadcn-select, .as-attachment-pill, a")) {
        e.stopPropagation();
      }
    });
  }

  // Prevent host webpage shortcut hijacking across all sidebar inputs/textareas
  sidebar.addEventListener("keydown", (e) => {
    const active = document.activeElement;
    if (active && (active.tagName === "INPUT" || active.tagName === "TEXTAREA" || active.isContentEditable)) {
      e.stopPropagation();
    }
  });
  sidebar.addEventListener("keyup", (e) => {
    const active = document.activeElement;
    if (active && (active.tagName === "INPUT" || active.tagName === "TEXTAREA" || active.isContentEditable)) {
      e.stopPropagation();
    }
  });

  function autoResizeTextarea() {
    textareaEl.style.height = "auto";
    const newHeight = Math.min(Math.max(textareaEl.scrollHeight, 40), 140);
    textareaEl.style.height = newHeight + "px";
  }

  textareaEl.addEventListener("input", autoResizeTextarea);

  function setStatus(state, message) {
    if (statusLabel) statusLabel.textContent = message;
    if (statusSpinner) {
      if (state === "processing") {
        statusSpinner.style.display = "inline-block";
      } else {
        statusSpinner.style.display = "none";
      }
    }
  }
  `;
}
