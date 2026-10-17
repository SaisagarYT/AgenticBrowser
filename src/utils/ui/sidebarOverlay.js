(function () {
  "use strict";

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

  // --------------------------------------------------------------------------
  // 1. Strict shadcn/ui Design Tokens & Styles
  // --------------------------------------------------------------------------
  const style = document.createElement("style");
  style.id = "agentic-sidebar-styles";
  style.textContent = `
    :root {
      --background: 0 0% 100%;
      --foreground: 240 10% 3.9%;
      --card: 0 0% 100%;
      --card-foreground: 240 10% 3.9%;
      --popover: 0 0% 100%;
      --popover-foreground: 240 10% 3.9%;
      --primary: 240 5.9% 10%;
      --primary-foreground: 0 0% 98%;
      --secondary: 240 4.8% 95.9%;
      --secondary-foreground: 240 5.9% 10%;
      --muted: 240 4.8% 95.9%;
      --muted-foreground: 240 3.8% 46.1%;
      --accent: 240 4.8% 95.9%;
      --accent-foreground: 240 5.9% 10%;
      --destructive: 0 84.2% 60.2%;
      --destructive-foreground: 0 0% 98%;
      --border: 240 5.9% 90%;
      --input: 240 5.9% 90%;
      --ring: 240 5.9% 10%;
      --radius: 0.75rem;
      --dot-color: rgba(0, 0, 0, 0.08);
      --font-sans: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Inter", "Helvetica Neue", sans-serif;
      --font-serif: "Georgia", "Times New Roman", Cambria, serif;
    }

    #agentic-sidebar-root.dark,
    #agentic-rail-root.dark {
      --background: 240 10% 3.9%;
      --foreground: 0 0% 98%;
      --card: 240 10% 4.9%;
      --card-foreground: 0 0% 98%;
      --popover: 240 10% 3.9%;
      --popover-foreground: 0 0% 98%;
      --primary: 0 0% 98%;
      --primary-foreground: 240 5.9% 10%;
      --secondary: 240 3.7% 15.9%;
      --secondary-foreground: 0 0% 98%;
      --muted: 240 3.7% 15.9%;
      --muted-foreground: 240 5% 64.9%;
      --accent: 240 3.7% 15.9%;
      --accent-foreground: 0 0% 98%;
      --destructive: 0 62.8% 30.6%;
      --destructive-foreground: 0 0% 98%;
      --border: 240 3.7% 15.9%;
      --input: 240 3.7% 15.9%;
      --ring: 240 4.9% 83.9%;
      --dot-color: rgba(255, 255, 255, 0.07);
    }

    /* Base Reset & Root Sidebar Container */
    #agentic-sidebar-root {
      all: initial;
      position: fixed !important;
      top: 0px !important;
      right: 0px !important;
      bottom: 0px !important;
      width: min(${EXPANDED_WIDTH}px, 92vw) !important;
      max-width: 92vw !important;
      height: 100vh !important;
      max-height: 100vh !important;
      z-index: 2147483647 !important;
      box-sizing: border-box !important;
      display: flex !important;
      flex-direction: column !important;
      overflow: hidden !important;
      background-color: hsl(var(--background)) !important;
      background-image: radial-gradient(var(--dot-color) 1.25px, transparent 1.25px) !important;
      background-size: 18px 18px !important;
      border-left: 1px solid hsl(var(--border)) !important;
      box-shadow: none !important;
      color: hsl(var(--foreground)) !important;
      font-family: var(--font-sans) !important;
      transition: transform 0.28s cubic-bezier(0.16, 1, 0.3, 1) !important;
      user-select: text !important;
      margin: 0 !important;
      padding: 0 !important;
    }

    #agentic-sidebar-root.collapsed {
      transform: translateX(100%) !important;
    }

    /* ------------------------------------------------------------------------
       2. Thin Vertical Rail Dock (46px)
       ------------------------------------------------------------------------ */
    #agentic-rail-root {
      all: initial;
      position: fixed !important;
      top: 0px !important;
      right: 0px !important;
      bottom: 0px !important;
      width: ${RAIL_WIDTH}px !important;
      height: 100vh !important;
      max-height: 100vh !important;
      z-index: 2147483646 !important;
      box-sizing: border-box !important;
      display: flex !important;
      flex-direction: column !important;
      align-items: center !important;
      background-color: hsl(var(--background)) !important;
      border-left: 1px solid hsl(var(--border)) !important;
      box-shadow: none !important;
      padding: 12px 0 !important;
      gap: 10px !important;
      font-family: var(--font-sans) !important;
      user-select: none !important;
      transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1) !important;
    }

    .as-rail-item {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
    }

    .as-rail-btn {
      all: initial;
      width: 32px;
      height: 32px;
      border-radius: calc(var(--radius) - 4px);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      color: hsl(var(--muted-foreground));
      background: transparent;
      transition: all 0.18s cubic-bezier(0.16, 1, 0.3, 1);
      position: relative;
    }

    .as-rail-btn:hover {
      background: hsl(var(--accent));
      color: hsl(var(--accent-foreground));
      transform: scale(1.05);
    }

    .as-rail-btn:active {
      transform: scale(0.92);
    }

    .as-rail-top-btn {
      all: initial;
      width: 34px;
      height: 34px;
      border-radius: calc(var(--radius) - 2px);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      color: hsl(var(--primary-foreground));
      background: hsl(var(--primary));
      transition: all 0.18s cubic-bezier(0.16, 1, 0.3, 1);
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.08);
    }

    .as-rail-top-btn:hover {
      transform: scale(1.06);
      opacity: 0.92;
    }

    .as-rail-top-btn:active {
      transform: scale(0.92);
    }

    .as-rail-tooltip {
      position: absolute;
      right: 50px;
      top: 50%;
      transform: translateY(-50%) translateX(6px);
      opacity: 0;
      pointer-events: none;
      background: hsl(var(--primary));
      color: hsl(var(--primary-foreground));
      font-size: 11px;
      font-weight: 500;
      padding: 4px 8px;
      border-radius: 6px;
      white-space: nowrap;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
      transition: all 0.18s cubic-bezier(0.16, 1, 0.3, 1);
      z-index: 2147483647;
      border: 1px solid hsl(var(--border));
    }

    .as-rail-item:hover .as-rail-tooltip {
      opacity: 1;
      transform: translateY(-50%) translateX(0);
    }

    .as-rail-divider {
      width: 22px;
      height: 1px;
      background: hsl(var(--border));
      margin: 2px 0;
    }

    .as-rail-pulse {
      position: absolute;
      bottom: 4px;
      right: 4px;
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #facc15;
      box-shadow: 0 0 0 2px hsl(var(--background));
    }

    /* ------------------------------------------------------------------------
       3. Header Bar (shadcn Minimalist Navbar)
       ------------------------------------------------------------------------ */
    .as-header {
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: space-between;
      height: 54px;
      padding: 0 14px;
      border-bottom: 1px solid hsl(var(--border));
      background: hsl(var(--background) / 0.85);
      backdrop-filter: blur(8px);
      box-sizing: border-box;
      z-index: 30;
    }

    .as-header-left {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .as-icon-btn {
      all: initial;
      width: 32px;
      height: 32px;
      border-radius: calc(var(--radius) - 4px);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      color: hsl(var(--foreground));
      background: transparent;
      transition: all 0.15s cubic-bezier(0.16, 1, 0.3, 1);
    }

    .as-icon-btn:hover {
      background: hsl(var(--muted));
      color: hsl(var(--foreground));
    }

    .as-icon-btn:active {
      transform: scale(0.92);
    }

    /* Header Brand Title */
    .as-header-brand {
      display: flex;
      align-items: center;
      gap: 6px;
      padding-left: 4px;
      user-select: none;
    }

    .as-header-title {
      font-size: 13.5px;
      font-weight: 600;
      letter-spacing: -0.2px;
      color: hsl(var(--foreground));
    }

    .as-header-right {
      display: flex;
      align-items: center;
      gap: 2px;
    }

    /* Status Sub-Banner */
    .as-status-bar {
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      padding: 6px 14px;
      font-size: 11px;
      color: hsl(var(--muted-foreground));
      border-bottom: 1px solid hsl(var(--border));
      background: hsl(var(--muted) / 0.5);
      box-sizing: border-box;
    }

    .as-status-text {
      display: flex;
      align-items: center;
      gap: 6px;
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
    }

    .as-spinner {
      width: 10px;
      height: 10px;
      border: 1.5px solid hsl(var(--muted-foreground));
      border-top-color: hsl(var(--primary));
      border-radius: 50%;
      animation: asSpin 0.7s linear infinite;
    }

    @keyframes asSpin {
      to { transform: rotate(360deg); }
    }

    /* ------------------------------------------------------------------------
       4. Sliding History Drawer (shadcn Sheet Component)
       ------------------------------------------------------------------------ */
    .as-sheet-overlay {
      position: absolute;
      inset: 0;
      background: rgba(0, 0, 0, 0.4);
      backdrop-filter: blur(3px);
      z-index: 50;
      opacity: 0;
      pointer-events: none;
      display: none;
      transition: opacity 0.22s ease;
    }

    .as-sheet-overlay.open {
      opacity: 1;
      pointer-events: auto;
      display: block;
    }

    .as-sheet {
      position: absolute;
      top: 0;
      bottom: 0;
      left: 0;
      width: 270px;
      background: hsl(var(--background));
      border-right: 1px solid hsl(var(--border));
      z-index: 60;
      transform: translateX(-100%);
      transition: transform 0.28s cubic-bezier(0.16, 1, 0.3, 1);
      display: flex;
      flex-direction: column;
      box-sizing: border-box;
      padding: 16px 14px;
      gap: 14px;
      pointer-events: none;
    }

    .as-sheet.open {
      transform: translateX(0);
      pointer-events: auto;
    }

    /* + New Chat Button in Sheet */
    .as-sheet-new-btn {
      all: initial;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      height: 38px;
      padding: 0 16px;
      border-radius: 9999px;
      background: #18181b;
      color: #fafafa;
      font-size: 13px;
      font-weight: 500;
      font-family: var(--font-sans);
      cursor: pointer;
      border: 1px solid rgba(255, 255, 255, 0.12);
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
      transition: all 0.18s cubic-bezier(0.16, 1, 0.3, 1);
    }

    .as-sheet-new-btn:hover {
      background: #facc15 !important;
      color: #000000 !important;
      border-color: #eab308 !important;
    }

    .as-sheet-new-btn:active {
      transform: scale(0.96);
    }

    .as-sheet-nav {
      display: flex;
      flex-direction: column;
      gap: 3px;
    }

    .as-sheet-link {
      all: initial;
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 8px 10px;
      border-radius: 6px;
      font-size: 12.5px;
      font-weight: 500;
      color: #a1a1aa; /* subtle gray */
      font-family: var(--font-sans);
      cursor: pointer;
      transition: all 0.15s ease;
      user-select: none;
    }

    .as-sheet-link svg {
      width: 15px;
      height: 15px;
      color: inherit;
      transition: color 0.15s ease;
    }

    .as-sheet-link.active {
      background: rgba(255, 255, 255, 0.08);
      color: #ffffff;
      font-weight: 600;
    }

    .as-sheet-link:hover {
      background: #facc15 !important;
      color: #000000 !important;
    }

    .as-sheet-link:hover svg {
      color: #000000 !important;
    }

    .as-sheet-section-title {
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #71717a; /* gray */
      margin-top: 8px;
      padding: 0 8px;
      user-select: none;
    }

    .as-sheet-history-list {
      flex: 1;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 3px;
      padding-top: 4px;
    }

    .as-sheet-history-item {
      all: initial;
      display: block;
      padding: 7px 10px;
      border-radius: 6px;
      font-size: 12px;
      color: #a1a1aa; /* subtle gray */
      font-family: var(--font-sans);
      cursor: pointer;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      transition: all 0.15s ease;
      user-select: none;
    }

    /* ------------------------------------------------------------------------
       4.5 Inline Plan Component (SaaS Minimal with Step Dropdown Interior)
       ------------------------------------------------------------------------ */
    .as-plan-wrapper {
      display: none !important;
    }

    .as-inline-plan-card {
      align-self: stretch;
      background: transparent !important;
      border: none !important;
      border-radius: 0 !important;
      padding: 8px 2px !important;
      margin: 4px 0 10px 0 !important;
      box-shadow: none !important;
      font-family: var(--font-sans);
      animation: asFadeUp 0.24s cubic-bezier(0.16, 1, 0.3, 1);
      box-sizing: border-box;
    }

    #agentic-sidebar-root:not(.dark) .as-inline-plan-card {
      background: transparent !important;
      border: none !important;
      box-shadow: none !important;
    }

    .as-inline-plan-summary {
      font-size: 12.5px;
      line-height: 1.5;
      color: #a1a1aa;
      margin-bottom: 12px;
      word-break: break-word;
    }

    #agentic-sidebar-root:not(.dark) .as-inline-plan-summary {
      color: #52525b;
    }

    .as-inline-plan-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding-bottom: 8px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    }

    #agentic-sidebar-root:not(.dark) .as-inline-plan-header {
      border-bottom: 1px solid rgba(0, 0, 0, 0.08);
    }

    .as-inline-plan-title {
      font-size: 14px;
      font-weight: 600;
      color: #ffffff;
      letter-spacing: -0.15px;
    }

    #agentic-sidebar-root:not(.dark) .as-inline-plan-title {
      color: #18181b;
    }

    .as-inline-plan-pct {
      font-size: 14px;
      font-weight: 600;
      color: #ffffff;
      font-family: var(--font-sans);
    }

    #agentic-sidebar-root:not(.dark) .as-inline-plan-pct {
      color: #18181b;
    }

    .as-inline-plan-list {
      display: flex;
      flex-direction: column;
    }

    .as-inline-plan-row {
      display: flex;
      flex-direction: column;
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    }

    #agentic-sidebar-root:not(.dark) .as-inline-plan-row {
      border-bottom: 1px solid rgba(0, 0, 0, 0.05);
    }

    .as-inline-plan-row:last-child {
      border-bottom: none;
    }

    .as-inline-plan-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 10px 4px;
      cursor: pointer;
      border-radius: 6px;
      transition: background 0.15s ease;
      user-select: none;
    }

    .as-inline-plan-item:hover {
      background: rgba(255, 255, 255, 0.04);
    }

    #agentic-sidebar-root:not(.dark) .as-inline-plan-item:hover {
      background: rgba(0, 0, 0, 0.03);
    }

    .as-inline-plan-item-left {
      display: flex;
      align-items: center;
      gap: 10px;
      flex: 1;
      min-width: 0;
    }

    /* Status Icons */
    .as-plan-status-icon {
      width: 18px;
      height: 18px;
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      box-sizing: border-box;
    }

    /* Completed: solid green circle with white checkmark */
    .as-plan-status-completed {
      width: 18px;
      height: 18px;
      border-radius: 50%;
      background: #22c55e;
      display: flex;
      align-items: center;
      justify-content: center;
      animation: asCheckPop 0.22s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    }

    .as-plan-status-completed svg {
      width: 11px;
      height: 11px;
      stroke: #ffffff;
      stroke-width: 3;
    }

    /* In Progress: amber/yellow rotating dashed circle */
    .as-plan-status-in-progress {
      width: 17px;
      height: 17px;
      border-radius: 50%;
      border: 2px dashed #facc15;
      animation: asPlanSpin 2s linear infinite;
      box-sizing: border-box;
    }

    /* Pending: subtle dashed circle */
    .as-plan-status-pending {
      width: 17px;
      height: 17px;
      border-radius: 50%;
      border: 1.5px dashed rgba(255, 255, 255, 0.3);
      box-sizing: border-box;
    }

    #agentic-sidebar-root:not(.dark) .as-plan-status-pending {
      border: 1.5px dashed rgba(0, 0, 0, 0.3);
    }

    .as-inline-plan-text {
      font-size: 13px;
      font-weight: 500;
      color: #e4e4e7;
      line-height: 1.35;
      word-break: break-word;
      transition: color 0.15s ease;
    }

    #agentic-sidebar-root:not(.dark) .as-inline-plan-text {
      color: #27272a;
    }

    .as-inline-plan-row.completed .as-inline-plan-text {
      color: #a1a1aa;
    }

    #agentic-sidebar-root:not(.dark) .as-inline-plan-row.completed .as-inline-plan-text {
      color: #71717a;
    }

    .as-inline-plan-chevron {
      display: flex;
      align-items: center;
      justify-content: center;
      color: #71717a;
      transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), color 0.15s ease;
      flex-shrink: 0;
      margin-left: 8px;
    }

    .as-inline-plan-chevron svg {
      width: 13px;
      height: 13px;
    }

    .as-inline-plan-row.open .as-inline-plan-chevron {
      transform: rotate(90deg);
      color: #facc15;
    }

    /* Interior Section (Dropdown details for each step) */
    .as-plan-step-interior {
      display: none;
      margin: 2px 4px 10px 28px;
      padding: 8px 12px;
      border-left: 2px solid rgba(250, 204, 21, 0.45);
      background: rgba(255, 255, 255, 0.03);
      border-radius: 0 6px 6px 0;
      font-size: 11.5px;
      line-height: 1.55;
      color: #a1a1aa;
      animation: asFadeUp 0.18s ease;
    }

    #agentic-sidebar-root:not(.dark) .as-plan-step-interior {
      background: rgba(0, 0, 0, 0.03);
      border-left-color: rgba(202, 138, 4, 0.5);
      color: #52525b;
    }

    .as-plan-step-interior-line {
      display: flex;
      align-items: flex-start;
      gap: 6px;
      margin: 3px 0;
      word-break: break-word;
    }

    .as-plan-step-interior-bullet {
      color: #facc15;
      font-size: 11px;
      line-height: 1.35;
      flex-shrink: 0;
    }

    @keyframes asCheckPop {
      0% { transform: scale(0.6); }
      100% { transform: scale(1); }
    }

    @keyframes asPlanSpin {
      to { transform: rotate(360deg); }
    }

    /* ------------------------------------------------------------------------
       5. Messages & Hero Content Area
       ------------------------------------------------------------------------ */
    .as-content-area {
      flex: 1 1 0px !important;
      min-height: 0px !important;
      overflow-y: auto !important;
      padding: 16px 16px 8px 16px;
      display: flex;
      flex-direction: column;
      box-sizing: border-box;
      gap: 12px;
      scroll-behavior: smooth;
    }

    .as-content-area::-webkit-scrollbar {
      width: 4px;
    }
    .as-content-area::-webkit-scrollbar-thumb {
      background: hsl(var(--border));
      border-radius: 4px;
    }

    /* Hero Welcome View (Voxle Aesthetic) */
    .as-hero-container {
      margin: auto 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      padding: 20px 10px;
      gap: 16px;
    }

    /* 3D Isometric Cube Icon (Voxle inspired) */
    .as-hero-cube {
      width: 58px;
      height: 58px;
      margin-bottom: 2px;
      transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);
    }

    .as-hero-cube:hover {
      transform: scale(1.08) rotate(2deg);
    }

    .as-hero-title {
      font-family: var(--font-serif);
      font-size: 26px;
      font-weight: 500;
      color: hsl(var(--foreground));
      line-height: 1.25;
      letter-spacing: -0.3px;
      margin: 0;
    }

    .as-hero-subtitle {
      font-size: 12px;
      color: hsl(var(--muted-foreground));
      max-width: 280px;
      line-height: 1.45;
      margin: 0;
    }

    /* Suggestion Chips (shadcn secondary button variant) */
    .as-chips-grid {
      display: flex;
      flex-direction: column;
      width: 100%;
      max-width: 320px;
      gap: 6px;
      margin-top: 4px;
    }

    .as-chip-btn {
      all: initial;
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      border-radius: calc(var(--radius) - 2px);
      background: hsl(var(--card));
      border: 1px solid hsl(var(--border));
      color: hsl(var(--muted-foreground));
      font-size: 11.5px;
      font-family: var(--font-sans);
      cursor: pointer;
      text-align: left;
      transition: all 0.15s cubic-bezier(0.16, 1, 0.3, 1);
    }

    .as-chip-btn:hover {
      border-color: hsl(var(--foreground) / 0.3);
      color: hsl(var(--foreground));
      background: hsl(var(--accent));
      transform: translateY(-1px);
    }

    .as-chip-btn:active {
      transform: scale(0.98);
    }

    /* ------------------------------------------------------------------------
       6. Message Bubbles & Agent Execution Cards (shadcn Card style)
       ------------------------------------------------------------------------ */
    .as-bubble-user {
      align-self: flex-end !important;
      max-width: 86% !important;
      padding: 10px 14px !important;
      border-radius: calc(var(--radius) + 2px) !important;
      border-bottom-right-radius: 4px !important;
      background: #18181b !important;
      color: #fafafa !important;
      font-size: 12.5px !important;
      line-height: 1.45 !important;
      font-weight: 450 !important;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1) !important;
      word-break: break-word !important;
      animation: asFadeUp 0.22s cubic-bezier(0.16, 1, 0.3, 1) !important;
    }

    .as-bubble-user,
    .as-bubble-user *,
    .as-bubble-user div,
    .as-bubble-user span,
    .as-bubble-user p {
      color: #ffffff !important;
      -webkit-text-fill-color: #ffffff !important;
    }

    #agentic-sidebar-root.dark .as-bubble-user {
      background: #27272a !important;
      color: #ffffff !important;
      border: 1px solid rgba(255, 255, 255, 0.1) !important;
    }

    #agentic-sidebar-root.dark .as-bubble-user,
    #agentic-sidebar-root.dark .as-bubble-user * {
      color: #ffffff !important;
      -webkit-text-fill-color: #ffffff !important;
    }

    .as-card-step {
      align-self: stretch;
      background: hsl(var(--card));
      border: 1px solid hsl(var(--border));
      border-radius: calc(var(--radius) - 2px);
      padding: 10px 12px;
      display: flex;
      flex-direction: column;
      gap: 6px;
      font-size: 12px;
      line-height: 1.45;
      animation: asFadeUp 0.22s cubic-bezier(0.16, 1, 0.3, 1);
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
    }

    @keyframes asFadeUp {
      from { opacity: 0; transform: translateY(6px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .as-card-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 6px;
    }

    /* shadcn Badge Primitive */
    .as-badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 2px 7px;
      border-radius: 9999px;
      font-size: 10px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }

    .as-badge-plan {
      background: rgba(255, 255, 255, 0.08);
      color: #d4d4d8;
      border: 1px solid rgba(255, 255, 255, 0.12);
    }
    .as-badge-browser {
      background: rgba(250, 204, 21, 0.14);
      color: #facc15;
      border: 1px solid rgba(250, 204, 21, 0.25);
    }
    .as-badge-critique {
      background: rgba(255, 255, 255, 0.08);
      color: #a1a1aa;
      border: 1px solid rgba(255, 255, 255, 0.12);
    }
    .as-badge-done {
      background: rgba(250, 204, 21, 0.14);
      color: #facc15;
      border: 1px solid rgba(250, 204, 21, 0.25);
    }

    .as-card-body {
      color: hsl(var(--foreground));
      white-space: pre-wrap;
      word-break: break-word;
    }

    .as-btn-copy {
      all: initial;
      font-size: 10.5px;
      color: hsl(var(--muted-foreground));
      cursor: pointer;
      font-family: inherit;
      padding: 2px 6px;
      border-radius: 4px;
      transition: all 0.15s ease;
    }

    .as-btn-copy:hover {
      background: hsl(var(--muted));
      color: hsl(var(--foreground));
    }

    /* ------------------------------------------------------------------------
       6.4 Pure shadcn/ui Skeleton Animation (Exact Match to AI Response)
       ------------------------------------------------------------------------ */
    .as-skeleton-container {
      align-self: stretch;
      display: flex;
      flex-direction: column;
      gap: 10px;
      margin-top: 4px;
      margin-bottom: 6px;
      padding: 2px 4px;
      animation: asFadeUp 0.22s cubic-bezier(0.16, 1, 0.3, 1);
      box-sizing: border-box;
      font-family: var(--font-sans);
    }

    /* Top Thought Process Row Placeholder */
    .as-skeleton-thought-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      width: 100%;
      box-sizing: border-box;
      padding: 4px 2px;
    }

    /* Middle Response Lines Placeholder */
    .as-skeleton-lines {
      display: flex;
      flex-direction: column;
      gap: 8px;
      padding: 4px 2px;
    }

    /* Bottom Action Toolbar Placeholder */
    .as-skeleton-toolbar {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 4px 0 0 2px;
    }

    .as-skeleton-tool-btn {
      width: 22px !important;
      height: 22px !important;
      border-radius: 5px !important;
      flex-shrink: 0;
    }

    .as-skeleton-divider {
      width: 1px;
      height: 12px;
      background: rgba(255, 255, 255, 0.12);
      margin: 0 4px;
      flex-shrink: 0;
    }

    #agentic-sidebar-root:not(.dark) .as-skeleton-divider {
      background: rgba(0, 0, 0, 0.12);
    }

    .as-skeleton-tool-pill {
      width: 120px !important;
      height: 22px !important;
      border-radius: 5px !important;
      flex-shrink: 0;
    }

    /* The Core Shadcn Shimmer Bar */
    .as-skeleton-bar {
      background: rgba(255, 255, 255, 0.08);
      border-radius: 4px;
      position: relative;
      overflow: hidden;
      flex-shrink: 0;
    }

    #agentic-sidebar-root:not(.dark) .as-skeleton-bar {
      background: rgba(0, 0, 0, 0.07);
    }

    .as-skeleton-bar::after {
      content: "";
      position: absolute;
      inset: 0;
      transform: translateX(-100%);
      background: linear-gradient(
        90deg,
        transparent 0%,
        rgba(255, 255, 255, 0.07) 25%,
        rgba(255, 255, 255, 0.18) 50%,
        rgba(255, 255, 255, 0.07) 75%,
        transparent 100%
      );
      animation: asShimmerWave 1.6s infinite cubic-bezier(0.4, 0, 0.2, 1);
    }

    #agentic-sidebar-root:not(.dark) .as-skeleton-bar::after {
      background: linear-gradient(
        90deg,
        transparent 0%,
        rgba(0, 0, 0, 0.04) 25%,
        rgba(0, 0, 0, 0.12) 50%,
        rgba(0, 0, 0, 0.04) 75%,
        transparent 100%
      );
    }

    @keyframes asShimmerWave {
      0% {
        transform: translateX(-100%);
      }
      100% {
        transform: translateX(100%);
      }
    }

    .as-skeleton-pill {
      border-radius: 9999px !important;
    }

    /* ------------------------------------------------------------------------
       6.5 AI Response Component with Thought Process (Linear / Perplexity Style)
       ------------------------------------------------------------------------ */
    .as-ai-response-container {
      align-self: stretch;
      display: flex;
      flex-direction: column;
      gap: 8px;
      animation: asFadeUp 0.24s cubic-bezier(0.16, 1, 0.3, 1);
      font-family: var(--font-sans);
      margin-top: 4px;
      margin-bottom: 6px;
    }

    /* 1. Thought Process Collapsible Row */
    .as-thought-wrapper {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .as-thought-bar {
      all: initial;
      display: flex;
      align-items: center;
      justify-content: space-between;
      width: 100%;
      box-sizing: border-box;
      padding: 5px 6px;
      border-radius: 6px;
      cursor: pointer;
      font-family: var(--font-sans);
      transition: background 0.15s ease;
      user-select: none;
    }

    .as-thought-bar:hover {
      background: rgba(255, 255, 255, 0.05);
    }

    #agentic-sidebar-root:not(.dark) .as-thought-bar:hover {
      background: rgba(0, 0, 0, 0.04);
    }

    .as-thought-left {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .as-thought-icon {
      color: #a1a1aa;
      display: inline-flex;
      align-items: center;
    }

    .as-thought-icon svg {
      width: 13px;
      height: 13px;
    }

    .as-thought-label {
      font-size: 11.5px;
      font-weight: 500;
      color: #a1a1aa;
      letter-spacing: -0.1px;
    }

    .as-thought-chevron {
      color: #71717a;
      display: inline-flex;
      align-items: center;
      transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    }

    .as-thought-chevron svg {
      width: 11px;
      height: 11px;
    }

    .as-thought-bar.expanded .as-thought-chevron {
      transform: rotate(90deg);
    }

    .as-thought-right {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .as-sources-badge {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      padding: 2px 7px;
      border-radius: 6px;
      background: rgba(255, 255, 255, 0.06);
      border: 1px solid rgba(255, 255, 255, 0.08);
      font-size: 10.5px;
      color: #a1a1aa;
      font-family: var(--font-sans);
    }

    #agentic-sidebar-root:not(.dark) .as-sources-badge {
      background: rgba(0, 0, 0, 0.04);
      border: 1px solid rgba(0, 0, 0, 0.08);
      color: #71717a;
    }

    .as-sources-icons {
      display: flex;
      align-items: center;
      gap: 2px;
    }

    .as-source-pill {
      width: 6px;
      height: 6px;
      border-radius: 2px;
      background: #facc15;
      opacity: 0.8;
    }

    .as-thought-drawer {
      overflow: hidden;
      margin-left: 6px;
      padding-left: 10px;
      border-left: 1.5px solid rgba(255, 255, 255, 0.12);
    }

    #agentic-sidebar-root:not(.dark) .as-thought-drawer {
      border-left: 1.5px solid rgba(0, 0, 0, 0.12);
    }

    .as-thought-drawer-inner {
      padding: 4px 0 6px 0;
      font-size: 11px;
      line-height: 1.45;
      color: #a1a1aa;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .as-thought-step-line {
      display: flex;
      align-items: flex-start;
      gap: 6px;
    }

    .as-thought-step-bullet {
      color: #facc15;
      font-size: 11px;
      line-height: 1.35;
    }

    /* 2. AI Message Typography */
    .as-ai-message-body {
      font-size: 12.5px;
      line-height: 1.6;
      color: #f4f4f5;
      letter-spacing: -0.1px;
      word-break: break-word;
      padding: 0 4px;
    }

    #agentic-sidebar-root:not(.dark) .as-ai-message-body {
      color: #18181b;
    }

    .as-ai-p {
      margin: 0 0 10px 0;
    }
    .as-ai-p:last-child {
      margin-bottom: 0;
    }

    .as-ai-heading {
      font-size: 13px;
      font-weight: 600;
      color: #ffffff;
      margin-top: 12px;
      margin-bottom: 4px;
      letter-spacing: -0.15px;
    }

    #agentic-sidebar-root:not(.dark) .as-ai-heading {
      color: #09090b;
    }

    .as-ai-bullet {
      display: flex;
      align-items: flex-start;
      gap: 8px;
      margin: 3px 0;
    }

    .as-bullet-dot {
      width: 4px;
      height: 4px;
      border-radius: 50%;
      background: #a1a1aa;
      margin-top: 7px;
      flex-shrink: 0;
    }

    .as-inline-code {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 11.5px;
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.1);
      padding: 1px 5px;
      border-radius: 4px;
      color: #facc15;
    }

    #agentic-sidebar-root:not(.dark) .as-inline-code {
      background: rgba(0, 0, 0, 0.05);
      border: 1px solid rgba(0, 0, 0, 0.08);
      color: #b45309;
    }

    .as-code-block {
      background: #09090b;
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 6px;
      padding: 8px 10px;
      overflow-x: auto;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 11.5px;
      line-height: 1.45;
      color: #f4f4f5;
      margin: 8px 0;
    }

    /* 3. Bottom Action Toolbar */
    .as-ai-toolbar {
      display: flex;
      align-items: center;
      gap: 3px;
      padding: 4px 0 0 2px;
      user-select: none;
    }

    .as-ai-tool-btn {
      all: initial;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 26px;
      height: 26px;
      border-radius: 5px;
      color: #71717a;
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .as-ai-tool-btn:hover {
      color: #ffffff;
      background: rgba(255, 255, 255, 0.08);
    }

    #agentic-sidebar-root:not(.dark) .as-ai-tool-btn:hover {
      color: #18181b;
      background: rgba(0, 0, 0, 0.06);
    }

    .as-ai-tool-btn.copied {
      color: #facc15 !important;
    }

    .as-ai-tool-divider {
      width: 1px;
      height: 12px;
      background: rgba(255, 255, 255, 0.12);
      margin: 0 4px;
    }

    #agentic-sidebar-root:not(.dark) .as-ai-tool-divider {
      background: rgba(0, 0, 0, 0.12);
    }

    .as-ai-tool-text-btn {
      all: initial;
      display: inline-flex;
      align-items: center;
      gap: 5px;
      padding: 4px 8px;
      border-radius: 5px;
      color: #71717a;
      font-size: 11px;
      font-family: var(--font-sans);
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .as-ai-tool-text-btn:hover {
      color: #ffffff;
      background: rgba(255, 255, 255, 0.06);
    }

    #agentic-sidebar-root:not(.dark) .as-ai-tool-text-btn:hover {
      color: #18181b;
      background: rgba(0, 0, 0, 0.04);
    }

    /* ------------------------------------------------------------------------
       7. Floating Responsive Input Card (Exact Voxle 4.0 Style with Uploads)
       ------------------------------------------------------------------------ */
    .as-input-footer {
      flex-shrink: 0;
      padding: 0 14px 14px 14px;
      box-sizing: border-box;
      position: relative;
      z-index: 20;
    }

    /* Voxle 4.0 Rounded Input Card (initial height ~88px - 94px) */
    .as-voxle-card {
      display: flex !important;
      flex-direction: column !important;
      border-radius: 20px !important;
      background: #18181b !important;
      color: #fafafa !important;
      box-shadow: 0 6px 24px -2px rgba(0, 0, 0, 0.25) !important;
      border: 1px solid rgba(255, 255, 255, 0.12) !important;
      padding: 10px 12px 10px 12px !important;
      transition: border-color 0.2s ease, box-shadow 0.2s ease, background 0.2s ease !important;
      box-sizing: border-box !important;
      width: 100% !important;
      min-height: 88px !important;
    }

    #agentic-sidebar-root.dark .as-voxle-card {
      background: #18181b !important;
      border-color: rgba(255, 255, 255, 0.15) !important;
    }

    .as-voxle-card:focus-within {
      box-shadow: 0 8px 30px -4px rgba(0, 0, 0, 0.35) !important;
      border-color: rgba(255, 255, 255, 0.28) !important;
    }

    .as-voxle-card.drag-over {
      border-color: #facc15 !important;
      background: #27272a !important;
    }

    /* Attachment Preview Strip */
    .as-attachment-list {
      display: flex !important;
      flex-wrap: wrap !important;
      gap: 6px !important;
      margin-bottom: 8px !important;
      padding-bottom: 6px !important;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08) !important;
    }

    .as-attachment-pill {
      display: inline-flex !important;
      align-items: center !important;
      gap: 6px !important;
      padding: 3px 8px !important;
      background: rgba(255, 255, 255, 0.09) !important;
      border: 1px solid rgba(255, 255, 255, 0.14) !important;
      border-radius: 9999px !important;
      font-size: 11px !important;
      color: #fafafa !important;
      max-width: 180px !important;
      box-sizing: border-box !important;
      user-select: none !important;
    }

    .as-attachment-thumb {
      width: 18px !important;
      height: 18px !important;
      border-radius: 4px !important;
      object-fit: cover !important;
    }

    .as-attachment-name {
      overflow: hidden !important;
      text-overflow: ellipsis !important;
      white-space: nowrap !important;
      font-size: 11px !important;
      max-width: 110px !important;
    }

    .as-attachment-remove {
      all: initial !important;
      cursor: pointer !important;
      color: #a1a1aa !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      width: 14px !important;
      height: 14px !important;
      border-radius: 50% !important;
      transition: all 0.15s ease !important;
    }

    .as-attachment-remove:hover {
      color: #ef4444 !important;
      background: rgba(239, 68, 68, 0.15) !important;
    }

    /* Spacious Textarea with initial height */
    .as-voxle-textarea {
      display: block !important;
      width: 100% !important;
      min-width: 0 !important;
      min-height: 40px !important;
      max-height: 140px !important;
      margin: 0 !important;
      padding: 2px 0 !important;
      border: none !important;
      background: transparent !important;
      color: #fafafa !important;
      font-family: var(--font-sans) !important;
      font-size: 13.5px !important;
      line-height: 1.45 !important;
      outline: none !important;
      resize: none !important;
      box-sizing: border-box !important;
      white-space: pre-wrap !important;
      word-break: break-word !important;
      overflow-wrap: break-word !important;
      overflow-x: hidden !important;
      overflow-y: auto !important;
      scrollbar-width: none !important;
    }

    .as-voxle-textarea::-webkit-scrollbar {
      display: none !important;
      width: 0 !important;
      height: 0 !important;
    }

    .as-voxle-textarea::placeholder {
      color: #71717a !important;
    }

    /* Bottom Action Toolbar inside the card */
    .as-voxle-toolbar {
      display: flex !important;
      align-items: center !important;
      justify-content: space-between !important;
      margin-top: 6px !important;
      padding-top: 4px !important;
    }

    .as-voxle-tools-left,
    .as-voxle-tools-right {
      display: flex !important;
      align-items: center !important;
      gap: 6px !important;
    }

    .as-voxle-tool-btn {
      all: initial !important;
      width: 28px !important;
      height: 28px !important;
      border-radius: 50% !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      cursor: pointer !important;
      color: #a1a1aa !important;
      background: transparent !important;
      transition: all 0.15s ease !important;
    }

    .as-voxle-tool-btn:hover {
      color: #ffffff !important;
      background: rgba(255, 255, 255, 0.12) !important;
      transform: scale(1.05) !important;
    }

    .as-voxle-tool-btn:active {
      transform: scale(0.92) !important;
    }

    /* ------------------------------------------------------------------------
       shadcn/ui Select Component (Bottom Chat Toolbar)
       ------------------------------------------------------------------------ */
    .as-shadcn-select {
      position: relative !important;
      display: inline-flex !important;
      align-items: center !important;
    }

    .as-shadcn-select-trigger {
      all: initial !important;
      display: inline-flex !important;
      align-items: center !important;
      gap: 5px !important;
      padding: 4px 8px !important;
      border-radius: 6px !important;
      background: transparent !important;
      color: #a1a1aa !important;
      font-size: 12px !important;
      font-weight: 450 !important;
      font-family: var(--font-sans) !important;
      cursor: pointer !important;
      border: 1px solid transparent !important;
      transition: all 0.15s cubic-bezier(0.16, 1, 0.3, 1) !important;
      user-select: none !important;
      white-space: nowrap !important;
    }

    .as-shadcn-select-trigger:hover {
      color: #000000 !important;
      background: #facc15 !important;
      border-color: #eab308 !important;
    }

    .as-shadcn-select.open .as-shadcn-select-trigger {
      color: #000000 !important;
      background: #facc15 !important;
      border-color: #eab308 !important;
    }

    .as-select-chevron {
      display: inline-flex !important;
      align-items: center !important;
      color: #71717a !important;
      transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), color 0.15s ease !important;
    }

    .as-shadcn-select-trigger:hover .as-select-chevron,
    .as-shadcn-select.open .as-select-chevron {
      color: #000000 !important;
    }

    .as-shadcn-select.open .as-select-chevron {
      transform: rotate(180deg) !important;
    }

    /* shadcn Popover Content (Opens upwards) */
    .as-shadcn-select-popover {
      position: absolute !important;
      bottom: calc(100% + 8px) !important;
      left: 0 !important;
      min-width: 230px !important;
      max-width: 280px !important;
      background: #18181b !important;
      border: 1px solid rgba(255, 255, 255, 0.14) !important;
      border-radius: 10px !important;
      box-shadow: 0 16px 40px -6px rgba(0, 0, 0, 0.7), 0 6px 16px rgba(0, 0, 0, 0.5) !important;
      padding: 5px !important;
      display: none !important;
      flex-direction: column !important;
      gap: 2px !important;
      z-index: 100 !important;
      box-sizing: border-box !important;
      backdrop-filter: blur(12px) !important;
      animation: asSelectIn 0.16s cubic-bezier(0.16, 1, 0.3, 1) !important;
    }

    .as-shadcn-select.open .as-shadcn-select-popover {
      display: flex !important;
    }

    @keyframes asSelectIn {
      from {
        opacity: 0;
        transform: translateY(6px) scale(0.97);
      }
      to {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }

    .as-select-label {
      font-size: 10px !important;
      font-weight: 600 !important;
      text-transform: uppercase !important;
      letter-spacing: 0.5px !important;
      color: #71717a !important;
      padding: 6px 8px 4px 8px !important;
      user-select: none !important;
    }

    .as-select-item {
      display: flex !important;
      align-items: center !important;
      justify-content: space-between !important;
      padding: 6px 8px !important;
      border-radius: 6px !important;
      cursor: pointer !important;
      color: #d4d4d8 !important;
      transition: all 0.12s ease !important;
      user-select: none !important;
      gap: 8px !important;
    }

    .as-select-item:hover {
      background: #facc15 !important;
      color: #000000 !important;
    }

    .as-select-item.selected {
      background: rgba(255, 255, 255, 0.12) !important;
      color: #ffffff !important;
      font-weight: 500 !important;
    }

    .as-select-item.selected:hover {
      background: #facc15 !important;
      color: #000000 !important;
    }

    .as-select-item-info {
      display: flex !important;
      flex-direction: column !important;
      gap: 1px !important;
    }

    .as-select-item-title {
      font-size: 12px !important;
      line-height: 1.3 !important;
      color: inherit !important;
    }

    .as-select-item:hover .as-select-item-title,
    .as-select-item.selected:hover .as-select-item-title {
      color: #000000 !important;
      font-weight: 600 !important;
    }

    .as-select-item-sub {
      font-size: 10px !important;
      color: #71717a !important;
      line-height: 1.2 !important;
    }

    .as-select-item:hover .as-select-item-sub,
    .as-select-item.selected:hover .as-select-item-sub {
      color: rgba(0, 0, 0, 0.75) !important;
    }

    .as-select-item.selected .as-select-item-sub {
      color: #a1a1aa !important;
    }

    .as-select-check {
      display: none !important;
      align-items: center !important;
      justify-content: center !important;
      color: #facc15 !important;
      flex-shrink: 0 !important;
    }

    .as-select-item.selected .as-select-check {
      display: flex !important;
    }

    .as-select-item:hover .as-select-check,
    .as-select-item.selected:hover .as-select-check {
      color: #000000 !important;
    }

    /* SaaS Minimalist Status Badge (Subtle gray text & gray border, slightly rounded, no glow) */
    .as-nim-status-pill {
      all: initial !important;
      display: inline-flex !important;
      align-items: center !important;
      gap: 4px !important;
      padding: 3px 7px !important;
      border-radius: 4px !important;
      border: 1px solid rgba(255, 255, 255, 0.16) !important;
      background: rgba(255, 255, 255, 0.04) !important;
      color: #a1a1aa !important;
      font-size: 11px !important;
      font-weight: 500 !important;
      font-family: var(--font-sans) !important;
      white-space: nowrap !important;
      user-select: none !important;
      box-shadow: none !important;
      transition: border-color 0.15s ease, color 0.15s ease !important;
    }

    .as-nim-status-pill.inactive {
      border-color: rgba(255, 255, 255, 0.08) !important;
      color: #71717a !important;
      background: transparent !important;
    }

    /* ------------------------------------------------------------------------
       shadcn/ui DropdownMenu (Upload Options Popover)
       ------------------------------------------------------------------------ */
    .as-shadcn-dropdown {
      position: relative !important;
      display: inline-flex !important;
      align-items: center !important;
    }

    .as-upload-trigger-btn {
      all: initial !important;
      width: 28px !important;
      height: 28px !important;
      border-radius: 50% !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      cursor: pointer !important;
      color: #a1a1aa !important;
      background: transparent !important;
      transition: all 0.18s cubic-bezier(0.16, 1, 0.3, 1) !important;
      border: 1px solid transparent !important;
    }

    .as-upload-trigger-btn:hover {
      color: #000000 !important;
      background: #facc15 !important;
      transform: scale(1.05) !important;
    }

    .as-shadcn-dropdown.open .as-upload-trigger-btn {
      color: #000000 !important;
      background: #facc15 !important;
      transform: rotate(45deg) !important;
    }

    .as-shadcn-dropdown-content {
      position: absolute !important;
      bottom: calc(100% + 8px) !important;
      left: 0 !important;
      min-width: 235px !important;
      max-width: 290px !important;
      background: #18181b !important;
      border: 1px solid rgba(255, 255, 255, 0.14) !important;
      border-radius: 10px !important;
      box-shadow: 0 16px 40px -6px rgba(0, 0, 0, 0.7), 0 6px 16px rgba(0, 0, 0, 0.5) !important;
      padding: 5px !important;
      display: none !important;
      flex-direction: column !important;
      gap: 2px !important;
      z-index: 100 !important;
      box-sizing: border-box !important;
      backdrop-filter: blur(12px) !important;
      animation: asSelectIn 0.16s cubic-bezier(0.16, 1, 0.3, 1) !important;
    }

    .as-shadcn-dropdown.open .as-shadcn-dropdown-content {
      display: flex !important;
    }

    .as-dropdown-header {
      font-size: 10px !important;
      font-weight: 600 !important;
      text-transform: uppercase !important;
      letter-spacing: 0.5px !important;
      color: #71717a !important;
      padding: 6px 8px 4px 8px !important;
      user-select: none !important;
    }

    .as-dropdown-item {
      display: flex !important;
      align-items: center !important;
      gap: 10px !important;
      padding: 7px 8px !important;
      border-radius: 6px !important;
      cursor: pointer !important;
      color: #d4d4d8 !important;
      transition: all 0.12s ease !important;
      user-select: none !important;
    }

    .as-dropdown-item:hover {
      background: #facc15 !important;
      color: #000000 !important;
    }

    .as-dropdown-item-icon {
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      color: #a1a1aa !important;
      width: 18px !important;
      flex-shrink: 0 !important;
      transition: color 0.12s ease !important;
    }

    .as-dropdown-item:hover .as-dropdown-item-icon {
      color: #000000 !important;
    }

    .as-dropdown-item-info {
      display: flex !important;
      flex-direction: column !important;
      gap: 1px !important;
    }

    .as-dropdown-item-title {
      font-size: 12px !important;
      line-height: 1.3 !important;
      color: inherit !important;
      font-weight: 500 !important;
    }

    .as-dropdown-item:hover .as-dropdown-item-title {
      color: #000000 !important;
      font-weight: 600 !important;
    }

    .as-dropdown-item-sub {
      font-size: 10px !important;
      color: #71717a !important;
      line-height: 1.2 !important;
    }

    .as-dropdown-item:hover .as-dropdown-item-sub {
      color: rgba(0, 0, 0, 0.75) !important;
    }

    .as-dropdown-separator {
      height: 1px !important;
      background: rgba(255, 255, 255, 0.08) !important;
      margin: 3px 0 !important;
    }

    /* SaaS Minimalist Yellow Send Button (Strictly No Glow) */
    .as-voxle-send-btn {
      all: initial !important;
      width: 28px !important;
      height: 28px !important;
      border-radius: 6px !important;
      background: #facc15 !important;
      color: #18181b !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      cursor: pointer !important;
      transition: background 0.15s ease, opacity 0.12s ease, transform 0.1s ease !important;
      box-shadow: none !important;
      flex-shrink: 0 !important;
    }

    .as-voxle-send-btn:hover {
      background: #eab308 !important;
      box-shadow: none !important;
    }

    .as-voxle-send-btn:active {
      transform: scale(0.95) !important;
      box-shadow: none !important;
    }

    .as-input-hint {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 10px;
      color: hsl(var(--muted-foreground));
      padding: 6px 6px 0 6px;
    }
  `;

  // --------------------------------------------------------------------------
  // 2. Crisp Lucide Vector Icons
  // --------------------------------------------------------------------------
  const ICONS = {
    menu: `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></svg>`,
    plus: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>`,
    clipboard: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/></svg>`,
    camera: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>`,
    image: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>`,
    mic: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/></svg>`,
    close: `<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>`,
    chevronDown: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>`,
    chevronUp: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m18 15-6-6-6 6"/></svg>`,
    check: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`,
    arrowUp: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12 7-7 7 7"/><path d="M12 19V5"/></svg>`,
    arrowRight: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>`,
    alertTriangle: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
    panelClose: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M15 3v18"/><path d="m8 9 3 3-3 3"/></svg>`,
    panelOpen: `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M15 3v18"/><path d="m10 15-3-3 3-3"/></svg>`,
    moon: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>`,
    sun: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>`,
    trash: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>`,
    bot: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/></svg>`,
    sparkles: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>`,
    messageSquare: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`,
    folder: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 8 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/></svg>`,
    fileText: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/></svg>`,
    search: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>`,
    lightbulb: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/></svg>`,
    chevronRight: `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>`,
    copy: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>`,
    thumbsDown: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 14V2"/><path d="M9 18.12 10 14H4.17a2 2 0 0 1-1.92-2.56l2.33-8A2 2 0 0 1 6.5 2H20a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.76a2 2 0 0 0-1.79 1.11L12 22h-1.5a1.5 1.5 0 0 1-1.5-1.5c0-.88.4-1.68 1-2.38z"/></svg>`,
    rotateCw: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/></svg>`,
    sliders: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="4" x2="4" y1="21" y2="14"/><line x1="4" x2="4" y1="10" y2="3"/><line x1="12" x2="12" y1="21" y2="12"/><line x1="12" x2="12" y1="8" y2="3"/><line x1="20" x2="20" y1="21" y2="16"/><line x1="20" x2="20" y1="12" y2="3"/><line x1="1" x2="7" y1="14" y2="14"/><line x1="9" x2="15" y1="8" y2="8"/><line x1="17" x2="23" y1="16" y2="16"/></svg>`,
  };

  // 3D Isometric Cube SVG Logo (Exact Voxle Aesthetic)
  const VOXLE_CUBE_SVG = `
    <svg class="as-hero-cube" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M32 4L58 19V45L32 60L6 45V19L32 4Z" fill="#FACC15" fill-opacity="0.2"/>
      <!-- Top Face -->
      <polygon points="32,4 58,19 32,34 6,19" fill="#FACC15" stroke="#CA8A04" stroke-width="1.5" stroke-linejoin="round"/>
      <!-- Left Face -->
      <polygon points="6,19 32,34 32,60 6,45" fill="#EAB308" stroke="#CA8A04" stroke-width="1.5" stroke-linejoin="round"/>
      <!-- Right Face -->
      <polygon points="58,19 32,34 32,60 58,45" fill="#CA8A04" stroke="#A16207" stroke-width="1.5" stroke-linejoin="round"/>
      <!-- Letter Inscriptions -->
      <text x="32" y="22" font-size="10" font-weight="800" font-family="sans-serif" fill="#713F12" text-anchor="middle">VOX</text>
      <text x="19" y="44" font-size="9" font-weight="800" font-family="sans-serif" fill="#854D0E" text-anchor="middle">AI</text>
      <text x="45" y="44" font-size="9" font-weight="800" font-family="sans-serif" fill="#FEF08A" text-anchor="middle">4.0</text>
    </svg>
  `;

  // --------------------------------------------------------------------------
  // 3. Render Thin Rail Dock (46px)
  // --------------------------------------------------------------------------
  const rail = document.createElement("div");
  rail.id = "agentic-rail-root";
  rail.style.display = "none";
  rail.innerHTML = `
    <!-- Top Open Navbar Button -->
    <div class="as-rail-item">
      <button class="as-rail-top-btn" id="as-rail-expand" aria-label="Expand Sidebar">
        ${ICONS.panelOpen}
      </button>
      <div class="as-rail-tooltip">Expand (Ctrl+B)</div>
    </div>

    <!-- Active Indicator -->
    <div class="as-rail-item">
      <div class="as-rail-btn" title="Agent Status">
        ${ICONS.bot}
        <div class="as-rail-pulse"></div>
      </div>
      <div class="as-rail-tooltip">Tri-Agent Ready</div>
    </div>

    <!-- New Chat Trigger -->
    <div class="as-rail-item">
      <button class="as-rail-btn" id="as-rail-new" aria-label="New Prompt">
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
  `;
  container.appendChild(rail);

  // --------------------------------------------------------------------------
  // 4. Render Full Expanded Sidebar (shadcn + Voxle Modern Layout)
  // --------------------------------------------------------------------------
  const sidebar = document.createElement("div");
  sidebar.id = "agentic-sidebar-root";
  sidebar.innerHTML = `
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

    <!-- Header Navbar -->
    <div class="as-header">
      <div class="as-header-left">
        <button class="as-icon-btn" id="as-btn-drawer" title="Open Navigation Menu">
          ${ICONS.menu}
        </button>
        <div class="as-header-brand">
          <span class="as-header-title">Agentic Browser</span>
        </div>
      </div>

      <div class="as-header-right">
        <button class="as-icon-btn" id="as-btn-theme" title="Toggle Theme">${ICONS.moon}</button>
        <button class="as-icon-btn" id="as-btn-clear" title="Clear Chat">${ICONS.trash}</button>
        <button class="as-icon-btn" id="as-btn-collapse" title="Collapse Sidebar (Ctrl+B)">${ICONS.panelClose}</button>
      </div>
    </div>

    <!-- Subtle Status Bar -->
    <div class="as-status-bar">
      <div class="as-status-text">
        <span class="as-spinner" id="as-status-spinner" style="display: none;"></span>
        <span id="as-status-label">Ready. Type a prompt below to automate.</span>
      </div>
      <span>Tri-Agent</span>
    </div>

    <!-- Plan Wrapper (Hidden - Plan rendered inline in feed) -->
    <div class="as-plan-wrapper" id="as-plan-wrapper" style="display: none !important;"></div>

    <!-- Feed / Content Area -->
    <div class="as-content-area" id="as-content-area">
      <!-- Hero Welcome View (Voxle Aesthetic) -->
      <div class="as-hero-container" id="as-hero-view">
        ${VOXLE_CUBE_SVG}
        <h2 class="as-hero-title">How can I help you today?</h2>
        <p class="as-hero-subtitle">Autonomously browse web pages, research topics, fill forms, and run workflows.</p>

        <div class="as-chips-grid">
          <button class="as-chip-btn" data-prompt="Search Google for latest RTX 4050 laptops and compare prices">
            ${ICONS.search}
            <span>Search Google for RTX 4050 laptops</span>
          </button>
          <button class="as-chip-btn" data-prompt="Open https://news.ycombinator.com and extract top 3 stories">
            ${ICONS.fileText}
            <span>Extract top 3 Hacker News stories</span>
          </button>
          <button class="as-chip-btn" data-prompt="Go to wikipedia.org and research Node.js history">
            ${ICONS.sparkles}
            <span>Research Node.js history on Wikipedia</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Floating Responsive Input Card (Exact Voxle 4.0 Style with File & Image Uploads) -->
    <div class="as-input-footer">
      <input type="file" id="as-file-input" multiple accept="image/*,.pdf,.txt,.doc,.docx,.csv,.json" style="display: none;" />

      <div class="as-voxle-card" id="as-voxle-card">
        <!-- Attachment Chips Container -->
        <div class="as-attachment-list" id="as-attachment-list" style="display: none;"></div>

        <!-- Spacious Textarea Area (initial height ~40px) -->
        <textarea
          class="as-voxle-textarea"
          id="as-textarea"
          placeholder="Chat with Agent..."
          rows="2"
        ></textarea>

        <!-- Bottom Action Toolbar inside the card -->
        <div class="as-voxle-toolbar">
          <div class="as-voxle-tools-left">
            <!-- shadcn/ui DropdownMenu for Attachments & Uploads (+) -->
            <div class="as-shadcn-dropdown" id="as-upload-dropdown">
              <button class="as-upload-trigger-btn" id="as-btn-upload-trigger" type="button" aria-haspopup="menu" aria-expanded="false" title="Attach files, images &amp; context">
                ${ICONS.plus}
              </button>

              <div class="as-shadcn-dropdown-content" id="as-upload-dropdown-content" role="menu">
                <div class="as-dropdown-header">Add attachments</div>
                <div class="as-dropdown-item" id="as-item-upload-doc" role="menuitem">
                  <span class="as-dropdown-item-icon">${ICONS.fileText}</span>
                  <div class="as-dropdown-item-info">
                    <span class="as-dropdown-item-title">Upload Documents</span>
                    <span class="as-dropdown-item-sub">PDF, TXT, DOCX, CSV, JSON, Code</span>
                  </div>
                </div>
                <div class="as-dropdown-item" id="as-item-upload-img" role="menuitem">
                  <span class="as-dropdown-item-icon">${ICONS.image}</span>
                  <div class="as-dropdown-item-info">
                    <span class="as-dropdown-item-title">Upload Photos &amp; Images</span>
                    <span class="as-dropdown-item-sub">PNG, JPG, WebP screenshots</span>
                  </div>
                </div>
                <div class="as-dropdown-separator"></div>
                <div class="as-dropdown-item" id="as-item-paste-clip" role="menuitem">
                  <span class="as-dropdown-item-icon">${ICONS.clipboard}</span>
                  <div class="as-dropdown-item-info">
                    <span class="as-dropdown-item-title">Paste from Clipboard</span>
                    <span class="as-dropdown-item-sub">Attach copied text, links, or image</span>
                  </div>
                </div>
                <div class="as-dropdown-item" id="as-item-page-snap" role="menuitem">
                  <span class="as-dropdown-item-icon">${ICONS.camera}</span>
                  <div class="as-dropdown-item-info">
                    <span class="as-dropdown-item-title">Current Tab Context</span>
                    <span class="as-dropdown-item-sub">Attach page title &amp; URL info</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- shadcn/ui Select Component for Model Selection -->
            <div class="as-shadcn-select" id="as-model-select">
              <button class="as-shadcn-select-trigger" id="as-model-select-trigger" type="button" aria-haspopup="listbox" aria-expanded="false" title="Switch AI Model">
                <span id="as-selected-model-name">Nemotron 550B</span>
                <span class="as-select-chevron">${ICONS.chevronUp}</span>
              </button>

              <div class="as-shadcn-select-popover" id="as-model-select-popover" role="listbox">
                <div class="as-select-label">Reasoning &amp; Planning Models</div>
                <div class="as-select-item selected" data-model="nvidia/nemotron-3-ultra-550b-a55b" data-name="Nemotron 550B" role="option" aria-selected="true">
                  <div class="as-select-item-info">
                    <span class="as-select-item-title">Nemotron 550B</span>
                    <span class="as-select-item-sub">NVIDIA Ultra Reasoning</span>
                  </div>
                  <span class="as-select-check">${ICONS.check}</span>
                </div>
                <div class="as-select-item" data-model="nvidia/nemotron-4-340b-instruct" data-name="Nemotron 340B" role="option" aria-selected="false">
                  <div class="as-select-item-info">
                    <span class="as-select-item-title">Nemotron 340B</span>
                    <span class="as-select-item-sub">Fast Agentic NIM</span>
                  </div>
                  <span class="as-select-check">${ICONS.check}</span>
                </div>
                <div class="as-select-item" data-model="meta/llama-3.3-70b-instruct" data-name="Llama 3.3 70B" role="option" aria-selected="false">
                  <div class="as-select-item-info">
                    <span class="as-select-item-title">Llama 3.3 70B</span>
                    <span class="as-select-item-sub">Meta Frontier Intelligence</span>
                  </div>
                  <span class="as-select-check">${ICONS.check}</span>
                </div>
                <div class="as-select-item" data-model="mistralai/mistral-large-2-instruct" data-name="Mistral Large 2" role="option" aria-selected="false">
                  <div class="as-select-item-info">
                    <span class="as-select-item-title">Mistral Large 2</span>
                    <span class="as-select-item-sub">123B Parameter Frontier</span>
                  </div>
                  <span class="as-select-check">${ICONS.check}</span>
                </div>
                <div class="as-select-item" data-model="deepseek-ai/deepseek-r1" data-name="DeepSeek R1" role="option" aria-selected="false">
                  <div class="as-select-item-info">
                    <span class="as-select-item-title">DeepSeek R1</span>
                    <span class="as-select-item-sub">Open-R1 High Accuracy</span>
                  </div>
                  <span class="as-select-check">${ICONS.check}</span>
                </div>
                <div class="as-select-item" data-model="deepseek-ai/deepseek-v4.1-flash" data-name="DeepSeek V4.1 Flash" role="option" aria-selected="false">
                  <div class="as-select-item-info">
                    <span class="as-select-item-title">DeepSeek V4.1 Flash</span>
                    <span class="as-select-item-sub">Ultra Fast High-Throughput Reasoning</span>
                  </div>
                  <span class="as-select-check">${ICONS.check}</span>
                </div>
              </div>
            </div>

            <!-- Accurate NIM Active Status Pill with Gray Border & Text (No Colors, Slightly Rounded) -->
            <div class="as-nim-status-pill" id="as-nim-status" title="NVIDIA NIM Active">
              <span id="as-nim-status-text">NIM Active</span>
            </div>
          </div>

          <div class="as-voxle-tools-right">
            <button class="as-voxle-tool-btn" id="as-btn-mic" title="Voice / Audio action">
              ${ICONS.mic}
            </button>
            <button class="as-voxle-send-btn" id="as-btn-send" title="Send message (Enter)">
              ${ICONS.arrowRight}
            </button>
          </div>
        </div>
      </div>

      <div class="as-input-hint">
        <span>Enter to run • Shift+Enter for newline</span>
        <span>Ctrl+B to collapse</span>
      </div>
    </div>
  `;
  container.appendChild(sidebar);

  // --------------------------------------------------------------------------
  // 5. Modular Controller & Event Bindings
  // --------------------------------------------------------------------------
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
  const clearBtn = sidebar.querySelector("#as-btn-clear");
  const railClearBtn = rail.querySelector("#as-rail-clear");

  // Single Hovering Plan Card Elements & State
  const planWrapper = sidebar.querySelector("#as-plan-wrapper");
  let planItems = [];
  let currentInlinePlanCard = null;

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
  const sheetHistoryList = sidebar.querySelector("#as-sheet-history-list");

  // Mount elements to DOM safely
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

  // Toggle Sheet (Drawer)
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

  // Toggle Collapse (Thin Rail vs Expanded)
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

  // Toggle Theme (Light / Dark)
  function toggleTheme() {
    const isDark = sidebar.classList.toggle("dark");
    rail.classList.toggle("dark", isDark);
    const icon = isDark ? ICONS.sun : ICONS.moon;
    themeBtn.innerHTML = icon;
    railThemeBtn.innerHTML = icon;
  }

  themeBtn.addEventListener("click", toggleTheme);
  railThemeBtn.addEventListener("click", toggleTheme);

  // Clear Chat History
  function clearChat() {
    hideSkeleton();
    const cards = contentEl.querySelectorAll(".as-bubble-user, .as-card-step, .as-ai-response-container, .as-inline-plan-card, .as-skeleton-container");
    cards.forEach((c) => c.remove());
    if (heroView) heroView.style.display = "flex";
    statusLabel.textContent = "Ready. Type a prompt below to automate.";
    statusSpinner.style.display = "none";
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

  // File Input Change Handler
  fileInput.addEventListener("change", (e) => {
    if (e.target.files) handleFiles(e.target.files);
    fileInput.value = "";
  });

  // Drag & Drop on the input card
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
      ? `<img class="as-attachment-thumb" src="${fileObj.dataUrl}" alt="" />`
      : `<span style="display:flex;align-items:center;color:#a1a1aa;">${ICONS.fileText}</span>`;

    pill.innerHTML = `
      ${thumbHtml}
      <span class="as-attachment-name" title="${escapeHtml(fileObj.name)}">${escapeHtml(fileObj.name)}</span>
      <button class="as-attachment-remove" title="Remove attachment">${ICONS.close}</button>
    `;

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
  const modelItems = sidebar.querySelectorAll(".as-select-item");

  if (uploadTriggerBtn && uploadDropdownEl) {
    uploadTriggerBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      if (modelSelectEl) modelSelectEl.classList.remove("open");
      const isOpen = uploadDropdownEl.classList.toggle("open");
      uploadTriggerBtn.setAttribute("aria-expanded", String(isOpen));
    });

    itemUploadDoc?.addEventListener("click", (e) => {
      e.stopPropagation();
      uploadDropdownEl.classList.remove("open");
      uploadTriggerBtn.setAttribute("aria-expanded", "false");
      fileInput.accept = ".pdf,.txt,.doc,.docx,.csv,.json,.md,.js,.py,.html";
      fileInput.click();
    });

    itemUploadImg?.addEventListener("click", (e) => {
      e.stopPropagation();
      uploadDropdownEl.classList.remove("open");
      uploadTriggerBtn.setAttribute("aria-expanded", "false");
      fileInput.accept = "image/*";
      fileInput.click();
    });

    itemPasteClip?.addEventListener("click", async (e) => {
      e.stopPropagation();
      uploadDropdownEl.classList.remove("open");
      uploadTriggerBtn.setAttribute("aria-expanded", "false");
      try {
        if (navigator.clipboard?.readText) {
          const text = await navigator.clipboard.readText();
          if (text) {
            const clipFile = {
              name: `clipboard-snippet-${Date.now().toString().slice(-4)}.txt`,
              size: text.length,
              type: "text/plain",
              isImage: false,
              dataUrl: null,
            };
            attachedFiles.push(clipFile);
            renderAttachmentPill(clipFile);
            setStatus("idle", "Attached snippet from clipboard");
          } else {
            setStatus("idle", "Clipboard is empty");
          }
        }
      } catch (err) {
        setStatus("idle", "Clipboard access unavailable");
      }
    });

    itemPageSnap?.addEventListener("click", (e) => {
      e.stopPropagation();
      uploadDropdownEl.classList.remove("open");
      uploadTriggerBtn.setAttribute("aria-expanded", "false");
      const pageFile = {
        name: `tab-context (${(document.title || "webpage").slice(0, 20)}).txt`,
        size: window.location.href.length,
        type: "text/plain",
        isImage: false,
        dataUrl: null,
      };
      attachedFiles.push(pageFile);
      renderAttachmentPill(pageFile);
      setStatus("idle", `Attached current page context: ${(document.title || "Page").slice(0, 25)}`);
    });
  }

  if (modelTriggerEl && modelSelectEl) {
    modelTriggerEl.addEventListener("click", (e) => {
      e.stopPropagation();
      if (uploadDropdownEl) uploadDropdownEl.classList.remove("open");
      const isOpen = modelSelectEl.classList.toggle("open");
      modelTriggerEl.setAttribute("aria-expanded", String(isOpen));
    });

    modelItems.forEach((item) => {
      item.addEventListener("click", (e) => {
        e.stopPropagation();
        const modelId = item.getAttribute("data-model");
        const modelName = item.getAttribute("data-name");

        modelItems.forEach((i) => {
          i.classList.remove("selected");
          i.setAttribute("aria-selected", "false");
        });
        item.classList.add("selected");
        item.setAttribute("aria-selected", "true");

        if (modelNameEl) modelNameEl.textContent = modelName;
        modelSelectEl.classList.remove("open");
        modelTriggerEl.setAttribute("aria-expanded", "false");

        window.agenticSelectedModel = modelId;
        const nimStatusText = sidebar.querySelector("#as-nim-status-text");
        if (nimStatusText) nimStatusText.textContent = `${modelName}`;
        setStatus("idle", `Switched model to ${modelName}`);
      });
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

  // Prompt Chips Handler
  sidebar.querySelectorAll(".as-chip-btn").forEach((chip) => {
    chip.addEventListener("click", () => {
      textareaEl.value = chip.getAttribute("data-prompt") || "";
      textareaEl.focus();
      triggerSubmit();
    });
  });

  // Sheet History Click Handler
  sheetHistoryList.querySelectorAll(".as-sheet-history-item").forEach((item) => {
    item.addEventListener("click", () => {
      textareaEl.value = item.getAttribute("data-task") || item.textContent.trim();
      setSheetOpen(false);
      textareaEl.focus();
      triggerSubmit();
    });
  });

  // Submit Handler
  function triggerSubmit() {
    const text = textareaEl.value.trim();
    if (!text && attachedFiles.length === 0) return;

    resetPlan();
    currentTaskStartTime = Date.now();
    currentTaskThoughts = [];
    lastSubmittedCommand = text;

    const currentAttachments = [...attachedFiles];
    textareaEl.value = "";
    textareaEl.style.height = "40px";
    attachedFiles = [];
    attachmentListEl.innerHTML = "";
    attachmentListEl.style.display = "none";

    if (heroView) heroView.style.display = "none";
    appendUserBubble(text, currentAttachments);
    showSkeleton();
    setStatus("processing", "Planning step-by-step strategy...");

    // Record in history list
    if (text) addHistoryItem(text);

    let fullCommand = text;
    if (currentAttachments.length > 0) {
      const fileNames = currentAttachments.map((f) => f.name).join(", ");
      fullCommand = fullCommand ? `${fullCommand} (Attached: ${fileNames})` : `Process attached: ${fileNames}`;
    }

    const activeModel = window.agenticSelectedModel || "nvidia/nemotron-3-ultra-550b-a55b";
    if (typeof window.process_task === "function") {
      window.process_task(fullCommand, activeModel);
    } else {
      console.warn("window.process_task is not attached yet.");
    }
  }

  sendBtn.addEventListener("click", triggerSubmit);

  textareaEl.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      triggerSubmit();
    }
  });

  function autoResizeTextarea() {
    textareaEl.style.height = "auto";
    const newHeight = Math.min(Math.max(textareaEl.scrollHeight, 40), 140);
    textareaEl.style.height = newHeight + "px";
  }

  textareaEl.addEventListener("input", autoResizeTextarea);

  function setStatus(state, message) {
    statusLabel.textContent = message;
    if (state === "processing") {
      statusSpinner.style.display = "inline-block";
    } else {
      statusSpinner.style.display = "none";
    }
  }

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
        `<div style="display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 6px;">` +
        attachments
          .map((att) => {
            if (att.isImage) {
              return `<img src="${att.dataUrl}" style="width: 48px; height: 48px; border-radius: 6px; object-fit: cover; border: 1px solid rgba(255, 255, 255, 0.2);" />`;
            }
            return `<span style="display: inline-flex; align-items: center; gap: 4px; padding: 2px 6px; border-radius: 4px; background: rgba(255, 255, 255, 0.15); font-size: 10px; color: #ffffff !important; -webkit-text-fill-color: #ffffff !important;">${ICONS.fileText} ${escapeHtml(att.name)}</span>`;
          })
          .join("") +
        `</div>`;
    }

    bubble.innerHTML = `${attachHtml}<div style="color: #ffffff !important; -webkit-text-fill-color: #ffffff !important; word-break: break-word !important; font-size: 12.5px !important; line-height: 1.45 !important;">${escapeHtml(text || "Uploaded attachment(s)")}</div>`;
    contentEl.appendChild(bubble);
    contentEl.scrollTop = contentEl.scrollHeight;
  }

  // --------------------------------------------------------------------------
  // Pure shadcn/ui Skeleton AI Loading Animation Component
  // --------------------------------------------------------------------------
  let currentSkeletonEl = null;

  function showSkeleton() {
    hideSkeleton();
    if (heroView) heroView.style.display = "none";

    const container = document.createElement("div");
    container.className = "as-skeleton-container";
    container.id = "as-ai-skeleton";

    container.innerHTML = `
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
    `;

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
  // Plan Card Manager (Single Hovering Card with Loading Spinners & Checkboxes)
  // --------------------------------------------------------------------------
  // Plan Card Manager (Inline Chat Component with Dropdown Interior Sections)
  // --------------------------------------------------------------------------
  function resetPlan() {
    planItems = [];
    currentInlinePlanCard = null;
    if (planWrapper) planWrapper.style.display = "none";
  }

  function getOrCreateInlinePlanCard() {
    if (!currentInlinePlanCard || !contentEl.contains(currentInlinePlanCard)) {
      currentInlinePlanCard = document.createElement("div");
      currentInlinePlanCard.className = "as-inline-plan-card";
      if (currentSkeletonEl && contentEl.contains(currentSkeletonEl)) {
        contentEl.insertBefore(currentInlinePlanCard, currentSkeletonEl);
      } else {
        contentEl.appendChild(currentInlinePlanCard);
      }
    }
    return currentInlinePlanCard;
  }

  function renderInlinePlanCard() {
    if (planItems.length === 0) return;
    if (heroView) heroView.style.display = "none";

    const card = getOrCreateInlinePlanCard();
    const total = planItems.length;
    const completedCount = planItems.filter((i) => i.status === "completed").length;
    const pct = total > 0 ? Math.round((completedCount / total) * 100) : 0;

    const summaryText = `You have ${total} task${total === 1 ? "" : "s"} to complete for this workflow.`;

    let itemsHtml = planItems
      .map((item, idx) => {
        let iconHtml = "";
        if (item.status === "completed") {
          iconHtml = `
            <div class="as-plan-status-completed" title="Completed">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
          `;
        } else if (item.status === "in-progress") {
          iconHtml = `<div class="as-plan-status-in-progress" title="In progress"></div>`;
        } else {
          iconHtml = `<div class="as-plan-status-pending" title="Pending"></div>`;
        }

        let logsHtml = "";
        if (item.logs && item.logs.length > 0) {
          logsHtml = item.logs
            .map(
              (log) => `
              <div class="as-plan-step-interior-line">
                <span class="as-plan-step-interior-bullet">•</span>
                <span>${escapeHtml(log)}</span>
              </div>
            `
            )
            .join("");
        } else if (item.status === "in-progress") {
          logsHtml = `
            <div class="as-plan-step-interior-line" style="color: #facc15;">
              <span class="as-plan-step-interior-bullet">•</span>
              <span>Executing step action in browser...</span>
            </div>
          `;
        } else if (item.status === "completed") {
          logsHtml = `
            <div class="as-plan-step-interior-line">
              <span class="as-plan-step-interior-bullet">•</span>
              <span>Step completed</span>
            </div>
          `;
        } else {
          logsHtml = `
            <div class="as-plan-step-interior-line" style="color: #71717a;">
              <span class="as-plan-step-interior-bullet">•</span>
              <span>Waiting to execute...</span>
            </div>
          `;
        }

        const isOpen = Boolean(item.isOpen);

        return `
          <div class="as-inline-plan-row ${item.status} ${isOpen ? "open" : ""}" data-idx="${idx}">
            <div class="as-inline-plan-item" data-idx="${idx}">
              <div class="as-inline-plan-item-left">
                <div class="as-plan-status-icon">${iconHtml}</div>
                <span class="as-inline-plan-text">${escapeHtml(item.text)}</span>
              </div>
              <div class="as-inline-plan-chevron">${ICONS.chevronRight}</div>
            </div>
            <div class="as-plan-step-interior" style="display: ${isOpen ? "block" : "none"};">
              ${logsHtml}
            </div>
          </div>
        `;
      })
      .join("");

    card.innerHTML = `
      <div class="as-inline-plan-summary">${escapeHtml(summaryText)}</div>
      <div class="as-inline-plan-header">
        <span class="as-inline-plan-title">Execution Plan</span>
        <span class="as-inline-plan-pct">${pct}%</span>
      </div>
      <div class="as-inline-plan-list">
        ${itemsHtml}
      </div>
    `;

    // Click handler to toggle interior dropdown section for each step
    card.querySelectorAll(".as-inline-plan-item").forEach((itemEl) => {
      itemEl.addEventListener("click", (e) => {
        e.stopPropagation();
        const idx = parseInt(itemEl.getAttribute("data-idx"), 10);
        if (planItems[idx]) {
          const willOpen = !planItems[idx].isOpen;
          planItems.forEach((p, i) => {
            p.isOpen = i === idx ? willOpen : false;
          });
          renderInlinePlanCard();
        }
      });
    });

    contentEl.scrollTop = contentEl.scrollHeight;
    requestAnimationFrame(() => {
      contentEl.scrollTop = contentEl.scrollHeight;
    });
  }

  function updatePlan(data) {
    let parsed = null;
    if (typeof data === "string" && data.trim().startsWith("{")) {
      try {
        parsed = JSON.parse(data);
      } catch { }
    } else if (typeof data === "object" && data !== null) {
      parsed = data;
    }

    if (parsed && Array.isArray(parsed.plan)) {
      if (parsed.stepIndex === 1) {
        planItems = [];
        currentInlinePlanCard = null;
      }
      const incomingPlan = parsed.plan;
      const activeIdx = typeof parsed.stepIndex === "number" ? parsed.stepIndex - 1 : 0;

      incomingPlan.forEach((stepStr, idx) => {
        const cleanText = stepStr.replace(/^\d+[\.\)]\s*/, "").trim();
        let existing = planItems[idx];
        if (!existing) {
          let status = "pending";
          if (idx < activeIdx) status = "completed";
          else if (idx === activeIdx) status = "in-progress";

          planItems.push({
            id: idx + 1,
            text: cleanText,
            status,
            logs: [],
            isOpen: idx === activeIdx,
          });
        } else {
          existing.text = cleanText;
          if (idx < activeIdx) {
            existing.status = "completed";
            existing.isOpen = false;
          } else if (idx === activeIdx) {
            if (existing.status !== "completed") {
              existing.status = "in-progress";
            }
            existing.isOpen = true;
          } else {
            existing.status = "pending";
            existing.isOpen = false;
          }
        }
      });

      planItems.forEach((item, idx) => {
        if (idx === activeIdx && item.status !== "completed") {
          item.status = "in-progress";
          item.isOpen = true;
        } else if (idx !== activeIdx) {
          item.isOpen = false;
        }
      });

      renderInlinePlanCard();
      return;
    }

    // String format handling
    const str = String(data || "").trim();
    if (!str) return;

    const clean = str.replace(/^[📋\s*]+/, "").trim();
    const match = clean.match(/^Step\s+(\d+)\s*[:\-]\s*(.*)$/i);

    if (match) {
      const stepIdx = parseInt(match[1], 10);
      const desc = match[2].trim();

      planItems.forEach((item) => {
        if (item.id < stepIdx) {
          item.status = "completed";
          item.isOpen = false;
        }
      });

      let existing = planItems.find((item) => item.id === stepIdx);
      if (existing) {
        existing.text = desc;
        existing.status = "in-progress";
        existing.isOpen = true;
      } else {
        planItems.push({
          id: stepIdx,
          text: desc,
          status: "in-progress",
          logs: [],
          isOpen: true,
        });
      }
    } else {
      const currentActive = planItems.find((item) => item.status === "in-progress");
      if (currentActive) {
        currentActive.status = "completed";
        currentActive.isOpen = false;
      }
      planItems.push({
        id: planItems.length + 1,
        text: clean,
        status: "in-progress",
        logs: [],
        isOpen: true,
      });
    }

    planItems.forEach((item) => {
      if (item.status !== "in-progress") {
        item.isOpen = false;
      }
    });

    renderInlinePlanCard();
  }

  function recordStepAction(actionDesc) {
    const cleanAction = stripStartSymbols(actionDesc);
    let activeItem = planItems.find((item) => item.status === "in-progress");
    if (!activeItem) {
      activeItem = planItems.find((item) => item.status === "pending");
      if (activeItem) {
        activeItem.status = "in-progress";
      }
    }

    if (activeItem) {
      if (!activeItem.logs) activeItem.logs = [];
      activeItem.logs.push(cleanAction);
      activeItem.status = "completed";
      activeItem.isOpen = false;

      // Advance to next pending step and open it exclusively
      const nextPending = planItems.find((item) => item.status === "pending");
      if (nextPending) {
        nextPending.status = "in-progress";
        nextPending.isOpen = true;
      }
    } else if (planItems.length > 0) {
      const last = planItems[planItems.length - 1];
      if (!last.logs) last.logs = [];
      last.logs.push(cleanAction);
    }

    // Ensure strictly only the in-progress step is open
    planItems.forEach((item) => {
      if (item.status !== "in-progress") {
        item.isOpen = false;
      }
    });

    renderInlinePlanCard();
  }

  function completeAllPlanSteps() {
    planItems.forEach((item) => {
      item.status = "completed";
      item.isOpen = false;
    });
    renderInlinePlanCard();
  }

  function stripStartSymbols(str) {
    if (!str) return "";
    let s = String(str).trim();
    // Strip leading emojis, symbols, asterisks, bullet points, numbers with stars, etc.
    s = s.replace(/^[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}*•#⚡✨⭐🌟💡🤖🎉📋✅🔥🎯🏷️✦✧★\s\-_:\.]+/u, "").trim();
    return s;
  }

  function formatAiMarkdown(raw) {
    if (!raw) return "";
    let text = stripStartSymbols(raw);

    const lines = text.split("\n");
    const output = [];
    let inCodeBlock = false;
    let codeBuffer = [];

    function formatInline(str) {
      if (!str) return "";
      let s = escapeHtml(str);
      // Bold: **text** or __text__
      s = s.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
      s = s.replace(/__(.*?)__/g, "<strong>$1</strong>");
      // Inline code: `code`
      s = s.replace(/`([^`]+)`/g, '<span class="as-inline-code">$1</span>');
      // Links: [text](url)
      s = s.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" style="color:#facc15;text-decoration:underline;">$1</a>');
      return s;
    }

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      // Code block toggle
      if (trimmed.startsWith("```")) {
        if (inCodeBlock) {
          output.push(`<pre class="as-code-block"><code>${escapeHtml(codeBuffer.join("\n"))}</code></pre>`);
          codeBuffer = [];
          inCodeBlock = false;
        } else {
          inCodeBlock = true;
          codeBuffer = [];
        }
        continue;
      }

      if (inCodeBlock) {
        codeBuffer.push(line);
        continue;
      }

      if (!trimmed) {
        continue;
      }

      // Check for numbered section headers like "1. Agent Creation & Configuration" or "### 1. Title"
      const numberedHeaderMatch = trimmed.match(/^#{0,3}\s*(\d+\.\s+[\w\s&/\\-]+(?:\*\*|:)?)$/);
      if (numberedHeaderMatch) {
        let title = numberedHeaderMatch[1].replace(/\*\*/g, "").replace(/:$/, "").trim();
        output.push(`<div class="as-ai-heading">${escapeHtml(title)}</div>`);
        continue;
      }

      // Markdown Headings: #, ##, ###
      if (/^#{1,4}\s+/.test(trimmed)) {
        const title = trimmed.replace(/^#{1,4}\s+/, "").trim();
        output.push(`<div class="as-ai-heading">${escapeHtml(title)}</div>`);
        continue;
      }

      // Bullet items (- or * or •)
      if (/^[\-\*•]\s+/.test(trimmed)) {
        const bulletText = trimmed.replace(/^[\-\*•]\s+/, "");
        output.push(`
          <div class="as-ai-bullet">
            <span class="as-bullet-dot"></span>
            <div>${formatInline(bulletText)}</div>
          </div>
        `);
        continue;
      }

      // Numbered list items
      const numListMatch = trimmed.match(/^(\d+[\.\)])\s+(.*)$/);
      if (numListMatch) {
        const num = numListMatch[1];
        const rest = numListMatch[2];
        if (rest.startsWith("**") && rest.includes("**")) {
          output.push(`<div class="as-ai-heading">${formatInline(num + " " + rest)}</div>`);
        } else {
          output.push(`
            <div class="as-ai-bullet">
              <span style="font-weight: 600; color: #facc15; font-size: 11.5px; min-width: 16px;">${num}</span>
              <div>${formatInline(rest)}</div>
            </div>
          `);
        }
        continue;
      }

      // Regular paragraph
      output.push(`<p class="as-ai-p">${formatInline(trimmed)}</p>`);
    }

    if (inCodeBlock && codeBuffer.length > 0) {
      output.push(`<pre class="as-code-block"><code>${escapeHtml(codeBuffer.join("\n"))}</code></pre>`);
    }

    return output.join("");
  }

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
          return `
            <div class="as-thought-step-line">
              <span class="as-thought-step-bullet">•</span>
              <span>${escapeHtml(label)}</span>
            </div>
          `;
        })
        .join("");
    } else {
      thoughtsListHtml = `
        <div class="as-thought-step-line">
          <span class="as-thought-step-bullet">•</span>
          <span>Analyzed execution context and generated structured response</span>
        </div>
      `;
    }

    const formattedBody = formatAiMarkdown(text);
    const cleanPlainText = stripStartSymbols(text);

    container.innerHTML = `
      <div class="as-thought-wrapper">
        <button class="as-thought-bar" type="button" aria-expanded="false" title="Click to view thought process">
          <div class="as-thought-left">
            <span class="as-thought-icon">${ICONS.lightbulb}</span>
            <span class="as-thought-label">Thought for ${elapsedSec} second${elapsedSec === 1 ? "" : "s"}</span>
            <span class="as-thought-chevron">${ICONS.chevronRight}</span>
          </div>
          <div class="as-thought-right">
            <div class="as-sources-badge">
              <div class="as-sources-icons">
                <span class="as-source-pill"></span>
                <span class="as-source-pill"></span>
                <span class="as-source-pill"></span>
              </div>
              <span>${sourcesCount} sources</span>
            </div>
          </div>
        </button>
        <div class="as-thought-drawer" style="display: none;">
          <div class="as-thought-drawer-inner">
            ${thoughtsListHtml}
          </div>
        </div>
      </div>

      <div class="as-ai-message-body">
        ${formattedBody}
      </div>

      <div class="as-ai-toolbar">
        <button class="as-ai-tool-btn as-btn-copy" title="Copy response" type="button">
          ${ICONS.copy}
        </button>
        <button class="as-ai-tool-btn as-btn-refine" title="Refine response" type="button">
          ${ICONS.sparkles}
        </button>
        <button class="as-ai-tool-btn as-btn-dislike" title="Dislike response" type="button">
          ${ICONS.thumbsDown}
        </button>
        <button class="as-ai-tool-btn as-btn-retry" title="Retry command" type="button">
          ${ICONS.rotateCw}
        </button>
        <div class="as-ai-tool-divider"></div>
        <button class="as-ai-tool-text-btn as-btn-personalize" title="Personalize message" type="button">
          ${ICONS.sliders}
          <span>Personalize message</span>
        </button>
      </div>
    `;

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
  // Screenshot Flash & Modal Lightbox Manager
  // --------------------------------------------------------------------------
  let flashEl = document.getElementById("as-screenshot-flash");
  if (!flashEl) {
    flashEl = document.createElement("div");
    flashEl.id = "as-screenshot-flash";
    document.body.appendChild(flashEl);
  }

  let screenshotModalEl = document.getElementById("as-screenshot-modal");
  if (!screenshotModalEl) {
    screenshotModalEl = document.createElement("div");
    screenshotModalEl.id = "as-screenshot-modal";
    screenshotModalEl.innerHTML = `
      <button id="as-screenshot-modal-close" type="button" title="Close preview">✕</button>
      <img id="as-screenshot-modal-img" src="" alt="Enlarged screenshot preview" />
    `;
    document.body.appendChild(screenshotModalEl);

    screenshotModalEl.addEventListener("click", (e) => {
      if (e.target === screenshotModalEl || e.target.id === "as-screenshot-modal-close") {
        screenshotModalEl.classList.remove("open");
      }
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && screenshotModalEl.classList.contains("open")) {
        screenshotModalEl.classList.remove("open");
      }
    });
  }

  function openScreenshotModal(b64) {
    if (!screenshotModalEl) return;
    const img = screenshotModalEl.querySelector("#as-screenshot-modal-img");
    if (img) img.src = b64.startsWith("data:") ? b64 : `data:image/jpeg;base64,${b64}`;
    screenshotModalEl.classList.add("open");
  }

  function triggerScreenshotFlash() {
    if (!flashEl) {
      flashEl = document.getElementById("as-screenshot-flash");
      if (!flashEl) {
        flashEl = document.createElement("div");
        flashEl.id = "as-screenshot-flash";
        document.body.appendChild(flashEl);
      }
    }
    flashEl.classList.remove("flashing");
    void flashEl.offsetWidth; // trigger reflow
    flashEl.classList.add("flashing");
    setTimeout(() => {
      if (flashEl) flashEl.classList.remove("flashing");
    }, 280);
  }

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
        try { tData = JSON.parse(text); } catch {}
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
        try { sData = JSON.parse(text); } catch {}
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
    card.innerHTML = `
      <div class="as-card-header">
        <span class="as-badge as-badge-browser">${ICONS.bot} <span>Action</span></span>
      </div>
      <div class="as-card-body">${escapeHtml(cleanText)}</div>
    `;
    contentEl.appendChild(card);
    contentEl.scrollTop = contentEl.scrollHeight;
  }

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

  function escapeHtml(str) {
    if (!str) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  // --------------------------------------------------------------------------
  // 6. Public Global Interface for Playwright Agents
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
  };
})();
