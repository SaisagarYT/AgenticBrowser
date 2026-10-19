"use strict";

/**
 * Chat Manager
 * Handles user message bubbles, pure shadcn loading skeleton shimmer,
 * assistant response cards with thought accordion & action toolbar, and step card event routing.
 */

export function getChatManagerCode() {
  return `
  // --------------------------------------------------------------------------
  // User Bubble & Skeleton Shimmer
  // --------------------------------------------------------------------------
  function appendUserBubble(text, attachments = []) {
    if (heroView) heroView.style.display = "none";

    // Immediate duplicate prevention (e.g. local echo + backend addUserMessage call)
    const lastEl = contentEl.lastElementChild;
    if (lastEl && lastEl.classList.contains("as-bubble-user")) {
      const lastText = lastEl.textContent.trim();
      const currentText = (text || "").trim();
      if (lastText === currentText || (currentText && lastText.includes(currentText))) {
        return;
      }
    }

    const bubble = document.createElement("div");
    bubble.className = "as-bubble-user";
    bubble.setAttribute("style", "color: #ffffff !important; -webkit-text-fill-color: #ffffff !important; background-color: #18181b !important;");

    let attachHtml = "";
    if (attachments.length > 0) {
      attachHtml =
        \`<div style="display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 6px;">\` +
        attachments
          .map((att) => {
            if (att.isImage) {
              return \`<img src="\${att.dataUrl}" style="width: 48px; height: 48px; border-radius: 6px; object-fit: cover; border: 1px solid rgba(255, 255, 255, 0.2);" />\`;
            }
            return \`<span style="display: inline-flex; align-items: center; gap: 4px; padding: 2px 6px; border-radius: 4px; background: rgba(255, 255, 255, 0.15); font-size: 10px; color: #ffffff !important; -webkit-text-fill-color: #ffffff !important;">\${ICONS.fileText} \${escapeHtml(att.name)}</span>\`;
          })
          .join("") +
        \`</div>\`;
    }

    bubble.innerHTML = \`\${attachHtml}<div style="color: #ffffff !important; -webkit-text-fill-color: #ffffff !important; word-break: break-word !important; font-size: 12.5px !important; line-height: 1.45 !important;">\${escapeHtml(text || "Uploaded attachment(s)")}</div>\`;
    contentEl.appendChild(bubble);
    contentEl.scrollTop = contentEl.scrollHeight;
  }

  // Pure shadcn/ui Skeleton AI Loading Animation Component
  let currentSkeletonEl = null;

  function showSkeleton() {
    hideSkeleton();
    if (heroView) heroView.style.display = "none";

    const container = document.createElement("div");
    container.className = "as-skeleton-container";
    container.id = "as-ai-skeleton";

    container.innerHTML = \`
      <!-- Top Thought Bar Skeleton -->
      <div class="as-skeleton-thought-bar">
        <div class="as-skeleton-bar as-skeleton-pill" style="width: 130px; height: 16px;"></div>
        <div class="as-skeleton-bar as-skeleton-pill" style="width: 68px; height: 16px;"></div>
      </div>

      <!-- Middle Response Lines Skeleton (7 realistic paragraph lines) -->
      <div class="as-skeleton-lines">
        <div class="as-skeleton-bar" style="width: 82%; height: 11px;"></div>
        <div class="as-skeleton-bar" style="width: 96%; height: 11px;"></div>
        <div class="as-skeleton-bar" style="width: 88%; height: 11px;"></div>
        <div class="as-skeleton-bar" style="width: 94%; height: 11px;"></div>
        <div class="as-skeleton-bar" style="width: 72%; height: 11px;"></div>
        <div class="as-skeleton-bar" style="width: 85%; height: 11px;"></div>
        <div class="as-skeleton-bar" style="width: 44%; height: 11px;"></div>
      </div>

      <!-- Bottom Action Toolbar Skeleton -->
      <div class="as-skeleton-toolbar">
        <div class="as-skeleton-bar as-skeleton-tool-btn"></div>
        <div class="as-skeleton-bar as-skeleton-tool-btn"></div>
        <div class="as-skeleton-bar as-skeleton-tool-btn"></div>
        <div class="as-skeleton-bar as-skeleton-tool-btn"></div>
        <div class="as-skeleton-divider"></div>
        <div class="as-skeleton-bar as-skeleton-tool-pill"></div>
      </div>
    \`;

    contentEl.appendChild(container);
    contentEl.scrollTop = contentEl.scrollHeight;
    currentSkeletonEl = container;
  }

  function updateSkeletonStatus() {
    // Pure symbol-free skeleton
  }

  function hideSkeleton() {
    if (currentSkeletonEl) {
      const el = currentSkeletonEl;
      currentSkeletonEl = null;
      el.style.transition = "opacity 0.15s ease, transform 0.15s ease";
      el.style.opacity = "0";
      el.style.transform = "translateY(-4px)";
      setTimeout(() => {
        if (el.parentNode) el.remove();
      }, 150);
    }
    contentEl.querySelectorAll(".as-skeleton-container").forEach((s) => s.remove());
  }

  // --------------------------------------------------------------------------
  // AI Response Card & Action Toolbar
  // --------------------------------------------------------------------------
  function appendAiResponseCard(text) {
    if (heroView) heroView.style.display = "none";

    const container = document.createElement("div");
    container.className = "as-ai-response-container";

    const elapsedSec = Math.max(1, Math.round((Date.now() - currentTaskStartTime) / 1000));
    const stepCount = currentTaskThoughts.length || (planItems.length > 0 ? planItems.length : 1);
    const sourcesCount = Math.max(1, stepCount);

    let thoughtsListHtml = "";
    if (currentTaskThoughts.length > 0) {
      thoughtsListHtml = currentTaskThoughts
        .map((t) => {
          let label = stripStartSymbols(t.text);
          return \`
            <div class="as-thought-step-line">
              <span class="as-thought-step-bullet">•</span>
              <span>\${escapeHtml(label)}</span>
            </div>
          \`;
        })
        .join("");
    } else {
      thoughtsListHtml = \`
        <div class="as-thought-step-line">
          <span class="as-thought-step-bullet">•</span>
          <span>Analyzed execution context and generated structured response</span>
        </div>
      \`;
    }

    const formattedBody = formatAiMarkdown(text);
    const cleanPlainText = stripStartSymbols(text);

    container.innerHTML = \`
      <div class="as-thought-wrapper">
        <button class="as-thought-bar" type="button" aria-expanded="false" title="Click to view thought process">
          <div class="as-thought-left">
            <span class="as-thought-icon">\${ICONS.lightbulb}</span>
            <span class="as-thought-label">Thought for \${elapsedSec} second\${elapsedSec === 1 ? "" : "s"}</span>
            <span class="as-thought-chevron">\${ICONS.chevronRight}</span>
          </div>
          <div class="as-thought-right">
            <div class="as-sources-badge">
              <div class="as-sources-icons">
                <span class="as-source-pill"></span>
                <span class="as-source-pill"></span>
                <span class="as-source-pill"></span>
              </div>
              <span>\${sourcesCount} sources</span>
            </div>
          </div>
        </button>
        <div class="as-thought-drawer" style="display: none;">
          <div class="as-thought-drawer-inner">
            \${thoughtsListHtml}
          </div>
        </div>
      </div>

      <div class="as-ai-message-body">
        \${formattedBody}
      </div>

      <div class="as-ai-toolbar">
        <button class="as-ai-tool-btn as-btn-copy" title="Copy response" type="button">
          \${ICONS.copy}
        </button>
        <button class="as-ai-tool-btn as-btn-refine" title="Refine response" type="button">
          \${ICONS.sparkles}
        </button>
        <button class="as-ai-tool-btn as-btn-dislike" title="Dislike response" type="button">
          \${ICONS.thumbsDown}
        </button>
        <button class="as-ai-tool-btn as-btn-retry" title="Retry command" type="button">
          \${ICONS.rotateCw}
        </button>
        <div class="as-ai-tool-divider"></div>
        <button class="as-ai-tool-text-btn as-btn-personalize" title="Personalize message" type="button">
          \${ICONS.sliders}
          <span>Personalize message</span>
        </button>
      </div>
    \`;

    // 1. Thought Process accordion toggle
    const thoughtBar = container.querySelector(".as-thought-bar");
    const thoughtDrawer = container.querySelector(".as-thought-drawer");
    if (thoughtBar && thoughtDrawer) {
      thoughtBar.addEventListener("click", (e) => {
        e.stopPropagation();
        const isOpen = thoughtDrawer.style.display !== "none";
        thoughtDrawer.style.display = isOpen ? "none" : "block";
        thoughtBar.classList.toggle("expanded", !isOpen);
        thoughtBar.setAttribute("aria-expanded", String(!isOpen));
      });
    }

    // 2. Copy Button
    const copyBtn = container.querySelector(".as-btn-copy");
    if (copyBtn) {
      copyBtn.addEventListener("click", async () => {
        try {
          await navigator.clipboard.writeText(cleanPlainText);
          copyBtn.innerHTML = ICONS.check;
          copyBtn.classList.add("copied");
          setTimeout(() => {
            copyBtn.innerHTML = ICONS.copy;
            copyBtn.classList.remove("copied");
          }, 2000);
        } catch { }
      });
    }

    // 3. Refine Button
    const refineBtn = container.querySelector(".as-btn-refine");
    if (refineBtn) {
      refineBtn.addEventListener("click", () => {
        textareaEl.value = "Please refine this response with additional detail:";
        autoResizeTextarea();
        textareaEl.focus();
      });
    }

    // 4. Dislike Button
    const dislikeBtn = container.querySelector(".as-btn-dislike");
    if (dislikeBtn) {
      dislikeBtn.addEventListener("click", () => {
        dislikeBtn.style.color = "#ef4444";
        setStatus("idle", "Feedback noted: Response marked unhelpful");
      });
    }

    // 5. Retry Button
    const retryBtn = container.querySelector(".as-btn-retry");
    if (retryBtn) {
      retryBtn.addEventListener("click", () => {
        if (lastSubmittedCommand) {
          textareaEl.value = lastSubmittedCommand;
          autoResizeTextarea();
          triggerSubmit();
        }
      });
    }

    // 6. Personalize Message Button
    const personalizeBtn = container.querySelector(".as-btn-personalize");
    if (personalizeBtn) {
      personalizeBtn.addEventListener("click", () => {
        textareaEl.value = "Personalize this response for my specific project workflow:";
        autoResizeTextarea();
        textareaEl.focus();
      });
    }

    // Zoom listener for screenshots in thought drawer
    container.querySelectorAll(".as-thought-screenshot-thumb").forEach((thumbEl) => {
      thumbEl.addEventListener("click", (e) => {
        e.stopPropagation();
        const b64 = thumbEl.getAttribute("data-base64");
        if (b64) openScreenshotModal(b64);
      });
    });

    contentEl.appendChild(container);
    contentEl.scrollTop = contentEl.scrollHeight;
  }

  // --------------------------------------------------------------------------
  // Step & System Event Message Router
  // --------------------------------------------------------------------------
  function appendStepCard(text, type = "step") {
    if (heroView) heroView.style.display = "none";

    // 1. Route plan updates directly to the inline plan component
    if (type === "plan") {
      updatePlan(text);
      currentTaskThoughts.push({ type: "plan", stage: "planner", text: typeof text === "string" ? text : JSON.stringify(text), time: Date.now() });
      return; // NO extra card in chat!
    }

    // 2. Realtime model thinking / thoughts
    if (type === "thinking" || type === "thought") {
      let tData = text;
      if (typeof text === "string" && text.startsWith("{")) {
        try { tData = JSON.parse(text); } catch { }
      }
      const tText = typeof tData === "object" ? (tData.text || "") : String(tData || "");
      const stage = typeof tData === "object" ? (tData.stage || "planner") : "planner";
      const cleanThought = stripStartSymbols(tText);

      let activeItem = planItems.find((item) => item.status === "in-progress");
      if (activeItem) {
        if (tData.type === "thought" || type === "thought") {
          if (!activeItem.logs) activeItem.logs = [];
          activeItem.logs.push("Reasoning: " + cleanThought);
          activeItem.currentThought = null;
        } else {
          activeItem.currentThought = cleanThought;
        }
        renderInlinePlanCard();
      }

      currentTaskThoughts.push({ type: "thinking", stage, text: cleanThought, time: Date.now() });
      return; // NO extra card in chat!
    }

    // 3. Screenshot capture event (triggers screen flash & shows preview)
    if (type === "screenshot") {
      triggerScreenshotFlash();
      let sData = text;
      if (typeof text === "string" && text.startsWith("{")) {
        try { sData = JSON.parse(text); } catch { }
      }
      const b64 = typeof sData === "object" ? sData.base64 : sData;
      if (b64) {
        let activeItem = planItems.find((item) => item.status === "in-progress") || planItems.filter((item) => item.status === "completed").pop();
        if (activeItem) {
          activeItem.screenshot = b64;
          if (!activeItem.logs) activeItem.logs = [];
          activeItem.logs.push("📸 Vision screenshot captured for verification");
          renderInlinePlanCard();
        }
        currentTaskThoughts.push({ type: "screenshot", base64: b64, time: Date.now() });
      }
      return; // NO extra card in chat!
    }

    // 4. When an executed browser task arrives, record it in the step's interior dropdown
    if (type === "browser") {
      recordStepAction(text);
      currentTaskThoughts.push({ type: "action", stage: "browser", text: stripStartSymbols(text), time: Date.now() });
      return; // NO extra card in chat!
    }

    // 5. When a critique arrives, record note in step's interior dropdown
    if (type === "critique") {
      const cleanCritique = stripStartSymbols(text);
      const activeItem = planItems.find((item) => item.status === "in-progress") || planItems.filter((item) => item.status === "completed").pop();
      if (activeItem) {
        if (!activeItem.logs) activeItem.logs = [];
        activeItem.logs.push("Critique: " + cleanCritique);
        renderInlinePlanCard();
      }
      currentTaskThoughts.push({ type: "critique", stage: "critique", text: cleanCritique, time: Date.now() });
      return; // NO extra card in chat!
    }

    // 6. When entire task finishes, complete all plan steps and output final AI response!
    if (type === "done") {
      completeAllPlanSteps();
      hideSkeleton();
      appendAiResponseCard(text);
      return;
    }

    // Fallback for any other system message
    hideSkeleton();
    const card = document.createElement("div");
    card.className = "as-card-step";
    const cleanText = stripStartSymbols(text);
    card.innerHTML = \`
      <div class="as-card-header">
        <span class="as-badge as-badge-browser">\${ICONS.bot} <span>Action</span></span>
      </div>
      <div class="as-card-body">\${escapeHtml(cleanText)}</div>
    \`;
    contentEl.appendChild(card);
    contentEl.scrollTop = contentEl.scrollHeight;
  }
  `;
}
