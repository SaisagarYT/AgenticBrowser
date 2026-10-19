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

  const EXPANDED_WIDTH = 420;
  const RAIL_WIDTH = 46;
  let isCurrentlyCollapsed = false;

  function getEffectiveExpandedWidth() {
    return Math.min(EXPANDED_WIDTH, Math.floor(window.innerWidth * 0.92));
  }

  // Manage body reflow so web page content adapts cleanly beside the sidebar
  function adaptPageLayout(isCollapsed) {
    isCurrentlyCollapsed = isCollapsed;
    try {
      if (document.body) {
        document.body.style.boxSizing = "border-box";
        document.body.style.transition = "margin-right 0.28s cubic-bezier(0.16, 1, 0.3, 1)";
        document.body.style.marginRight = isCollapsed ? `${RAIL_WIDTH}px` : `${getEffectiveExpandedWidth()}px`;
      }
    } catch {
      // Ignore
    }
  }

  window.addEventListener("resize", () => {
    adaptPageLayout(isCurrentlyCollapsed);
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
  rail.style.display = "none";
  rail.innerHTML = `/* __RAIL_HTML__ */`;
  container.appendChild(rail);

  // 4. Render Full Expanded Sidebar (shadcn + Voxle Modern Layout)
  const sidebar = document.createElement("div");
  sidebar.id = "agentic-sidebar-root";
  sidebar.innerHTML = `/* __SIDEBAR_HTML__ */`;
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
  /* __CLIENT_MODULE__ */
})();
