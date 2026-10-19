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
  // Sheet (Drawer) Management
  // --------------------------------------------------------------------------
  function setSheetOpen(isOpen) {
    if (isOpen) {
      sheet.classList.add("open");
      sheetOverlay.classList.add("open");
    } else {
      sheet.classList.remove("open");
      sheetOverlay.classList.remove("open");
    }
  }

  drawerBtn.addEventListener("click", () => setSheetOpen(true));
  sheetOverlay.addEventListener("click", () => setSheetOpen(false));
  sheetNewChat.addEventListener("click", () => {
    setSheetOpen(false);
    clearChat();
    textareaEl.focus();
  });

  sidebar.querySelectorAll(".as-sheet-link").forEach((link) => {
    link.addEventListener("click", () => {
      sidebar.querySelectorAll(".as-sheet-link").forEach((l) => l.classList.remove("active"));
      link.classList.add("active");
    });
  });

  // --------------------------------------------------------------------------
  // Collapse / Rail Toggle
  // --------------------------------------------------------------------------
  function setCollapsed(collapsed) {
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
    themeBtn.innerHTML = icon;
    railThemeBtn.innerHTML = icon;
  }

  themeBtn.addEventListener("click", toggleTheme);
  railThemeBtn.addEventListener("click", toggleTheme);

  // --------------------------------------------------------------------------
  // Visual Marks (Set-of-Marks Overlay - Phase 5)
  // --------------------------------------------------------------------------
  let isVisualMarksActive = true;
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
    const item = document.createElement("div");
    item.className = "as-sheet-history-item";
    item.textContent = taskText;
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
    addUserMessage: (msg) => {
      appendUserBubble(msg);
      showSkeleton();
    },
    addSystemMessage: (msg, type = "step") => appendStepCard(msg, type),
    setStatus: (status) => setStatus("idle", status),
    setProcessing: (status) => setStatus("processing", status),
    showSkeleton: (status) => showSkeleton(status),
    hideSkeleton: () => hideSkeleton(),
    clearMessages: clearChat,
    toggleVisualMarks: () => setVisualMarksVisible(!isVisualMarksActive),
    setVisualMarksVisible: (v) => setVisualMarksVisible(Boolean(v)),
  };
  `;
}
