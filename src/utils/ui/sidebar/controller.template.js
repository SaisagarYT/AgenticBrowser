(function () {
  "use strict";

  // 1. Guard against mounting inside iframes (e.g. Google Sign-In button iframes, ads, widgets)
  try {
    if (window.top !== window.self) {
      return;
    }
  } catch {
    // Cross-origin restriction confirms this script is running inside an embedded iframe
    return;
  }

  // 2. Guard against mounting inside small popup dialogs (e.g. OAuth sign-in windows)
  try {
    if (window.opener && (window.innerWidth < 700 || window.innerHeight < 600)) {
      return;
    }
  } catch {
    // Ignore
  }

  // Clean up any previous instance
  const prevWrapper = document.getElementById("agentic-sidebar-wrapper");
  if (prevWrapper) prevWrapper.remove();
  const prevStyles = document.getElementById("agentic-sidebar-styles");
  if (prevStyles) prevStyles.remove();

  const DEFAULT_EXPANDED_WIDTH = 420;
  const MIN_SIDEBAR_WIDTH = 320;
  const MAX_SIDEBAR_WIDTH_RATIO = 0.65;
  const RAIL_WIDTH = 46;

  let userSavedWidth = (function() {
    try {
      const saved = parseInt(localStorage.getItem("__agentic_sidebar_width__"), 10);
      if (!isNaN(saved) && saved >= MIN_SIDEBAR_WIDTH && saved <= 1400) {
        return saved;
      }
    } catch {}
    return DEFAULT_EXPANDED_WIDTH;
  })();

  let isCurrentlyCollapsed = (typeof window.__INITIAL_COLLAPSED__ === "boolean")
    ? window.__INITIAL_COLLAPSED__
    : (function() {
        try {
          return localStorage.getItem("__agentic_sidebar_collapsed__") === "true";
        } catch {
          return false;
        }
      })();

  function getEffectiveExpandedWidth() {
    const maxAllowed = Math.floor(window.innerWidth * MAX_SIDEBAR_WIDTH_RATIO);
    return Math.max(MIN_SIDEBAR_WIDTH, Math.min(userSavedWidth, maxAllowed));
  }

  // Manage true split-viewport body reflow so web page content adapts cleanly beside the sidebar
  function adaptPageLayout(isCollapsed, smooth = true) {
    isCurrentlyCollapsed = Boolean(isCollapsed);
    try {
      const effectiveOffset = isCollapsed ? RAIL_WIDTH : getEffectiveExpandedWidth();
      if (document.documentElement) {
        document.documentElement.style.setProperty("--as-sidebar-width", `${effectiveOffset}px`);
        document.documentElement.style.overflowX = "hidden";
      }
      if (document.body) {
        document.body.style.boxSizing = "border-box";
        if (smooth) {
          document.body.style.transition = "margin-right 0.28s cubic-bezier(0.16, 1, 0.3, 1), width 0.28s cubic-bezier(0.16, 1, 0.3, 1), max-width 0.28s cubic-bezier(0.16, 1, 0.3, 1)";
        } else {
          document.body.style.transition = "none";
        }
        document.body.style.marginRight = `${effectiveOffset}px`;
        document.body.style.width = `calc(100vw - ${effectiveOffset}px)`;
        document.body.style.maxWidth = `calc(100vw - ${effectiveOffset}px)`;
      }
    } catch {
      // Ignore
    }
  }

  window.addEventListener("resize", () => {
    adaptPageLayout(isCurrentlyCollapsed, false);
    if (!isCurrentlyCollapsed && typeof sidebar !== "undefined" && sidebar) {
      const currentWidth = getEffectiveExpandedWidth();
      sidebar.style.setProperty("--as-sidebar-width", `${currentWidth}px`);
      sidebar.style.setProperty("width", `${currentWidth}px`, "important");
    }
  });

  // Create container for true viewport anchoring
  const container = document.createElement("div");
  container.id = "agentic-sidebar-wrapper";

  // 1. Strict shadcn/ui Design Tokens & Styles
  const style = document.createElement("style");
  style.id = "agentic-sidebar-styles";
  style.textContent = `/* __SIDEBAR_STYLES__ */`;

  // 2. Crisp Lucide Vector Icons
  /* __ICONS_AND_ASSETS__ */

  // 3. Render Thin Vertical Rail Dock (46px)
  const rail = document.createElement("div");
  rail.id = "agentic-rail-root";
  rail.style.display = isCurrentlyCollapsed ? "flex" : "none";
  rail.innerHTML = `/* __RAIL_HTML__ */`;
  container.appendChild(rail);

  // 4. Render Full Expanded Sidebar (shadcn + Voxle Modern Layout)
  const sidebar = document.createElement("div");
  sidebar.id = "agentic-sidebar-root";
  const initialExpandedWidth = getEffectiveExpandedWidth();
  sidebar.style.setProperty("--as-sidebar-width", `${initialExpandedWidth}px`);
  sidebar.style.setProperty("width", `${initialExpandedWidth}px`, "important");
  if (isCurrentlyCollapsed) {
    sidebar.classList.add("collapsed");
  }
  sidebar.innerHTML = `/* __SIDEBAR_HTML__ */`;

  // Resizable boundary handle for native side-panel resizing
  const resizeHandle = document.createElement("div");
  resizeHandle.className = "as-resize-handle";
  resizeHandle.id = "as-resize-handle";
  resizeHandle.title = "Drag to resize sidebar";
  sidebar.appendChild(resizeHandle);

  container.appendChild(sidebar);

  // 5. Modular Controller Elements & Shared State
  const contentEl = sidebar.querySelector("#as-content-area");
  const heroView = sidebar.querySelector("#as-hero-view");
  const textareaEl = sidebar.querySelector("#as-textarea");
  const sendBtn = sidebar.querySelector("#as-btn-send");
  const statusLabel = sidebar.querySelector("#as-status-label");
  const statusSpinner = sidebar.querySelector("#as-status-spinner");
  const collapseBtn = sidebar.querySelector("#as-btn-collapse");
  const railExpandBtn = rail.querySelector("#as-rail-expand");
  const railNewBtn = rail.querySelector("#as-rail-new");
  const themeBtn = sidebar.querySelector("#as-btn-theme");
  const railThemeBtn = rail.querySelector("#as-rail-theme");
  const somToggleBtn = sidebar.querySelector("#as-btn-som-toggle");
  const railSomToggleBtn = rail.querySelector("#as-rail-som-toggle");
  const voiceToggleBtn = sidebar.querySelector("#as-btn-voice-toggle");
  const railVoiceToggleBtn = rail.querySelector("#as-rail-voice-toggle");
  const clearBtn = sidebar.querySelector("#as-btn-clear");
  const railClearBtn = rail.querySelector("#as-rail-clear");
  const headerChatMenuBtn = sidebar.querySelector("#as-header-chat-menu");
  const headerNewChatBtn = sidebar.querySelector("#as-header-new-chat");

  // Single Hovering Plan Card Elements & State
  const planWrapper = sidebar.querySelector("#as-plan-wrapper");

  // File Upload & Attachment Elements
  const fileInput = sidebar.querySelector("#as-file-input");
  const attachmentListEl = sidebar.querySelector("#as-attachment-list");
  const voxleCardEl = sidebar.querySelector("#as-voxle-card");
  let attachedFiles = [];
  let currentTaskStartTime = Date.now();
  let currentTaskThoughts = [];
  let lastSubmittedCommand = "";

  // Sheet Elements
  const drawerBtn = sidebar.querySelector("#as-btn-drawer");
  const sheet = sidebar.querySelector("#as-sheet");
  const sheetOverlay = sidebar.querySelector("#as-sheet-overlay");
  const sheetNewChat = sidebar.querySelector("#as-sheet-new-chat");
  const sheetCloseBtn = sidebar.querySelector("#as-sheet-close-btn");
  const sheetSearchInput = sidebar.querySelector("#as-sheet-search");
  const sheetSessionCount = sidebar.querySelector("#as-sheet-session-count");
  const sheetHistoryList = sidebar.querySelector("#as-sheet-history-list");

  /* __MARKDOWN_MODULE__ */
  /* __VISION_MODULE__ */
  /* __PLAN_MODULE__ */
  /* __SETTINGS_MODULE__ */
  /* __CHAT_MODULE__ */
  /* __INPUT_MODULE__ */
  /* __VOICE_MODULE__ */
  /* __CLIENT_MODULE__ */
})();
