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
    activeTimelineContainer = null;
    activeTimelineStream = null;
    activeTimelineCountBadge = null;
    activeTimelineItemCount = 0;

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

  let activeTypewriter = null;

  function finishActiveTypewriter() {
    if (activeTypewriter) {
      clearInterval(activeTypewriter.timer);
      const current = activeTypewriter;
      activeTypewriter = null;
      try {
        if (current.bodyEl) {
          current.bodyEl.innerHTML = formatAiMarkdown(current.fullText);
        }
        if (current.toolbarEl) {
          current.toolbarEl.style.opacity = "1";
          current.toolbarEl.style.pointerEvents = "auto";
        }
        contentEl.scrollTop = contentEl.scrollHeight;
      } catch { }
    }
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
  // Typewriter Streaming Animation Engine (ChatGPT / Claude style)
  // --------------------------------------------------------------------------
  function typewriteMarkdown(bodyEl, fullText, toolbarEl, onDone) {
    const safeText = String(fullText || "");
    if (!safeText.trim()) {
      bodyEl.innerHTML = formatAiMarkdown(safeText);
      if (toolbarEl) {
        toolbarEl.style.opacity = "1";
        toolbarEl.style.pointerEvents = "auto";
      }
      if (typeof onDone === "function") onDone();
      return;
    }

    // Finish any prior ongoing typewriter smoothly before starting a new one
    finishActiveTypewriter();

    const tokens = safeText.split(/(\\s+)/).filter(Boolean);
    let tokenIdx = 0;
    let accumulated = "";

    const totalTokens = tokens.length;
    const targetDurationMs = Math.max(500, Math.min(2400, totalTokens * 12));
    const tickIntervalMs = 16;
    const totalTicks = Math.max(1, Math.floor(targetDurationMs / tickIntervalMs));
    const tokensPerTick = Math.max(1, Math.ceil(totalTokens / totalTicks));

    // Initial state: show blinking terminal cursor immediately
    bodyEl.innerHTML = '<span class="as-streaming-cursor"></span>';

    const timer = setInterval(() => {
      for (let i = 0; i < tokensPerTick && tokenIdx < totalTokens; i++) {
        accumulated += tokens[tokenIdx++];
      }

      bodyEl.innerHTML = formatAiMarkdown(accumulated) + '<span class="as-streaming-cursor"></span>';
      contentEl.scrollTop = contentEl.scrollHeight;

      if (tokenIdx >= totalTokens) {
        finishActiveTypewriter();
        if (typeof onDone === "function") onDone();
      }
    }, tickIntervalMs);

    activeTypewriter = {
      timer,
      bodyEl,
      fullText: safeText,
      toolbarEl,
    };
  }

  // --------------------------------------------------------------------------
  // AI Response Card & Action Toolbar
  // --------------------------------------------------------------------------
  function renderVoicePill(container, spokenText) {
    if (!container || !spokenText) return;
    const bodyEl = container.querySelector(".as-ai-message-body");
    if (!bodyEl) return;
    let pillEl = container.querySelector(".as-voice-spoken-pill");
    if (!pillEl) {
      pillEl = document.createElement("div");
      pillEl.className = "as-voice-spoken-pill";
      bodyEl.parentNode.insertBefore(pillEl, bodyEl);
    }
    pillEl.innerHTML = '<span class="as-voice-spoken-pill-icon">' + ICONS.waveform + '</span><span class="as-voice-spoken-pill-text">"' + escapeHtml(spokenText) + '"</span>';
  }

  function appendAiResponseCard(text, isInstant = false, isReplay = false) {
    if (heroView) heroView.style.display = "none";
    activeTimelineContainer = null;
    activeTimelineStream = null;
    activeTimelineCountBadge = null;
    activeTimelineItemCount = 0;

    // 1. If an active streaming card is already in progress, finalize it instead of creating a second card!
    if (currentStreamingCard && currentStreamingCard.container && currentStreamingCard.container.parentNode) {
      finalizeStreamingAiCard(text, isReplay);
      return;
    }

    // 2. Duplicate prevention: If the last message is already an AI response card, update it rather than appending a duplicate!
    const lastEl = contentEl.lastElementChild;
    if (lastEl && lastEl.classList.contains("as-ai-response-container")) {
      const bodyEl = lastEl.querySelector(".as-ai-message-body");
      if (bodyEl) {
        bodyEl.innerHTML = formatAiMarkdown(text);
        const toolbarEl = lastEl.querySelector(".as-ai-toolbar");
        if (toolbarEl) {
          toolbarEl.style.opacity = "1";
          toolbarEl.style.pointerEvents = "auto";
        }
        attachToolbarListeners(lastEl, text);
        contentEl.scrollTop = contentEl.scrollHeight;
        return;
      }
    }

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

      <div class="as-ai-message-body">\${(isInstant || isReplay) ? formattedBody : ""}</div>

      <div class="as-ai-toolbar" style="\${(isInstant || isReplay) ? 'opacity: 1; pointer-events: auto;' : 'opacity: 0; pointer-events: none;'}">
        <button class="as-ai-tool-btn as-btn-speak" title="Listen to Kira" type="button">
          \${ICONS.volume2}
        </button>
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

    contentEl.appendChild(container);
    contentEl.scrollTop = contentEl.scrollHeight;

    const bodyEl = container.querySelector(".as-ai-message-body");
    const toolbarEl = container.querySelector(".as-ai-toolbar");

    attachToolbarListeners(container, text, renderVoicePill);

    // Trigger voice output IMMEDIATELY upon message arrival (suppressed on history replay)
    if (!isReplay && window.kiraVoice && window.kiraVoice.isVoiceActive && window.kiraVoice.isVoiceActive()) {
      window.kiraVoice.speak(text, container.querySelector(".as-btn-speak"), (spokenText) => {
        renderVoicePill(container, spokenText);
      });
    }

    if (!isInstant && !isReplay && bodyEl) {
      try {
        typewriteMarkdown(bodyEl, text, toolbarEl, () => {});
      } catch (err) {
        console.error("Typewriter error fallback:", err);
        bodyEl.innerHTML = formatAiMarkdown(text);
        if (toolbarEl) {
          toolbarEl.style.opacity = "1";
          toolbarEl.style.pointerEvents = "auto";
        }
      }
    }
  }

  function attachToolbarListeners(container, rawText, renderVoicePill = null) {
    const cleanPlainText = stripStartSymbols(rawText || "");

    // 1. Thought Process accordion toggle
    const thoughtBar = container.querySelector(".as-thought-bar");
    const thoughtDrawer = container.querySelector(".as-thought-drawer");
    if (thoughtBar && thoughtDrawer && !thoughtBar._bound) {
      thoughtBar._bound = true;
      thoughtBar.addEventListener("click", (e) => {
        e.stopPropagation();
        const isOpen = thoughtDrawer.style.display !== "none";
        thoughtDrawer.style.display = isOpen ? "none" : "block";
        thoughtBar.classList.toggle("expanded", !isOpen);
        thoughtBar.setAttribute("aria-expanded", String(!isOpen));
      });
    }

    // 2. Speak Button (Kira Voice)
    const speakBtn = container.querySelector(".as-btn-speak");
    if (speakBtn && !speakBtn._bound) {
      speakBtn._bound = true;
      speakBtn.addEventListener("click", () => {
        if (window.kiraVoice) {
          window.kiraVoice.speak(rawText, speakBtn, (spokenText) => {
            if (typeof renderVoicePill === "function") {
              renderVoicePill(container, spokenText);
            }
          });
        }
      });
    }

    // 3. Copy Button
    const copyBtn = container.querySelector(".as-btn-copy");
    if (copyBtn && !copyBtn._bound) {
      copyBtn._bound = true;
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
    if (refineBtn && !refineBtn._bound) {
      refineBtn._bound = true;
      refineBtn.addEventListener("click", () => {
        textareaEl.value = "Please refine this response with additional detail:";
        autoResizeTextarea();
        textareaEl.focus();
      });
    }

    // 4. Dislike Button
    const dislikeBtn = container.querySelector(".as-btn-dislike");
    if (dislikeBtn && !dislikeBtn._bound) {
      dislikeBtn._bound = true;
      dislikeBtn.addEventListener("click", () => {
        dislikeBtn.style.color = "#ef4444";
        setStatus("idle", "Feedback noted: Response marked unhelpful");
      });
    }

    // 5. Retry Button
    const retryBtn = container.querySelector(".as-btn-retry");
    if (retryBtn && !retryBtn._bound) {
      retryBtn._bound = true;
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
    if (personalizeBtn && !personalizeBtn._bound) {
      personalizeBtn._bound = true;
      personalizeBtn.addEventListener("click", () => {
        textareaEl.value = "Personalize this response for my specific project workflow:";
        autoResizeTextarea();
        textareaEl.focus();
      });
    }

    // Zoom listener for screenshots in thought drawer
    container.querySelectorAll(".as-thought-screenshot-thumb").forEach((thumbEl) => {
      if (!thumbEl._bound) {
        thumbEl._bound = true;
        thumbEl.addEventListener("click", (e) => {
          e.stopPropagation();
          const b64 = thumbEl.getAttribute("data-base64");
          if (b64) openScreenshotModal(b64);
        });
      }
    });
  }

  // --------------------------------------------------------------------------
  // Real-time Live Token Streaming Engine
  // --------------------------------------------------------------------------
  let currentStreamingCard = null;

  function streamTokenToAiCard(accumulatedText) {
    if (heroView) heroView.style.display = "none";
    hideSkeleton();

    if (!currentStreamingCard || !currentStreamingCard.container.parentNode) {
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

        <div class="as-ai-message-body"><span class="as-streaming-cursor"></span></div>

        <div class="as-ai-toolbar" style="opacity: 0; pointer-events: none;">
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

      contentEl.appendChild(container);
      contentEl.scrollTop = contentEl.scrollHeight;

      attachToolbarListeners(container, "");

      currentStreamingCard = {
        container,
        bodyEl: container.querySelector(".as-ai-message-body"),
        toolbarEl: container.querySelector(".as-ai-toolbar"),
      };
    }

    if (currentStreamingCard && currentStreamingCard.bodyEl) {
      currentStreamingCard.bodyEl.innerHTML = formatAiMarkdown(accumulatedText) + '<span class="as-streaming-cursor"></span>';
      contentEl.scrollTop = contentEl.scrollHeight;
    }
  }

  function finalizeStreamingAiCard(finalText, isReplay = false) {
    hideSkeleton();
    activeTimelineContainer = null;
    activeTimelineStream = null;
    activeTimelineCountBadge = null;
    activeTimelineItemCount = 0;
    if (currentStreamingCard && currentStreamingCard.bodyEl) {
      const card = currentStreamingCard;
      currentStreamingCard = null;
      card.bodyEl.innerHTML = formatAiMarkdown(finalText);
      if (card.toolbarEl) {
        card.toolbarEl.style.opacity = "1";
        card.toolbarEl.style.pointerEvents = "auto";
      }
      attachToolbarListeners(card.container, finalText, renderVoicePill);
      contentEl.scrollTop = contentEl.scrollHeight;

      if (!isReplay && window.kiraVoice && window.kiraVoice.isVoiceActive && window.kiraVoice.isVoiceActive()) {
        const speakBtn = card.container.querySelector(".as-btn-speak");
        window.kiraVoice.speak(finalText, speakBtn, (spokenText) => {
          renderVoicePill(card.container, spokenText);
        });
      }
      return true;
    }
    return false;
  }

  // --------------------------------------------------------------------------
  // Artifact & Scholarly Paper Download Card Component
  // --------------------------------------------------------------------------
  function appendArtifactCard(artData) {
    hideSkeleton();
    if (heroView) heroView.style.display = "none";

    const title = artData.title || "Scholarly Article";
    const authors = artData.authors || "";
    const source = artData.source || "Google Scholar";
    const fileSize = artData.fileSize || "PDF";
    const filePath = artData.filePath || "";

    const card = document.createElement("div");
    card.className = "as-card-artifact";

    card.innerHTML = \`
      <div class="as-artifact-top">
        <div class="as-artifact-badge">
          \${ICONS.bookOpen || ICONS.fileText} <span>Academic Paper</span>
        </div>
        <span class="as-artifact-size">\${escapeHtml(fileSize)}</span>
      </div>
      <div class="as-artifact-title">\${escapeHtml(title)}</div>
      \${authors ? \`<div class="as-artifact-authors">\${escapeHtml(authors)}</div>\` : ""}
      <div class="as-artifact-meta">
        <span class="as-artifact-source-tag">\${ICONS.globe || ICONS.search} \${escapeHtml(source)}</span>
      </div>
      <div class="as-artifact-actions">
        <button class="as-artifact-btn as-artifact-open-btn" title="Open PDF">
          \${ICONS.externalLink} Open PDF
        </button>
        <button class="as-artifact-btn as-artifact-reveal-btn" title="Show in Folder">
          \${ICONS.folder} Show in Folder
        </button>
      </div>
    \`;

    const openBtn = card.querySelector(".as-artifact-open-btn");
    const revealBtn = card.querySelector(".as-artifact-reveal-btn");

    if (openBtn) {
      openBtn.addEventListener("click", () => {
        if (filePath && typeof window.open_downloaded_file === "function") {
          window.open_downloaded_file(filePath).catch(() => {});
        } else {
          window.agenticSidebar?.setStatus("Unable to open local file directly.");
        }
      });
    }

    if (revealBtn) {
      revealBtn.addEventListener("click", () => {
        if (filePath && typeof window.reveal_in_folder === "function") {
          window.reveal_in_folder(filePath).catch(() => {});
        } else {
          window.agenticSidebar?.setStatus("Unable to reveal file in folder.");
        }
      });
    }

    contentEl.appendChild(card);
    contentEl.scrollTop = contentEl.scrollHeight;

    // Record action log if plan exists
    if (planItems.length > 0) {
      const activeItem = planItems.find((item) => item.status === "in-progress") || planItems.filter((item) => item.status === "completed").pop();
      if (activeItem) {
        if (!activeItem.logs) activeItem.logs = [];
        activeItem.logs.push(\`📄 Downloaded: "\${title}" (\${fileSize})\`);
        renderInlinePlanCard();
      }
    }
  }

  // --------------------------------------------------------------------------
  // Activity Stepper & Action Timeline Component (Reference-matched)
  // --------------------------------------------------------------------------
  let activeTimelineContainer = null;
  let activeTimelineStream = null;
  let activeTimelineCountBadge = null;
  let activeTimelineItemCount = 0;

  function parseActionPayload(rawText) {
    if (!rawText) {
      return {
        toolName: "ACTION",
        title: "Browser Action",
        typeClass: "as-timeline-completed",
        iconSvg: ICONS.check,
        badge: "ACTION",
        details: []
      };
    }

    let text = String(rawText).trim();
    // Strip leading decoration symbols (⚡, 🤖, 📋, etc.)
    text = text.replace(/^[⚡🤖🔧📋ℹ️📸\s*]+/, "").trim();

    let tool = "";
    let params = null;
    let explicitIntent = "";

    // Case 1: Pure JSON payload
    if (text.startsWith("{") && text.endsWith("}")) {
      try {
        params = JSON.parse(text);
        tool = params.tool || params.toolName || params.action || "";
        explicitIntent = params.intent || params.action_name || params.description || params.title || "";
      } catch {}
    }

    // Case 2: Prefixed format (e.g. "Tool: open_url {...}" or "Executed click_element: {...}")
    if (!tool && (text.startsWith("Tool:") || text.startsWith("Executed:") || text.startsWith("Action:") || text.startsWith("Executed "))) {
      const colonIdx = text.indexOf(":");
      const afterPrefix = colonIdx !== -1 ? text.slice(colonIdx + 1).trim() : text.slice(8).trim();
      const firstSpace = afterPrefix.search(/\\s/);
      if (firstSpace !== -1) {
        tool = afterPrefix.slice(0, firstSpace).trim().replace(/^:/, "");
        const rest = afterPrefix.slice(firstSpace).trim().replace(/^:\\s*/, "");
        try { params = JSON.parse(rest); } catch { params = { raw: rest }; }
      } else {
        tool = afterPrefix;
      }
    } else if (!tool) {
      const spaceIdx = text.indexOf(" ");
      if (spaceIdx !== -1 && text.slice(spaceIdx).trim().startsWith("{")) {
        tool = text.slice(0, spaceIdx).trim();
        try { params = JSON.parse(text.slice(spaceIdx).trim()); } catch { params = { raw: text.slice(spaceIdx).trim() }; }
      }
    }

    if (params && typeof params === "object") {
      if (!explicitIntent) {
        explicitIntent = params.intent || params.action_name || params.description || params.title || "";
      }
    }

    const normTool = (tool || "").toLowerCase().replace(/^browser_/, "");

    let title = explicitIntent || "";
    let typeClass = "as-timeline-completed";
    let iconSvg = ICONS.check;
    let badge = normTool ? normTool.toUpperCase() : "ACTION";
    const details = [];

    if (normTool.includes("open_url") || normTool.includes("goto") || normTool.includes("navigate")) {
      const url = params?.url || params?.href || "";
      let host = url;
      try {
        const u = new URL(url);
        host = u.hostname.replace(/^www\\./, "") + (u.pathname && u.pathname !== "/" ? u.pathname : "");
      } catch {}
      if (!title) {
        title = host ? ("Navigated to " + host) : "Navigated to target URL";
      }
      typeClass = "as-timeline-navigate";
      iconSvg = ICONS.globe || ICONS.check;
      badge = "OPEN_URL";
      if (url) {
        details.push({ label: "Target URL", value: url, isLink: true });
      }
    } else if (normTool.includes("dom") || normTool.includes("extract")) {
      if (!title) {
        title = "Inspected interactive page fields & layout";
      }
      typeClass = "as-timeline-search";
      iconSvg = ICONS.search || ICONS.check;
      badge = "INSPECT";
      if (params?.contentType) {
        details.push({ label: "Scope", value: params.contentType, isCode: true });
      }
    } else if (normTool.includes("final_response")) {
      if (!title) {
        title = "Prepared final task response";
      }
      typeClass = "as-timeline-completed";
      iconSvg = ICONS.check;
      badge = "COMPLETED";
      if (params?.answer) {
        const ans = String(params.answer);
        details.push({ label: "Summary", value: ans.length > 95 ? ans.slice(0, 95) + "..." : ans });
      }
    } else if (normTool.includes("screenshot") || normTool.includes("capture")) {
      const name = params?.name || params?.filename || "settings_verified";
      const displayName = name.endsWith(".png") ? name : (name + ".png");
      if (!title) {
        title = "Captured screenshot: " + name.replace(/\\.png$/, "");
      }
      typeClass = "as-timeline-camera";
      iconSvg = ICONS.camera || ICONS.check;
      badge = "SCREENSHOT";
      details.push({ label: "Artifact", value: displayName, isCode: true });
      if (params?.fullPage) {
        details.push({ label: "Mode", value: "Full page capture" });
      }
    } else if (normTool.includes("click")) {
      const sel = params?.selector || params?.target || params?.text || "target element";
      if (!title) {
        title = "Clicked element " + (sel.length > 28 ? (sel.slice(0, 28) + "...") : sel);
      }
      typeClass = "as-timeline-click";
      iconSvg = ICONS.mousePointer || ICONS.check;
      badge = "CLICK";
      if (params?.selector) {
        details.push({ label: "Selector", value: params.selector, isCode: true });
      }
      if (params?.text) {
        details.push({ label: "Label", value: '"' + params.text + '"' });
      }
    } else if (normTool.includes("type") || normTool.includes("input") || normTool.includes("fill")) {
      const textVal = params?.text || params?.value || "";
      const preview = textVal.length > 24 ? (textVal.slice(0, 24) + "...") : textVal;
      if (!title) {
        title = preview ? ('Entered "' + preview + '"') : "Entered text input";
      }
      typeClass = "as-timeline-type";
      iconSvg = ICONS.type || ICONS.check;
      badge = "INPUT";
      if (params?.selector) {
        details.push({ label: "Field", value: params.selector, isCode: true });
      }
      if (textVal) {
        details.push({ label: "Text", value: '"' + textVal + '"', isCode: true });
      }
    } else if (normTool.includes("scroll")) {
      const dir = params?.direction || "down";
      const target = params?.selector || "";
      if (!title) {
        title = target ? ("Scrolled to " + target) : ("Scrolled page " + dir);
      }
      typeClass = "as-timeline-scroll";
      iconSvg = ICONS.arrowDown || ICONS.check;
      badge = "SCROLL";
      if (params?.direction) {
        details.push({ label: "Direction", value: params.direction });
      }
      if (params?.amount) {
        details.push({ label: "Distance", value: params.amount + "px" });
      }
      if (params?.selector) {
        details.push({ label: "Target", value: params.selector, isCode: true });
      }
    } else if (normTool.includes("search")) {
      const q = params?.query || params?.q || "";
      if (!title) {
        title = q ? ('Searched for "' + q + '"') : "Executed search query";
      }
      typeClass = "as-timeline-search";
      iconSvg = ICONS.search || ICONS.check;
      badge = "SEARCH";
      if (q) {
        details.push({ label: "Query", value: q, isCode: true });
      }
    } else if (normTool) {
      if (!title) {
        title = "Executed " + normTool.replace(/_/g, " ");
      }
      typeClass = "as-timeline-completed";
      iconSvg = ICONS.check;
      badge = normTool.toUpperCase();
      if (params && typeof params === "object") {
        for (const [k, v] of Object.entries(params)) {
          if (v !== undefined && v !== null && typeof v !== "object" && k !== "intent" && k !== "action_name") {
            details.push({ label: k, value: String(v), isCode: true });
          }
        }
      } else if (params?.raw) {
        details.push({ label: "Parameters", value: String(params.raw), isCode: true });
      }
    } else {
      title = text;
      typeClass = "as-timeline-completed";
      iconSvg = ICONS.check;
      badge = "ACTION";
    }

    return {
      toolName: normTool || "action",
      title,
      typeClass,
      iconSvg,
      badge,
      details
    };
  }

  function appendActionTimelineItem(rawText) {
    if (heroView) heroView.style.display = "none";
    hideSkeleton();

    // Check if last element in chat is the active timeline container
    const lastEl = contentEl.lastElementChild;
    const isContinuingTimeline = activeTimelineContainer && lastEl === activeTimelineContainer;

    if (!isContinuingTimeline) {
      activeTimelineContainer = document.createElement("div");
      activeTimelineContainer.className = "as-action-timeline-container";
      activeTimelineItemCount = 0;

      const header = document.createElement("div");
      header.className = "as-timeline-header";
      header.innerHTML = \`
        <div class="as-timeline-title-row">
          <span class="as-timeline-title">Agent Activity</span>
          <span class="as-timeline-count-badge">1 action</span>
        </div>
        <div class="as-timeline-subtitle">Autonomous actions executed during this session.</div>
      \`;
      activeTimelineContainer.appendChild(header);

      activeTimelineStream = document.createElement("div");
      activeTimelineStream.className = "as-timeline-stream";
      activeTimelineContainer.appendChild(activeTimelineStream);

      activeTimelineCountBadge = header.querySelector(".as-timeline-count-badge");
      contentEl.appendChild(activeTimelineContainer);
    }

    activeTimelineItemCount++;
    if (activeTimelineCountBadge) {
      activeTimelineCountBadge.textContent = \`\${activeTimelineItemCount} action\${activeTimelineItemCount === 1 ? "" : "s"}\`;
    }

    const parsed = parseActionPayload(rawText);

    let cardHtml = "";
    if (parsed.details && parsed.details.length > 0) {
      const rowsHtml = parsed.details.map((d) => {
        let valHtml = "";
        if (d.isLink) {
          valHtml = \`<a href="\${escapeHtml(d.value)}" target="_blank" rel="noopener noreferrer" class="as-timeline-card-link">\${escapeHtml(d.value)}</a>\`;
        } else if (d.isCode) {
          valHtml = \`<code class="as-timeline-card-code">\${escapeHtml(d.value)}</code>\`;
        } else {
          valHtml = \`<span class="as-timeline-card-value">\${escapeHtml(d.value)}</span>\`;
        }
        return \`
          <div class="as-timeline-card-row">
            <span class="as-timeline-card-label">\${escapeHtml(d.label)}:</span>
            \${valHtml}
          </div>
        \`;
      }).join("");

      cardHtml = \`
        <div class="as-timeline-card">
          <div class="as-timeline-card-header">
            <div class="as-timeline-card-author">
              <div class="as-timeline-card-avatar">\${ICONS.bot}</div>
              <span class="as-timeline-card-name">Browser Agent</span>
            </div>
            <span class="as-timeline-card-badge">\${escapeHtml(parsed.badge)}</span>
          </div>
          <div class="as-timeline-card-body">
            \${rowsHtml}
          </div>
        </div>
      \`;
    }

    const itemEl = document.createElement("div");
    itemEl.className = \`as-timeline-item \${parsed.typeClass}\`;
    itemEl.innerHTML = \`
      <div class="as-timeline-node-col">
        <div class="as-timeline-node">\${parsed.iconSvg}</div>
        <div class="as-timeline-line"></div>
      </div>
      <div class="as-timeline-content-col">
        <div class="as-timeline-item-header">
          <span class="as-timeline-item-title">\${escapeHtml(parsed.title)}</span>
          <span class="as-timeline-item-time">just now</span>
        </div>
        \${cardHtml}
      </div>
    \`;

    activeTimelineStream.appendChild(itemEl);
    contentEl.scrollTop = contentEl.scrollHeight;
  }

  // --------------------------------------------------------------------------
  // Step & System Event Message Router
  // --------------------------------------------------------------------------
  function appendStepCard(text, type = "step", isReplay = false) {
    if (heroView) heroView.style.display = "none";

    // 0. Route scholarly / file artifact downloads directly to artifact card
    if (type === "artifact" || type === "download") {
      let aData = text;
      if (typeof text === "string" && (text.startsWith("{") || text.includes('"title"'))) {
        try { aData = JSON.parse(text); } catch { }
      }
      if (typeof aData === "object" && aData !== null) {
        appendArtifactCard(aData);
        if (!isReplay && window.kiraVoice && window.kiraVoice.narrateProgress) {
          window.kiraVoice.narrateProgress(aData.title || "Scholarly Article", "artifact");
        }
        return;
      }
    }

    // 1. Route plan updates directly to the inline plan component
    if (type === "plan") {
      hideSkeleton();
      updatePlan(text);
      currentTaskThoughts.push({ type: "plan", stage: "planner", text: typeof text === "string" ? text : JSON.stringify(text), time: Date.now() });

      // Live co-pilot progress voice narration (suppressed on history replay)
      if (!isReplay) {
        try {
          let pData = text;
          if (typeof text === "string" && text.startsWith("{")) {
            pData = JSON.parse(text);
          }
          const instruction = pData.currentInstruction || "";
          if (instruction && window.kiraVoice && window.kiraVoice.narrateProgress) {
            window.kiraVoice.narrateProgress(instruction, "plan");
          }
        } catch {}
      }
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

      if (!isReplay && cleanThought && statusLabel) {
        setStatus("processing", cleanThought.slice(0, 50) + "...");
      }

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
      if (!isReplay) triggerScreenshotFlash();
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
      hideSkeleton();
      if (planItems.length > 0) {
        recordStepAction(text);
      } else {
        appendActionTimelineItem(text);
      }
      currentTaskThoughts.push({ type: "action", stage: "browser", text: stripStartSymbols(text), time: Date.now() });

      // Live co-pilot progress voice narration (suppressed on history replay)
      if (!isReplay && window.kiraVoice && window.kiraVoice.narrateProgress) {
        window.kiraVoice.narrateProgress(text, "browser");
      }
      return; // Handled
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
      if (!finalizeStreamingAiCard(text, isReplay)) {
        appendAiResponseCard(text, isReplay, isReplay);
      }
      return;
    }

    // Fallback for any other system message: render on activity timeline stepper
    hideSkeleton();
    appendActionTimelineItem(text);
  }
  `;
}
