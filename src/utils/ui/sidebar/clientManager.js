"use strict";

/**
 * Client Lifecycle & Global API Manager
 * Handles DOM mounting, responsive body reflow, SPA watchdog observers, drawer sheet toggling,
 * collapse/expand rail mode, light/dark theme toggling, Set-of-Marks visual overlay toggling,
 * and exposes window.agenticSidebar for Playwright automation.
 */

export function getClientManagerCode() {
  return `
  // --------------------------------------------------------------------------
  // DOM Mounting & Body Reflow
  // --------------------------------------------------------------------------
  function mountSidebar() {
    const root = document.documentElement || document.body;
    if (!root) {
      if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", mountSidebar, { once: true });
      } else {
        setTimeout(mountSidebar, 25);
      }
      return;
    }

    const headTarget = document.head || document.documentElement || document.body;
    if (headTarget && !document.getElementById("agentic-sidebar-styles")) {
      headTarget.appendChild(style);
    }

    if (root && !document.getElementById("agentic-sidebar-wrapper")) {
      root.appendChild(container);
    }

    if (isCurrentlyCollapsed) {
      sidebar.classList.add("collapsed");
      rail.style.display = "flex";
    } else {
      sidebar.classList.remove("collapsed");
      rail.style.display = "none";
    }
    adaptPageLayout(isCurrentlyCollapsed);
  }

  // Initialize mounting and layout
  mountSidebar();

  // Watchdog: Keep sidebar mounted across SPAs and dynamic DOM rewrites (YouTube, Twitter, GitHub, etc.)
  if (!window.__agenticSidebarObserver && window.MutationObserver) {
    try {
      const observer = new MutationObserver(() => {
        const root = document.documentElement || document.body;
        if (root && !document.getElementById("agentic-sidebar-wrapper")) {
          mountSidebar();
        }
      });
      const obsTarget = document.documentElement || document.body;
      if (obsTarget) {
        observer.observe(obsTarget, { childList: true });
      }
      window.__agenticSidebarObserver = observer;
    } catch {
      // Ignore
    }
  }

  // Watchdog: Re-attach on client-side SPA navigations (pushState / popstate)
  if (!window.__agenticHistoryHooked && window.history) {
    window.__agenticHistoryHooked = true;
    try {
      const origPushState = history.pushState;
      history.pushState = function (...args) {
        const ret = origPushState.apply(this, args);
        setTimeout(mountSidebar, 80);
        return ret;
      };
      const origReplaceState = history.replaceState;
      history.replaceState = function (...args) {
        const ret = origReplaceState.apply(this, args);
        setTimeout(mountSidebar, 80);
        return ret;
      };
      window.addEventListener("popstate", () => setTimeout(mountSidebar, 80));
    } catch {
      // Ignore
    }
  }

  // --------------------------------------------------------------------------
  // Sheet (Drawer) & Chat Session Management
  // --------------------------------------------------------------------------
  function setSheetOpen(isOpen) {
    if (isOpen) {
      sheet.classList.add("open");
      sheetOverlay.classList.add("open");
      loadChatHistory();
    } else {
      sheet.classList.remove("open");
      sheetOverlay.classList.remove("open");
    }
  }

  function startNewChat() {
    setSheetOpen(false);
    clearChat();
    const titleSpan = headerChatMenuBtn?.querySelector("span");
    if (titleSpan) titleSpan.textContent = "New AI Chat";
    window.__ACTIVE_SESSION_ID__ = null;
    setStatus("idle", "Ready. Type a prompt below to automate.");
    if (typeof window.reset_antigravity_session === "function") {
      window.reset_antigravity_session().catch(() => {});
    }
    setTimeout(() => textareaEl?.focus(), 150);
  }

  headerChatMenuBtn?.addEventListener("click", () => setSheetOpen(true));
  drawerBtn?.addEventListener("click", () => setSheetOpen(true));
  sheetOverlay?.addEventListener("click", () => setSheetOpen(false));
  sheetCloseBtn?.addEventListener("click", () => setSheetOpen(false));

  // Close sheet on Escape key
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && sheet.classList.contains("open")) {
      setSheetOpen(false);
    }
  });

  headerNewChatBtn?.addEventListener("click", startNewChat);
  sheetNewChat?.addEventListener("click", startNewChat);
  railNewBtn?.addEventListener("click", () => {
    setCollapsed(false);
    startNewChat();
  });

  function formatRelativeTime(isoString) {
    if (!isoString) return "";
    try {
      const diffMs = Date.now() - new Date(isoString).getTime();
      const diffSec = Math.floor(diffMs / 1000);
      if (diffSec < 60) return "Just now";
      const diffMin = Math.floor(diffSec / 60);
      if (diffMin < 60) return diffMin + "m ago";
      const diffHr = Math.floor(diffMin / 60);
      if (diffHr < 24) return diffHr + "h ago";
      const diffDays = Math.floor(diffHr / 24);
      if (diffDays === 1) return "Yesterday";
      if (diffDays < 7) return diffDays + "d ago";
      return new Date(isoString).toLocaleDateString(undefined, { month: "short", day: "numeric" });
    } catch {
      return "";
    }
  }

  // Restore session title if previously set
  if (window.__ACTIVE_SESSION_TITLE__) {
    const titleSpan = headerChatMenuBtn?.querySelector("span");
    if (titleSpan) {
      titleSpan.textContent = window.__ACTIVE_SESSION_TITLE__.length > 22
        ? window.__ACTIVE_SESSION_TITLE__.slice(0, 22) + "..."
        : window.__ACTIVE_SESSION_TITLE__;
    }
  }

  let loadedSessionsCache = [];

  // Search filter inside drawer
  sheetSearchInput?.addEventListener("input", (e) => {
    const query = (e.target.value || "").toLowerCase().trim();
    if (!query) {
      renderSessions(loadedSessionsCache);
      return;
    }
    const filtered = loadedSessionsCache.filter((s) => {
      const title = (s.title || s.latest_command || s.command || "").toLowerCase();
      return title.includes(query);
    });
    renderSessions(filtered);
  });

  async function loadChatHistory() {
    if (!sheetHistoryList) return;
    sheetHistoryList.innerHTML = \`<div class="as-sheet-loading">Loading recent sessions...</div>\`;
    if (sheetSearchInput) sheetSearchInput.value = "";

    try {
      let sessions = [];
      if (typeof window.get_chat_history === "function") {
        sessions = await window.get_chat_history();
      } else {
        const res = await fetch("/api/tasks?limit=50").catch(() => null);
        if (res && res.ok) sessions = await res.json();
      }

      loadedSessionsCache = Array.isArray(sessions) ? sessions : [];
      if (sheetSessionCount) {
        sheetSessionCount.textContent = String(loadedSessionsCache.length);
      }

      renderSessions(loadedSessionsCache);
    } catch {
      sheetHistoryList.innerHTML = \`<div class="as-sheet-empty">Failed to load history.</div>\`;
    }
  }

  function renderSessions(sessionsList) {
    if (!sheetHistoryList) return;
    sheetHistoryList.innerHTML = "";

    if (!Array.isArray(sessionsList) || sessionsList.length === 0) {
      sheetHistoryList.innerHTML = \`<div class="as-sheet-empty">No conversations found.</div>\`;
      return;
    }

    sessionsList.forEach((s) => {
      const item = document.createElement("div");
      item.className = "as-sheet-history-item";
      if (window.__ACTIVE_SESSION_ID__ && window.__ACTIVE_SESSION_ID__ === s.id) {
        item.classList.add("active");
      }

      const status = s.latest_status || s.status || "COMPLETED";
      const isCompleted = status === "COMPLETED";
      const isFailed = status === "FAILED";
      const statusDotClass = isCompleted ? "completed" : isFailed ? "failed" : "running";

      const titleText = s.title || s.latest_command || s.command || "AI Chat Session";
      const timeText = formatRelativeTime(s.updated_at || s.created_at);

      item.innerHTML = \`
        <div class="as-sheet-item-left">
          <span class="as-sheet-item-dot \${statusDotClass}"></span>
          <div class="as-sheet-item-col">
            <span class="as-sheet-item-text" title="\${escapeHtml(titleText)}">\${escapeHtml(titleText)}</span>
            \${timeText ? \`<div class="as-sheet-item-meta"><span class="as-sheet-item-time">\${escapeHtml(timeText)}</span></div>\` : ""}
          </div>
        </div>
        <div class="as-sheet-item-actions">
          <button class="as-btn-history-edit" title="Rename conversation" data-session-id="\${escapeHtml(s.id)}">
            \${ICONS.edit}
          </button>
          <button class="as-btn-history-delete" title="Delete conversation" data-session-id="\${escapeHtml(s.id)}">
            \${ICONS.trash}
          </button>
        </div>
      \`;

      // Click row to view conversation details
      item.querySelector(".as-sheet-item-left").addEventListener("click", () => {
        loadSessionDetails(s);
      });

      // Edit / Rename Conversation Title
      const editBtn = item.querySelector(".as-btn-history-edit");
      editBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        const colEl = item.querySelector(".as-sheet-item-col");
        const actionsEl = item.querySelector(".as-sheet-item-actions");
        if (!colEl) return;

        actionsEl.style.display = "none";
        colEl.innerHTML = \`
          <div class="as-sheet-edit-container">
            <input type="text" class="as-sheet-edit-input" value="\${escapeHtml(s.title || titleText)}" maxlength="80" />
            <button class="as-btn-edit-save" title="Save">\${ICONS.check}</button>
            <button class="as-btn-edit-cancel" title="Cancel">\${ICONS.close}</button>
          </div>
        \`;

        const editInput = colEl.querySelector(".as-sheet-edit-input");
        const saveBtn = colEl.querySelector(".as-btn-edit-save");
        const cancelBtn = colEl.querySelector(".as-btn-edit-cancel");

        editInput.focus();
        editInput.select();

        const commitSave = async () => {
          const newTitle = editInput.value.trim() || titleText;
          s.title = newTitle;
          if (typeof window.update_chat_session_title === "function") {
            await window.update_chat_session_title(s.id, newTitle);
          }
          if (window.__ACTIVE_SESSION_ID__ === s.id) {
            const titleSpan = headerChatMenuBtn?.querySelector("span");
            if (titleSpan) titleSpan.textContent = newTitle.length > 22 ? newTitle.slice(0, 22) + "..." : newTitle;
          }
          renderSessions(sessionsList);
        };

        saveBtn.addEventListener("click", (ev) => {
          ev.stopPropagation();
          commitSave();
        });

        cancelBtn.addEventListener("click", (ev) => {
          ev.stopPropagation();
          renderSessions(sessionsList);
        });

        editInput.addEventListener("keydown", (ev) => {
          ev.stopPropagation();
          if (ev.key === "Enter") {
            commitSave();
          } else if (ev.key === "Escape") {
            renderSessions(sessionsList);
          }
        });
      });

      // Delete Conversation
      item.querySelector(".as-btn-history-delete").addEventListener("click", async (e) => {
        e.stopPropagation();
        const targetId = s.id;
        item.remove();
        loadedSessionsCache = loadedSessionsCache.filter((item) => item.id !== targetId);
        if (sheetSessionCount) {
          sheetSessionCount.textContent = String(loadedSessionsCache.length);
        }
        if (window.__ACTIVE_SESSION_ID__ === targetId) {
          startNewChat();
        }
        if (typeof window.delete_chat_session === "function") {
          await window.delete_chat_session(targetId);
        }
      });

      sheetHistoryList.appendChild(item);
    });
  }

  async function loadSessionDetails(sessionSummary) {
    setSheetOpen(false);
    clearChat();
    if (heroView) heroView.style.display = "none";

    // Silence any currently active Kira voice playback or speech synthesis before restoring chat
    if (window.kiraVoice && typeof window.kiraVoice.stop === "function") {
      try { window.kiraVoice.stop(); } catch {}
    }
    if ("speechSynthesis" in window) {
      try { window.speechSynthesis.cancel(); } catch {}
    }

    window.__ACTIVE_SESSION_ID__ = sessionSummary.id;

    const displayTitle = sessionSummary.title || sessionSummary.latest_command || sessionSummary.command || "AI Chat";
    const titleSpan = headerChatMenuBtn?.querySelector("span");
    if (titleSpan) {
      titleSpan.textContent = displayTitle.length > 22
        ? displayTitle.slice(0, 22) + "..."
        : displayTitle;
    }

    setStatus("idle", "Loading session: " + displayTitle.slice(0, 26) + "...");

    try {
      if (typeof window.get_chat_session === "function") {
        const details = await window.get_chat_session(sessionSummary.id);
        if (details) {
          // If multi-turn session structure: { session, turns }
          if (Array.isArray(details.turns) && details.turns.length > 0) {
            details.turns.forEach((turn) => {
              if (turn.task && turn.task.command) {
                appendUserBubble(turn.task.command);
              }
              if (turn.plan && turn.plan.plan_text) {
                const stepLines = Array.isArray(turn.steps) && turn.steps.length > 0
                  ? turn.steps.map((st) => st.instruction)
                  : turn.plan.plan_text.split("\\n").filter(Boolean);
                appendStepCard(JSON.stringify({ plan: stepLines, stepIndex: stepLines.length, currentInstruction: "Completed workflow" }), "plan", true);
              }
              if (Array.isArray(turn.actions) && turn.actions.length > 0) {
                turn.actions.forEach((act) => {
                  let desc = act.tool_name ? "Executed " + act.tool_name : "Action executed";
                  if (act.parameters) {
                    desc += ": " + (typeof act.parameters === "object" ? JSON.stringify(act.parameters) : act.parameters);
                  }
                  appendStepCard(desc, "browser", true);
                });
              }
              if (turn.task && turn.task.final_response) {
                appendAiResponseCard(turn.task.final_response, true, true);
              } else if (turn.task && turn.task.error) {
                appendStepCard("Error: " + turn.task.error, "done", true);
              }
            });
          } else if (details.task) {
            // Legacy single-task fallback
            if (details.task.command) appendUserBubble(details.task.command);
            if (details.plan && details.plan.plan_text) {
              const stepLines = Array.isArray(details.steps) && details.steps.length > 0
                ? details.steps.map((st) => st.instruction)
                : details.plan.plan_text.split("\\n").filter(Boolean);
              appendStepCard(JSON.stringify({ plan: stepLines, stepIndex: stepLines.length, currentInstruction: "Completed workflow" }), "plan", true);
            }
            if (Array.isArray(details.actions)) {
              details.actions.forEach((act) => {
                appendStepCard(act.tool_name ? "Executed " + act.tool_name : "Action executed", "browser", true);
              });
            }
            if (details.task.final_response) {
              appendAiResponseCard(details.task.final_response, true, true);
            }
          }
        }
      }
      setStatus("idle", "Viewing session: " + displayTitle.slice(0, 24) + " • Ready for next prompt");
    } catch (err) {
      console.warn("Failed to restore session details:", err);
      setStatus("idle", "Ready for follow-up prompt.");
    }
  }

  // --------------------------------------------------------------------------
  // Collapse / Rail Toggle
  // --------------------------------------------------------------------------
  function setCollapsed(collapsed) {
    isCurrentlyCollapsed = Boolean(collapsed);
    try {
      localStorage.setItem("__agentic_sidebar_collapsed__", collapsed ? "true" : "false");
    } catch {}
    if (typeof window.sync_sidebar_collapsed === "function") {
      try { window.sync_sidebar_collapsed(Boolean(collapsed)); } catch {}
    }
    if (collapsed) {
      sidebar.classList.add("collapsed");
      rail.style.display = "flex";
      adaptPageLayout(true);
    } else {
      sidebar.classList.remove("collapsed");
      rail.style.display = "none";
      adaptPageLayout(false);
      setTimeout(() => textareaEl.focus(), 250);
    }
  }

  function toggleCollapsed() {
    const isCurrentlyCollapsed = sidebar.classList.contains("collapsed");
    setCollapsed(!isCurrentlyCollapsed);
  }

  collapseBtn.addEventListener("click", () => setCollapsed(true));
  railExpandBtn.addEventListener("click", () => setCollapsed(false));
  railNewBtn.addEventListener("click", () => {
    setCollapsed(false);
    setTimeout(() => textareaEl.focus(), 250);
  });

  // Keyboard shortcut Ctrl+B or Cmd+B
  document.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && (e.key === "b" || e.key === "B")) {
      e.preventDefault();
      toggleCollapsed();
    }
  });

  // --------------------------------------------------------------------------
  // Theme Toggle (Light / Dark)
  // --------------------------------------------------------------------------
  function toggleTheme() {
    const isDark = sidebar.classList.toggle("dark");
    rail.classList.toggle("dark", isDark);
    const icon = isDark ? ICONS.sun : ICONS.moon;
    if (themeBtn) themeBtn.innerHTML = icon;
    if (railThemeBtn) railThemeBtn.innerHTML = icon;
  }

  themeBtn?.addEventListener("click", toggleTheme);
  railThemeBtn?.addEventListener("click", toggleTheme);

  // --------------------------------------------------------------------------
  // Visual Marks (Set-of-Marks Overlay - Phase 5)
  // --------------------------------------------------------------------------
  let isVisualMarksActive = false;
  function setVisualMarksVisible(visible) {
    isVisualMarksActive = visible;
    const overlay = document.getElementById("agentic-som-overlay");
    if (overlay) {
      overlay.style.display = isVisualMarksActive ? "block" : "none";
    }
    const icon = isVisualMarksActive ? ICONS.eye : ICONS.eyeOff;
    if (somToggleBtn) {
      somToggleBtn.setAttribute("aria-checked", isVisualMarksActive ? "true" : "false");
      somToggleBtn.classList.toggle("active", isVisualMarksActive);
      somToggleBtn.title = isVisualMarksActive ? "Hide Visual Marks (Alt+M)" : "Show Visual Marks (Alt+M)";
      const iconEl = somToggleBtn.querySelector(".as-som-switch-icon");
      if (iconEl) {
        iconEl.innerHTML = icon;
      } else {
        somToggleBtn.innerHTML = icon;
        somToggleBtn.style.color = isVisualMarksActive ? "#facc15" : "";
      }
    }
    if (railSomToggleBtn) {
      railSomToggleBtn.innerHTML = icon;
      railSomToggleBtn.title = isVisualMarksActive ? "Hide Visual Marks (Alt+M)" : "Show Visual Marks (Alt+M)";
      railSomToggleBtn.style.color = isVisualMarksActive ? "#facc15" : "";
    }
  }

  if (somToggleBtn) somToggleBtn.addEventListener("click", () => setVisualMarksVisible(!isVisualMarksActive));
  if (railSomToggleBtn) railSomToggleBtn.addEventListener("click", () => setVisualMarksVisible(!isVisualMarksActive));

  // Keyboard shortcut Alt+M to toggle visual marks
  document.addEventListener("keydown", (e) => {
    if ((e.altKey || (e.ctrlKey && e.shiftKey)) && (e.key === "m" || e.key === "M")) {
      e.preventDefault();
      setVisualMarksVisible(!isVisualMarksActive);
    }
  });

  // --------------------------------------------------------------------------
  // History Item Helper
  // --------------------------------------------------------------------------
  function addHistoryItem(taskText) {
    if (!sheetHistoryList) return;
    const item = document.createElement("div");
    item.className = "as-sheet-history-item";
    item.innerHTML = \`
      <div class="as-sheet-item-left">
        <span class="as-sheet-item-dot running"></span>
        <span class="as-sheet-item-text" title="\${escapeHtml(taskText)}">\${escapeHtml(taskText)}</span>
      </div>
    \`;
    item.addEventListener("click", () => {
      textareaEl.value = taskText;
      setSheetOpen(false);
      textareaEl.focus();
    });
    sheetHistoryList.prepend(item);
  }

  // --------------------------------------------------------------------------
  // Public Global Interface for Playwright Agents
  // --------------------------------------------------------------------------
  window.agenticSidebar = {
    setCollapsed,
    toggleCollapsed,
    isCollapsed: () => isCurrentlyCollapsed,
    addUserMessage: (msg, isReplay = false) => {
      appendUserBubble(msg);
      if (!isReplay) {
        showSkeleton();
      }
    },
    addSystemMessage: (msg, type = "step", isReplay = false) => appendStepCard(msg, type, isReplay),
    streamToken: (text) => {
      if (typeof streamTokenToAiCard === "function") {
        streamTokenToAiCard(text);
      }
    },
    finalizeTokenStream: (text) => {
      if (typeof finalizeStreamingAiCard === "function") {
        finalizeStreamingAiCard(text);
      }
    },
    setStatus: (status) => setStatus("idle", status),
    setProcessing: (status) => setStatus("processing", status),
    showSkeleton: (status) => showSkeleton(status),
    hideSkeleton: () => hideSkeleton(),
    clearMessages: clearChat,
    toggleVisualMarks: () => setVisualMarksVisible(!isVisualMarksActive),
    setVisualMarksVisible: (v) => setVisualMarksVisible(Boolean(v)),
    setActiveSessionId: (id) => { window.__ACTIVE_SESSION_ID__ = id; },
    getActiveSessionId: () => window.__ACTIVE_SESSION_ID__,
    updateSessionTitle: (sessionId, newTitle) => {
      if (!newTitle) return;
      if (window.__ACTIVE_SESSION_ID__ === sessionId || !window.__ACTIVE_SESSION_ID__) {
        const titleSpan = headerChatMenuBtn?.querySelector("span");
        if (titleSpan) {
          titleSpan.textContent = newTitle.length > 22 ? newTitle.slice(0, 22) + "..." : newTitle;
        }
      }
      const match = loadedSessionsCache.find((s) => s.id === sessionId);
      if (match) {
        match.title = newTitle;
        renderSessions(loadedSessionsCache);
      }
    },
  };
  `;
}
