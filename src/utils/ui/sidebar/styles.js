"use strict";

/**
 * Sidebar overlay styling with shadcn design tokens and background dot grid.
 */
export function getSidebarStyles(EXPANDED_WIDTH = 420, RAIL_WIDTH = 46) {
  return `
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
    #agentic-sidebar-wrapper {
      all: initial;
      position: fixed !important;
      top: 0 !important;
      right: 0 !important;
      bottom: 0 !important;
      z-index: 2147483647 !important;
      pointer-events: none !important;
      box-sizing: border-box !important;
    }

    #agentic-sidebar-root {
      all: initial;
      pointer-events: auto !important;
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
      border-radius: 0px !important;
      background-color: #ffffff !important;
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
       Inner Chat Container (Rounded Frame inside the Sharp Outer Dock)
       ------------------------------------------------------------------------ */
    .as-inner-container {
      display: flex !important;
      flex-direction: column !important;
      flex: 1 1 auto !important;
      width: 100% !important;
      height: 100% !important;
      min-height: 0 !important;
      box-sizing: border-box !important;
      overflow: hidden !important;
      border-radius: 0px !important;
      border: none !important;
      background-color: #ffffff !important;
      background-image: radial-gradient(var(--dot-color) 1.25px, transparent 1.25px) !important;
      background-size: 18px 18px !important;
      box-shadow: none !important;
      position: relative !important;
    }

    /* ------------------------------------------------------------------------
       2. Thin Vertical Rail Dock (46px)
       ------------------------------------------------------------------------ */
    #agentic-rail-root {
      all: initial;
      pointer-events: auto !important;
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
      overflow: hidden !important;
      border-radius: 0px !important;
      background-color: #ffffff !important;
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

    /* Header Chat Dropdown Menu Button */
    .as-header-title-btn {
      all: initial !important;
      display: inline-flex !important;
      align-items: center !important;
      gap: 6px !important;
      padding: 5px 8px !important;
      border-radius: calc(var(--radius) - 4px) !important;
      background: transparent !important;
      border: 1px solid transparent !important;
      color: hsl(var(--foreground)) !important;
      font-family: var(--font-sans) !important;
      font-size: 13.5px !important;
      font-weight: 600 !important;
      letter-spacing: -0.2px !important;
      cursor: pointer !important;
      user-select: none !important;
      max-width: 230px !important;
      transition: all 0.15s cubic-bezier(0.16, 1, 0.3, 1) !important;
      box-sizing: border-box !important;
      outline: none !important;
      line-height: 1 !important;
    }

    .as-header-title-btn:hover {
      background: hsl(var(--muted)) !important;
      color: hsl(var(--foreground)) !important;
    }

    .as-header-title-btn:active {
      transform: scale(0.97) !important;
    }

    .as-header-title-btn span:first-child {
      white-space: nowrap !important;
      overflow: hidden !important;
      text-overflow: ellipsis !important;
      display: inline-block !important;
      max-width: 195px !important;
    }

    .as-header-chevron {
      display: inline-flex !important;
      align-items: center !important;
      justify-content: center !important;
      color: hsl(var(--muted-foreground)) !important;
      flex-shrink: 0 !important;
      transition: transform 0.2s ease !important;
    }

    .as-header-chevron svg {
      width: 13px !important;
      height: 13px !important;
      stroke-width: 2.2 !important;
      display: block !important;
    }

    .as-header-title-btn:hover .as-header-chevron {
      color: hsl(var(--foreground)) !important;
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
      width: 290px;
      z-index: 60;
      transform: translateX(-100%);
      transition: transform 0.28s cubic-bezier(0.16, 1, 0.3, 1);
      display: flex;
      flex-direction: column;
      box-sizing: border-box;
      padding: 16px 14px;
      gap: 12px;
      pointer-events: none;
      box-shadow: none !important;
    }
    #agentic-sidebar-root:not(.dark) .as-sheet {
      background: #ffffff !important;
      border-right: 1px solid #e4e4e7 !important;
    }
    #agentic-sidebar-root.dark .as-sheet {
      background: #09090b !important;
      border-right: 1px solid #27272a !important;
    }

    .as-sheet.open {
      transform: translateX(0);
      pointer-events: auto;
    }

    /* Sheet Header */
    .as-sheet-header {
      display: flex !important;
      align-items: center !important;
      justify-content: space-between !important;
      padding-bottom: 2px !important;
    }
    .as-sheet-header-left {
      display: flex !important;
      align-items: center !important;
      gap: 8px !important;
    }
    .as-sheet-title {
      font-size: 13.5px !important;
      font-weight: 600 !important;
      font-family: var(--font-sans) !important;
      letter-spacing: -0.01em !important;
    }
    #agentic-sidebar-root:not(.dark) .as-sheet-title {
      color: #09090b !important;
    }
    #agentic-sidebar-root.dark .as-sheet-title {
      color: #fafafa !important;
    }
    .as-sheet-header-badge {
      font-size: 10px !important;
      font-weight: 600 !important;
      font-family: var(--font-mono, monospace) !important;
      padding: 1px 6px !important;
      border-radius: calc(var(--radius) - 6px) !important;
    }
    #agentic-sidebar-root:not(.dark) .as-sheet-header-badge {
      background: rgba(245, 158, 11, 0.12) !important;
      color: #d97706 !important;
      border: 1px solid rgba(245, 158, 11, 0.25) !important;
    }
    #agentic-sidebar-root.dark .as-sheet-header-badge {
      background: rgba(245, 158, 11, 0.12) !important;
      color: #f59e0b !important;
      border: 1px solid rgba(245, 158, 11, 0.3) !important;
    }
    .as-sheet-close-btn {
      all: initial !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      width: 26px !important;
      height: 26px !important;
      border-radius: calc(var(--radius) - 4px) !important;
      cursor: pointer !important;
      color: #71717a !important;
      transition: all 0.15s ease !important;
    }
    .as-sheet-close-btn:hover {
      background: rgba(255, 255, 255, 0.08) !important;
      color: #fafafa !important;
    }
    #agentic-sidebar-root:not(.dark) .as-sheet-close-btn:hover {
      background: #f4f4f5 !important;
      color: #09090b !important;
    }

    /* + New Chat Button in Sheet with Global Border Radius */
    .as-sheet-new-btn {
      all: initial;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      height: 36px;
      width: 100%;
      padding: 0 14px;
      box-sizing: border-box;
      border-radius: calc(var(--radius) - 4px) !important; /* Strict 8px global standard */
      font-size: 12.5px;
      font-weight: 500;
      font-family: var(--font-sans);
      cursor: pointer;
      transition: all 0.18s cubic-bezier(0.16, 1, 0.3, 1);
      user-select: none;
    }
    #agentic-sidebar-root:not(.dark) .as-sheet-new-btn {
      background: #09090b !important;
      color: #ffffff !important;
      border: 1px solid #09090b !important;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.06) !important;
    }
    #agentic-sidebar-root:not(.dark) .as-sheet-new-btn:hover {
      background: #27272a !important;
      border-color: #27272a !important;
    }
    #agentic-sidebar-root.dark .as-sheet-new-btn {
      background: #18181b !important;
      color: #fafafa !important;
      border: 1px solid #27272a !important;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3) !important;
    }
    #agentic-sidebar-root.dark .as-sheet-new-btn:hover {
      background: #27272a !important;
      border-color: #3f3f46 !important;
      color: #ffffff !important;
    }
    .as-sheet-new-btn:active {
      transform: scale(0.98) !important;
    }

    /* Search Conversations Filter */
    .as-sheet-search-box {
      display: flex !important;
      align-items: center !important;
      gap: 8px !important;
      height: 32px !important;
      padding: 0 10px !important;
      border-radius: calc(var(--radius) - 4px) !important;
      box-sizing: border-box !important;
      transition: all 0.15s ease !important;
    }
    #agentic-sidebar-root:not(.dark) .as-sheet-search-box {
      background: #f4f4f5 !important;
      border: 1px solid #e4e4e7 !important;
    }
    #agentic-sidebar-root.dark .as-sheet-search-box {
      background: #121215 !important;
      border: 1px solid #27272a !important;
    }
    .as-sheet-search-box:focus-within {
      border-color: #f59e0b !important;
      box-shadow: 0 0 0 1px rgba(245, 158, 11, 0.25) !important;
    }
    .as-sheet-search-icon {
      display: flex !important;
      align-items: center !important;
      color: #71717a !important;
      flex-shrink: 0 !important;
    }
    .as-sheet-search-input {
      all: initial !important;
      width: 100% !important;
      font-size: 11.5px !important;
      font-family: var(--font-sans) !important;
    }
    #agentic-sidebar-root:not(.dark) .as-sheet-search-input {
      color: #09090b !important;
    }
    #agentic-sidebar-root.dark .as-sheet-search-input {
      color: #fafafa !important;
    }
    .as-sheet-search-input::placeholder {
      color: #71717a !important;
    }

    .as-sheet-section-title {
      font-size: 10.5px !important;
      font-weight: 600 !important;
      text-transform: uppercase !important;
      letter-spacing: 0.05em !important;
      color: #71717a !important;
      margin-top: 2px !important;
      padding: 0 2px !important;
      user-select: none !important;
    }

    .as-sheet-history-list {
      flex: 1;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 4px;
      padding-top: 2px;
    }

    .as-sheet-history-item {
      all: initial;
      display: flex !important;
      align-items: center !important;
      justify-content: space-between !important;
      padding: 8px 10px !important;
      border-radius: calc(var(--radius) - 4px) !important; /* Global 8px radius */
      font-size: 11.5px !important;
      font-family: var(--font-sans) !important;
      cursor: pointer !important;
      transition: all 0.15s ease !important;
      user-select: none !important;
      gap: 6px !important;
      border: 1px solid transparent !important;
      box-sizing: border-box !important;
    }
    #agentic-sidebar-root:not(.dark) .as-sheet-history-item {
      color: #09090b !important;
    }
    #agentic-sidebar-root:not(.dark) .as-sheet-history-item:hover {
      background: #f4f4f5 !important;
      border-color: #e4e4e7 !important;
    }
    #agentic-sidebar-root:not(.dark) .as-sheet-history-item.active {
      background: rgba(245, 158, 11, 0.08) !important;
      border-color: rgba(245, 158, 11, 0.5) !important;
    }
    #agentic-sidebar-root.dark .as-sheet-history-item {
      color: #d4d4d8 !important;
    }
    #agentic-sidebar-root.dark .as-sheet-history-item:hover {
      background: #18181b !important;
      border-color: #27272a !important;
      color: #fafafa !important;
    }
    #agentic-sidebar-root.dark .as-sheet-history-item.active {
      background: rgba(245, 158, 11, 0.12) !important;
      border-color: rgba(245, 158, 11, 0.4) !important;
      color: #fafafa !important;
    }

    .as-sheet-item-left {
      display: flex !important;
      align-items: flex-start !important;
      gap: 8px !important;
      overflow: hidden !important;
      flex: 1 1 auto !important;
    }

    .as-sheet-item-dot {
      width: 6px !important;
      height: 6px !important;
      border-radius: 50% !important;
      flex-shrink: 0 !important;
      margin-top: 4px !important;
    }
    .as-sheet-item-dot.completed {
      background: #10b981 !important;
    }
    .as-sheet-item-dot.failed {
      background: #ef4444 !important;
    }
    .as-sheet-item-dot.running {
      background: #f59e0b !important;
    }

    .as-sheet-item-col {
      display: flex !important;
      flex-direction: column !important;
      overflow: hidden !important;
      flex: 1 1 auto !important;
      gap: 2px !important;
    }

    .as-sheet-item-text {
      white-space: nowrap !important;
      overflow: hidden !important;
      text-overflow: ellipsis !important;
      font-size: 11.5px !important;
      font-weight: 500 !important;
      line-height: 1.3 !important;
    }

    .as-sheet-item-meta {
      display: flex !important;
      align-items: center !important;
      gap: 5px !important;
      font-size: 9.5px !important;
    }

    .as-sheet-item-time {
      font-size: 9.5px !important;
      color: #71717a !important;
    }

    .as-sheet-item-actions {
      display: flex !important;
      align-items: center !important;
      gap: 2px !important;
      opacity: 0;
      transition: opacity 0.15s ease !important;
      flex-shrink: 0 !important;
    }
    .as-sheet-history-item:hover .as-sheet-item-actions {
      opacity: 1 !important;
    }

    .as-btn-history-edit,
    .as-btn-history-delete {
      all: initial !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      width: 22px !important;
      height: 22px !important;
      border-radius: calc(var(--radius) - 6px) !important;
      color: #71717a !important;
      cursor: pointer !important;
      transition: all 0.15s ease !important;
    }
    .as-btn-history-edit:hover {
      color: #f59e0b !important;
      background: rgba(245, 158, 11, 0.15) !important;
    }
    .as-btn-history-delete:hover {
      color: #ef4444 !important;
      background: rgba(239, 68, 68, 0.15) !important;
    }

    /* Inline Title Editing */
    .as-sheet-edit-container {
      display: flex !important;
      align-items: center !important;
      gap: 4px !important;
      width: 100% !important;
    }
    .as-sheet-edit-input {
      all: initial !important;
      flex: 1 1 auto !important;
      height: 24px !important;
      border-radius: calc(var(--radius) - 6px) !important;
      font-size: 11.5px !important;
      font-family: var(--font-sans) !important;
      padding: 0 6px !important;
      border: 1px solid #f59e0b !important;
      box-sizing: border-box !important;
    }
    #agentic-sidebar-root:not(.dark) .as-sheet-edit-input {
      background: #ffffff !important;
      color: #09090b !important;
    }
    #agentic-sidebar-root.dark .as-sheet-edit-input {
      background: #18181b !important;
      color: #fafafa !important;
    }
    .as-btn-edit-save,
    .as-btn-edit-cancel {
      all: initial !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      width: 22px !important;
      height: 22px !important;
      border-radius: calc(var(--radius) - 6px) !important;
      cursor: pointer !important;
      flex-shrink: 0 !important;
      transition: all 0.15s ease !important;
    }
    .as-btn-edit-save {
      color: #10b981 !important;
    }
    .as-btn-edit-save:hover {
      background: rgba(16, 185, 129, 0.15) !important;
    }
    .as-btn-edit-cancel {
      color: #71717a !important;
    }
    .as-btn-edit-cancel:hover {
      color: #ef4444 !important;
      background: rgba(239, 68, 68, 0.15) !important;
    }

    .as-sheet-empty,
    .as-sheet-loading {
      font-size: 11px !important;
      color: #71717a !important;
      text-align: center !important;
      padding: 16px 8px !important;
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

    /* ========================================================================
       Activity Timeline / Action Component (Exact Match to Reference Stepper)
       ======================================================================== */
    .as-action-timeline-container {
      align-self: stretch !important;
      display: flex !important;
      flex-direction: column !important;
      gap: 12px !important;
      padding: 13px 15px !important;
      border-radius: 8px !important;
      box-sizing: border-box !important;
      width: 100% !important;
      animation: asFadeUp 0.22s cubic-bezier(0.16, 1, 0.3, 1) !important;
      transition: background 0.15s ease, border-color 0.15s ease !important;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.02) !important;
    }
    #agentic-sidebar-root:not(.dark) .as-action-timeline-container {
      background: #ffffff !important;
      border: 1px solid #e4e4e7 !important;
    }
    #agentic-sidebar-root.dark .as-action-timeline-container {
      background: #18181b !important;
      border: 1px solid #27272a !important;
    }

    .as-timeline-header {
      display: flex !important;
      flex-direction: column !important;
      gap: 2.5px !important;
      padding-bottom: 8px !important;
      border-bottom: 1px solid #e4e4e7 !important;
    }
    #agentic-sidebar-root.dark .as-timeline-header {
      border-bottom: 1px solid #27272a !important;
    }

    .as-timeline-title-row {
      display: flex !important;
      align-items: center !important;
      justify-content: space-between !important;
    }

    .as-timeline-title {
      font-size: 13px !important;
      font-weight: 600 !important;
      color: inherit !important;
      letter-spacing: -0.15px !important;
    }

    .as-timeline-count-badge {
      font-size: 10px !important;
      font-weight: 500 !important;
      padding: 1.5px 6px !important;
      border-radius: 4px !important;
    }
    #agentic-sidebar-root:not(.dark) .as-timeline-count-badge {
      background: #f4f4f5 !important;
      color: #71717a !important;
      border: 1px solid #e4e4e7 !important;
    }
    #agentic-sidebar-root.dark .as-timeline-count-badge {
      background: #27272a !important;
      color: #a1a1aa !important;
      border: 1px solid #3f3f46 !important;
    }

    .as-timeline-subtitle {
      font-size: 11px !important;
      color: #71717a !important;
      line-height: 1.4 !important;
    }
    #agentic-sidebar-root.dark .as-timeline-subtitle {
      color: #a1a1aa !important;
    }

    /* Stream and Timeline Items */
    .as-timeline-stream {
      display: flex !important;
      flex-direction: column !important;
      width: 100% !important;
      box-sizing: border-box !important;
    }

    .as-timeline-item {
      display: flex !important;
      align-items: stretch !important;
      gap: 11px !important;
      width: 100% !important;
      box-sizing: border-box !important;
      position: relative !important;
      animation: asFadeUp 0.18s cubic-bezier(0.16, 1, 0.3, 1) !important;
    }

    /* Node & Connecting Line Column */
    .as-timeline-node-col {
      display: flex !important;
      flex-direction: column !important;
      align-items: center !important;
      flex-shrink: 0 !important;
      width: 20px !important;
      position: relative !important;
    }

    .as-timeline-node {
      width: 19px !important;
      height: 19px !important;
      border-radius: 50% !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      flex-shrink: 0 !important;
      z-index: 2 !important;
      margin-top: 1px !important;
      transition: all 0.2s ease !important;
    }

    /* Completed node style (matching checkmark node in reference) */
    #agentic-sidebar-root:not(.dark) .as-timeline-node {
      background: #f4f4f5 !important;
      border: 1.5px solid #d4d4d8 !important;
      color: #18181b !important;
    }
    #agentic-sidebar-root.dark .as-timeline-node {
      background: #27272a !important;
      border: 1.5px solid #3f3f46 !important;
      color: #fafafa !important;
    }

    /* Specific accent nodes matching reference */
    .as-timeline-completed .as-timeline-node {
      background: #16a34a !important;
      border: 1.5px solid #16a34a !important;
      color: #ffffff !important;
    }
    .as-timeline-navigate .as-timeline-node,
    .as-timeline-search .as-timeline-node {
      background: #2563eb !important;
      border: 1.5px solid #2563eb !important;
      color: #ffffff !important;
    }
    .as-timeline-click .as-timeline-node,
    .as-timeline-type .as-timeline-node {
      background: #ea580c !important;
      border: 1.5px solid #ea580c !important;
      color: #ffffff !important;
    }
    .as-timeline-camera .as-timeline-node {
      background: #7c3aed !important;
      border: 1.5px solid #7c3aed !important;
      color: #ffffff !important;
    }
    .as-timeline-scroll .as-timeline-node {
      background: #0284c7 !important;
      border: 1.5px solid #0284c7 !important;
      color: #ffffff !important;
    }

    .as-timeline-node svg {
      width: 11px !important;
      height: 11px !important;
    }

    /* Vertical connecting spine line */
    .as-timeline-line {
      width: 1.5px !important;
      flex: 1 1 auto !important;
      min-height: 12px !important;
      margin-top: 3px !important;
      margin-bottom: -1px !important;
    }
    #agentic-sidebar-root:not(.dark) .as-timeline-line {
      background: #e4e4e7 !important;
    }
    #agentic-sidebar-root.dark .as-timeline-line {
      background: #27272a !important;
    }
    /* Hide connecting line after the last timeline item */
    .as-timeline-item:last-child .as-timeline-line {
      display: none !important;
    }

    /* Content Column */
    .as-timeline-content-col {
      display: flex !important;
      flex-direction: column !important;
      flex: 1 1 auto !important;
      min-width: 0 !important;
      padding-bottom: 13px !important;
    }
    .as-timeline-item:last-child .as-timeline-content-col {
      padding-bottom: 2px !important;
    }

    .as-timeline-item-header {
      display: flex !important;
      align-items: baseline !important;
      justify-content: space-between !important;
      gap: 8px !important;
      width: 100% !important;
    }

    .as-timeline-item-title {
      font-size: 12px !important;
      font-weight: 550 !important;
      color: inherit !important;
      line-height: 1.4 !important;
      word-break: break-word !important;
    }

    .as-timeline-item-time {
      font-size: 10px !important;
      color: #71717a !important;
      flex-shrink: 0 !important;
      white-space: nowrap !important;
    }
    #agentic-sidebar-root.dark .as-timeline-item-time {
      color: #a1a1aa !important;
    }

    /* Indented Callout Card (Matching Oliver Brown card in reference) */
    .as-timeline-card {
      margin-top: 6px !important;
      margin-bottom: 2px !important;
      padding: 9px 12px !important;
      border-radius: 7px !important;
      display: flex !important;
      flex-direction: column !important;
      gap: 5px !important;
      box-sizing: border-box !important;
      width: 100% !important;
      transition: all 0.15s ease !important;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.02) !important;
    }
    #agentic-sidebar-root:not(.dark) .as-timeline-card {
      background: #fafafa !important;
      border: 1px solid #e4e4e7 !important;
    }
    #agentic-sidebar-root.dark .as-timeline-card {
      background: #121215 !important;
      border: 1px solid #27272a !important;
    }

    .as-timeline-card-header {
      display: flex !important;
      align-items: center !important;
      justify-content: space-between !important;
    }

    .as-timeline-card-author {
      display: flex !important;
      align-items: center !important;
      gap: 7px !important;
    }

    .as-timeline-card-avatar {
      width: 17px !important;
      height: 17px !important;
      border-radius: 50% !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      flex-shrink: 0 !important;
    }
    #agentic-sidebar-root:not(.dark) .as-timeline-card-avatar {
      background: #e4e4e7 !important;
      color: #09090b !important;
    }
    #agentic-sidebar-root.dark .as-timeline-card-avatar {
      background: #27272a !important;
      color: #fafafa !important;
    }
    .as-timeline-card-avatar svg {
      width: 10px !important;
      height: 10px !important;
    }

    .as-timeline-card-name {
      font-size: 11px !important;
      font-weight: 600 !important;
      color: inherit !important;
      letter-spacing: -0.1px !important;
    }

    /* Small Pill Badge like TL in reference */
    .as-timeline-card-badge {
      font-size: 8.5px !important;
      font-weight: 700 !important;
      padding: 1px 5px !important;
      border-radius: 3px !important;
      letter-spacing: 0.3px !important;
      text-transform: uppercase !important;
    }
    #agentic-sidebar-root:not(.dark) .as-timeline-card-badge {
      background: #f4f4f5 !important;
      color: #52525b !important;
      border: 1px solid #e4e4e7 !important;
    }
    #agentic-sidebar-root.dark .as-timeline-card-badge {
      background: #27272a !important;
      color: #a1a1aa !important;
      border: 1px solid #3f3f46 !important;
    }

    .as-timeline-card-body {
      font-size: 11px !important;
      line-height: 1.45 !important;
      color: inherit !important;
      display: flex !important;
      flex-direction: column !important;
      gap: 3.5px !important;
    }

    .as-timeline-card-row {
      display: flex !important;
      align-items: flex-start !important;
      gap: 6px !important;
      word-break: break-all !important;
    }

    .as-timeline-card-label {
      font-size: 10px !important;
      font-weight: 600 !important;
      color: #71717a !important;
      flex-shrink: 0 !important;
    }
    #agentic-sidebar-root.dark .as-timeline-card-label {
      color: #a1a1aa !important;
    }

    .as-timeline-card-value {
      font-size: 11px !important;
      color: inherit !important;
    }

    .as-timeline-card-link {
      color: #2563eb !important;
      text-decoration: underline !important;
      text-underline-offset: 2px !important;
      font-size: 11px !important;
    }
    #agentic-sidebar-root.dark .as-timeline-card-link {
      color: #60a5fa !important;
    }

    .as-timeline-card-code {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace !important;
      font-size: 10.5px !important;
      padding: 1px 4px !important;
      border-radius: 4px !important;
    }
    #agentic-sidebar-root:not(.dark) .as-timeline-card-code {
      background: #f4f4f5 !important;
      color: #18181b !important;
      border: 1px solid #e4e4e7 !important;
    }
    #agentic-sidebar-root.dark .as-timeline-card-code {
      background: #27272a !important;
      color: #fafafa !important;
      border: 1px solid #3f3f46 !important;
    }

    /* Timeline Footer Action Button (Matching reference component) */
    .as-timeline-footer {
      display: flex !important;
      align-items: center !important;
      justify-content: flex-start !important;
      padding-top: 6px !important;
      margin-top: 2px !important;
    }

    .as-timeline-footer-btn {
      all: initial !important;
      box-sizing: border-box !important;
      display: inline-flex !important;
      align-items: center !important;
      gap: 6px !important;
      padding: 5px 10px !important;
      border-radius: 6px !important;
      font-size: 11px !important;
      font-weight: 500 !important;
      font-family: inherit !important;
      cursor: pointer !important;
      transition: all 0.15s ease !important;
      user-select: none !important;
    }
    #agentic-sidebar-root:not(.dark) .as-timeline-footer-btn {
      background: #ffffff !important;
      border: 1px solid #e4e4e7 !important;
      color: #18181b !important;
    }
    #agentic-sidebar-root:not(.dark) .as-timeline-footer-btn:hover {
      background: #f4f4f5 !important;
    }
    #agentic-sidebar-root.dark .as-timeline-footer-btn {
      background: #18181b !important;
      border: 1px solid #27272a !important;
      color: #fafafa !important;
    }
    #agentic-sidebar-root.dark .as-timeline-footer-btn:hover {
      background: #27272a !important;
    }
    .as-timeline-footer-btn svg {
      width: 12px !important;
      height: 12px !important;
      color: inherit !important;
    }

    /* Fallback step card (kept clean and neutral) */
    .as-card-step {
      align-self: stretch;
      border-radius: 7px;
      padding: 9px 12px;
      display: flex;
      flex-direction: column;
      gap: 5px;
      font-size: 11.5px;
      line-height: 1.45;
      animation: asFadeUp 0.18s cubic-bezier(0.16, 1, 0.3, 1);
    }
    #agentic-sidebar-root:not(.dark) .as-card-step {
      background: #ffffff;
      border: 1px solid #e4e4e7;
    }
    #agentic-sidebar-root.dark .as-card-step {
      background: #18181b;
      border: 1px solid #27272a;
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

    /* shadcn Badge Primitive - Flat Zinc */
    .as-badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 1.5px 6px;
      border-radius: 4px;
      font-size: 9.5px;
      font-weight: 600;
      letter-spacing: 0.2px;
    }
    #agentic-sidebar-root:not(.dark) .as-badge {
      background: #f4f4f5;
      color: #52525b;
      border: 1px solid #e4e4e7;
    }
    #agentic-sidebar-root.dark .as-badge {
      background: #27272a;
      color: #a1a1aa;
      border: 1px solid #3f3f46;
    }

    .as-badge-plan {
      background: rgba(255, 255, 255, 0.08);
      color: #d4d4d8;
      border: 1px solid rgba(255, 255, 255, 0.12);
    }
    .as-badge-browser {
      background: #f4f4f5 !important;
      color: #18181b !important;
      border: 1px solid #e4e4e7 !important;
    }
    #agentic-sidebar-root.dark .as-badge-browser {
      background: #27272a !important;
      color: #fafafa !important;
      border: 1px solid #3f3f46 !important;
    }
    .as-badge-critique {
      background: rgba(255, 255, 255, 0.08);
      color: #a1a1aa;
      border: 1px solid rgba(255, 255, 255, 0.12);
    }
    .as-badge-done {
      background: rgba(34, 197, 94, 0.12) !important;
      color: #16a34a !important;
      border: 1px solid rgba(34, 197, 94, 0.25) !important;
    }
    #agentic-sidebar-root.dark .as-badge-done {
      color: #4ade80 !important;
    }

    .as-card-body {
      color: inherit;
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

    /* Streaming AI Response Terminal Caret (ChatGPT / Claude style) */
    .as-streaming-cursor {
      display: inline-block !important;
      width: 7px !important;
      height: 14px !important;
      background-color: #f59e0b !important;
      margin-left: 3px !important;
      vertical-align: -1px !important;
      border-radius: 1px !important;
      animation: as-caret-blink 0.75s infinite !important;
    }

    #agentic-sidebar-root.dark .as-streaming-cursor {
      background-color: #facc15 !important;
    }

    @keyframes as-caret-blink {
      0%, 100% {
        opacity: 1;
      }
      50% {
        opacity: 0;
      }
    }

    /* 3. Bottom Action Toolbar */
    .as-ai-toolbar {
      display: flex;
      align-items: center;
      gap: 3px;
      padding: 4px 0 0 2px;
      user-select: none;
      transition: opacity 0.3s ease;
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

    /* Kira Voice Spoken Line Pill (Short, Human Spoken Response indicator) */
    .as-voice-spoken-pill {
      display: inline-flex !important;
      align-items: center !important;
      gap: 6px !important;
      padding: 4px 10px !important;
      margin-bottom: 8px !important;
      border-radius: 9999px !important;
      background: rgba(250, 204, 21, 0.08) !important;
      border: 1px solid rgba(250, 204, 21, 0.22) !important;
      color: #facc15 !important;
      font-size: 11.5px !important;
      font-weight: 450 !important;
      line-height: 1.35 !important;
      max-width: 100% !important;
      box-sizing: border-box !important;
      word-break: break-word !important;
    }

    #agentic-sidebar-root:not(.dark) .as-voice-spoken-pill {
      background: rgba(234, 179, 8, 0.1) !important;
      border-color: rgba(234, 179, 8, 0.3) !important;
      color: #b45309 !important;
    }

    .as-voice-spoken-pill-icon {
      display: inline-flex !important;
      align-items: center !important;
      justify-content: center !important;
      flex-shrink: 0 !important;
      width: 14px !important;
      height: 14px !important;
    }

    .as-voice-spoken-pill-icon svg {
      width: 13px !important;
      height: 13px !important;
    }

    .as-voice-spoken-pill-text {
      font-style: italic !important;
    }


    /* ------------------------------------------------------------------------
       Scholarly Article & Artifact Cards
       ------------------------------------------------------------------------ */
    .as-card-artifact {
      display: flex;
      flex-direction: column;
      gap: 8px;
      padding: 12px 14px;
      margin: 8px 0;
      border-radius: 12px;
      box-sizing: border-box;
      transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
      animation: as-fadeIn 0.2s ease-out forwards;
    }

    #agentic-sidebar-root.dark .as-card-artifact {
      background: #18181b;
      border: 1px solid rgba(255, 255, 255, 0.12);
      box-shadow: 0 4px 14px rgba(0, 0, 0, 0.25);
    }

    #agentic-sidebar-root:not(.dark) .as-card-artifact {
      background: #ffffff;
      border: 1px solid #e4e4e7;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
    }

    .as-card-artifact:hover {
      border-color: rgba(245, 158, 11, 0.45);
      transform: translateY(-1px);
    }

    .as-artifact-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
    }

    .as-artifact-badge {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      padding: 2px 8px;
      border-radius: 9999px;
      font-size: 10.5px;
      font-weight: 600;
      letter-spacing: 0.2px;
      text-transform: uppercase;
      background: rgba(245, 158, 11, 0.15);
      color: #f59e0b;
      border: 1px solid rgba(245, 158, 11, 0.25);
    }

    #agentic-sidebar-root.dark .as-artifact-badge {
      color: #facc15;
      background: rgba(250, 204, 21, 0.12);
      border-color: rgba(250, 204, 21, 0.25);
    }

    .as-artifact-size {
      font-size: 11px;
      color: #71717a;
      font-family: ui-monospace, SFMono-Regular, monospace;
    }

    .as-artifact-title {
      font-size: 13px;
      font-weight: 600;
      line-height: 1.4;
      color: #fafafa;
      word-break: break-word;
    }

    #agentic-sidebar-root:not(.dark) .as-artifact-title {
      color: #09090b;
    }

    .as-artifact-authors {
      font-size: 11.5px;
      color: #a1a1aa;
      line-height: 1.35;
    }

    #agentic-sidebar-root:not(.dark) .as-artifact-authors {
      color: #71717a;
    }

    .as-artifact-meta {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 11px;
      color: #71717a;
    }

    .as-artifact-source-tag {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      color: #d97706;
      font-weight: 500;
    }

    #agentic-sidebar-root.dark .as-artifact-source-tag {
      color: #fde047;
    }

    .as-artifact-actions {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-top: 4px;
      padding-top: 8px;
      border-top: 1px solid rgba(255, 255, 255, 0.08);
    }

    #agentic-sidebar-root:not(.dark) .as-artifact-actions {
      border-top-color: #f4f4f5;
    }

    .as-artifact-btn {
      all: initial;
      display: inline-flex;
      align-items: center;
      gap: 5px;
      padding: 5px 10px;
      border-radius: 6px;
      font-size: 11.5px;
      font-weight: 500;
      font-family: var(--font-sans);
      cursor: pointer;
      transition: all 0.15s ease;
      box-sizing: border-box;
      user-select: none;
    }

    .as-artifact-open-btn {
      background: #f59e0b;
      color: #000000;
      font-weight: 600;
    }

    .as-artifact-open-btn:hover {
      background: #fbbf24;
      box-shadow: 0 2px 8px rgba(245, 158, 11, 0.35);
    }

    .as-artifact-open-btn:active {
      transform: scale(0.97);
    }

    .as-artifact-reveal-btn {
      background: rgba(255, 255, 255, 0.08);
      color: #e4e4e7;
      border: 1px solid rgba(255, 255, 255, 0.12);
    }

    #agentic-sidebar-root:not(.dark) .as-artifact-reveal-btn {
      background: #f4f4f5;
      color: #27272a;
      border-color: #e4e4e7;
    }

    .as-artifact-reveal-btn:hover {
      background: rgba(255, 255, 255, 0.15);
      color: #ffffff;
    }

    #agentic-sidebar-root:not(.dark) .as-artifact-reveal-btn:hover {
      background: #e4e4e7;
      color: #09090b;
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
      box-shadow: none !important;
      border: 1px solid rgba(255, 255, 255, 0.12) !important;
      padding: 10px 12px 10px 12px !important;
      transition: border-color 0.2s ease, background 0.2s ease !important;
      box-sizing: border-box !important;
      width: 100% !important;
      min-height: 88px !important;
      cursor: text !important;
      pointer-events: auto !important;
    }

    #agentic-sidebar-root.dark .as-voxle-card {
      background: #18181b !important;
      border-color: rgba(255, 255, 255, 0.15) !important;
      box-shadow: none !important;
    }

    .as-voxle-card:focus-within {
      box-shadow: none !important;
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
      pointer-events: auto !important;
      cursor: text !important;
      user-select: text !important;
      -webkit-user-select: text !important;
    }

    .as-voxle-textarea::-webkit-scrollbar {
      display: none !important;
      width: 0 !important;
      height: 0 !important;
    }

    .as-voxle-textarea::placeholder {
      color: #71717a !important;
      user-select: none !important;
    }

    /* Bottom Action Toolbar inside the card */
    .as-voxle-toolbar {
      display: flex !important;
      align-items: center !important;
      justify-content: space-between !important;
      margin-top: 6px !important;
      padding-top: 4px !important;
      cursor: default !important;
      pointer-events: auto !important;
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
      height: 26px !important;
      box-sizing: border-box !important;
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

    /* ------------------------------------------------------------------------
       Visual Marks Toggle Switch (Beside Model Selection Component)
       ------------------------------------------------------------------------ */
    .as-som-switch {
      all: initial !important;
      position: relative !important;
      display: inline-flex !important;
      align-items: center !important;
      width: 44px !important;
      height: 26px !important;
      padding: 2px !important;
      border-radius: 6px !important;
      background: #27272a !important;
      border: 1px solid rgba(255, 255, 255, 0.12) !important;
      cursor: pointer !important;
      box-sizing: border-box !important;
      transition: background-color 0.2s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.2s ease !important;
      user-select: none !important;
      flex-shrink: 0 !important;
    }

    .as-som-switch:hover {
      border-color: rgba(255, 255, 255, 0.25) !important;
    }

    .as-som-switch.active {
      background: #facc15 !important;
      border-color: #eab308 !important;
    }

    .as-som-switch-thumb {
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      width: 20px !important;
      height: 20px !important;
      border-radius: 4px !important;
      background: #52525b !important;
      color: #ffffff !important;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3) !important;
      transform: translateX(0px) !important;
      transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), background-color 0.2s ease, color 0.2s ease !important;
      box-sizing: border-box !important;
    }

    .as-som-switch.active .as-som-switch-thumb {
      background: #09090b !important;
      color: #facc15 !important;
      transform: translateX(18px) !important;
    }

    /* Crimson Recording-Red Active State for Kira Voice Mic Switch (Strictly no glow) */
    .as-som-switch.as-voice-switch.active,
    #agentic-sidebar-root.dark .as-som-switch.as-voice-switch.active,
    #agentic-sidebar-root:not(.dark) .as-som-switch.as-voice-switch.active {
      background: #ef4444 !important;
      border-color: #dc2626 !important;
      box-shadow: none !important;
      outline: none !important;
    }

    .as-som-switch.as-voice-switch.active .as-som-switch-thumb,
    #agentic-sidebar-root.dark .as-som-switch.as-voice-switch.active .as-som-switch-thumb,
    #agentic-sidebar-root:not(.dark) .as-som-switch.as-voice-switch.active .as-som-switch-thumb {
      background: #ffffff !important;
      color: #ef4444 !important;
      transform: translateX(18px) !important;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3) !important;
    }

    .as-som-switch.as-voice-switch:focus,
    .as-som-switch.as-voice-switch:focus-visible,
    .as-som-switch.as-voice-switch:hover,
    .as-som-switch.as-voice-switch.active:hover,
    .as-som-switch.as-voice-switch.active:focus {
      box-shadow: none !important;
      outline: none !important;
    }

    /* ------------------------------------------------------------------------
       Floating Bottom-Center Natural Audio Wave Widget (Professional & Consistent)
       ------------------------------------------------------------------------ */
    #as-voice-floating-widget {
      position: fixed !important;
      bottom: 24px !important;
      left: 50% !important;
      transform: translateX(-50%) translateY(0) !important;
      z-index: 2147483640 !important;
      pointer-events: auto !important;
      display: none;
      align-items: center !important;
      gap: 10px !important;
      padding: 6px 12px !important;
      border-radius: calc(var(--radius) - 4px) !important; /* Strict 8px global standard */
      background: #18181b !important;
      border: 1px solid #27272a !important;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.45) !important;
      color: #fafafa !important;
      font-family: var(--font-sans) !important;
      user-select: none !important;
      transition: opacity 0.2s cubic-bezier(0.16, 1, 0.3, 1), transform 0.2s cubic-bezier(0.16, 1, 0.3, 1) !important;
      animation: asFloatWidgetIn 0.24s cubic-bezier(0.16, 1, 0.3, 1) forwards !important;
      box-sizing: border-box !important;
    }

    @keyframes asFloatWidgetIn {
      from {
        opacity: 0;
        transform: translateX(-50%) translateY(16px) scale(0.96);
      }
      to {
        opacity: 1;
        transform: translateX(-50%) translateY(0) scale(1);
      }
    }

    .as-float-mic-btn {
      width: 26px !important;
      height: 26px !important;
      border-radius: calc(var(--radius) - 6px) !important; /* Strict 6px control radius */
      background: #27272a !important;
      border: 1px solid #3f3f46 !important;
      color: #ef4444 !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      flex-shrink: 0 !important;
      animation: none !important;
      box-shadow: none !important;
      cursor: default !important;
      pointer-events: none !important;
      box-sizing: border-box !important;
    }

    .as-float-mic-btn svg {
      width: 13px !important;
      height: 13px !important;
    }

    .as-float-info {
      display: flex !important;
      flex-direction: column !important;
      justify-content: center !important;
      line-height: 1.25 !important;
    }

    .as-float-title {
      font-size: 11.5px !important;
      font-weight: 550 !important;
      color: #fafafa !important;
      letter-spacing: 0.1px !important;
    }

    .as-float-status {
      font-size: 10px !important;
      color: #71717a !important;
      white-space: nowrap !important;
    }

    .as-float-canvas-wrapper {
      display: flex !important;
      align-items: center !important;
      height: 26px !important;
      padding: 0 2px !important;
    }

    #as-float-wave-canvas {
      display: block !important;
      width: 100px !important;
      height: 24px !important;
      border-radius: 4px !important;
    }

    .as-float-close-btn {
      all: initial !important;
      width: 20px !important;
      height: 20px !important;
      border-radius: 4px !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      cursor: pointer !important;
      color: #71717a !important;
      transition: all 0.15s ease !important;
      box-sizing: border-box !important;
    }

    .as-float-close-btn:hover {
      color: #fafafa !important;
      background: #27272a !important;
    }

    .as-float-close-btn svg {
      width: 10px !important;
      height: 10px !important;
    }

    .as-som-switch-icon {
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      width: 12px !important;
      height: 12px !important;
    }

    .as-som-switch-icon svg {
      width: 12px !important;
      height: 12px !important;
      stroke-width: 2.2 !important;
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
      min-width: 235px !important;
      max-width: 290px !important;
      background: #18181b !important;
      border: 1px solid #27272a !important;
      border-radius: 8px !important;
      box-shadow: 0 16px 36px -4px rgba(0, 0, 0, 0.6), 0 4px 12px rgba(0, 0, 0, 0.4) !important;
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
      font-size: 10.5px !important;
      font-weight: 600 !important;
      text-transform: uppercase !important;
      letter-spacing: 0.5px !important;
      color: #a1a1aa !important;
      padding: 6px 8px 4px 8px !important;
      user-select: none !important;
    }

    .as-select-item {
      display: flex !important;
      align-items: center !important;
      justify-content: space-between !important;
      padding: 7px 9px !important;
      border-radius: 6px !important;
      cursor: pointer !important;
      color: #fafafa !important;
      background: transparent !important;
      border: 1px solid transparent !important;
      transition: all 0.15s ease !important;
      user-select: none !important;
      gap: 8px !important;
      box-sizing: border-box !important;
    }

    .as-select-item:hover {
      background: #27272a !important;
      color: #ffffff !important;
    }

    .as-select-item.selected {
      background: rgba(250, 204, 21, 0.12) !important;
      border: 1px solid rgba(250, 204, 21, 0.28) !important;
      color: #facc15 !important;
      font-weight: 500 !important;
    }

    .as-select-item.selected:hover {
      background: rgba(250, 204, 21, 0.18) !important;
      border-color: rgba(250, 204, 21, 0.4) !important;
    }

    .as-select-item-info {
      display: flex !important;
      flex-direction: column !important;
      gap: 2px !important;
    }

    .as-select-item-title {
      font-size: 12.5px !important;
      line-height: 1.3 !important;
      color: inherit !important;
    }

    .as-select-item-sub {
      font-size: 10px !important;
      color: #71717a !important;
      line-height: 1.2 !important;
    }

    .as-select-item:hover .as-select-item-sub {
      color: #a1a1aa !important;
    }

    .as-select-item.selected .as-select-item-sub {
      color: #eab308 !important;
    }

    .as-select-check {
      display: none !important;
      align-items: center !important;
      justify-content: center !important;
      color: #facc15 !important;
      flex-shrink: 0 !important;
      width: 16px !important;
      height: 16px !important;
    }

    .as-select-check svg {
      width: 14px !important;
      height: 14px !important;
      stroke-width: 2.4 !important;
    }

    .as-select-item.selected .as-select-check {
      display: flex !important;
    }

    .as-select-divider {
      height: 1px !important;
      background: rgba(255, 255, 255, 0.08) !important;
      margin: 4px 2px !important;
    }

    .as-select-manage-btn {
      all: initial !important;
      width: 100% !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      gap: 7px !important;
      padding: 7px 10px !important;
      border-radius: 6px !important;
      font-size: 11.5px !important;
      font-weight: 500 !important;
      font-family: var(--font-sans) !important;
      cursor: pointer !important;
      color: #d4d4d8 !important;
      background: rgba(255, 255, 255, 0.05) !important;
      border: 1px solid rgba(255, 255, 255, 0.08) !important;
      box-sizing: border-box !important;
      transition: all 0.15s ease !important;
    }

    .as-select-manage-btn:hover {
      background: rgba(255, 255, 255, 0.1) !important;
      color: #ffffff !important;
      border-color: rgba(255, 255, 255, 0.16) !important;
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
      border-radius: 8px !important;
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

    /* ------------------------------------------------------------------------
       Kira Voice & Speech Controls (STT Mic & TTS Waveform)
       ------------------------------------------------------------------------ */
    .as-voxle-mic-btn {
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
      border: 1px solid transparent !important;
      transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1) !important;
      box-sizing: border-box !important;
    }

    .as-voxle-mic-btn:hover {
      color: #fafafa !important;
      background: rgba(255, 255, 255, 0.1) !important;
      border-color: rgba(255, 255, 255, 0.15) !important;
    }

    .as-voxle-mic-btn.as-listening {
      background: #ef4444 !important;
      color: #ffffff !important;
      border-color: #f87171 !important;
      animation: as-mic-pulse 1.4s infinite !important;
    }

    @keyframes as-mic-pulse {
      0% {
        box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.6);
        transform: scale(1);
      }
      50% {
        box-shadow: 0 0 0 7px rgba(239, 68, 68, 0);
        transform: scale(1.08);
      }
      100% {
        box-shadow: 0 0 0 0 rgba(239, 68, 68, 0);
        transform: scale(1);
      }
    }

    /* Speaking Toolbar Button on AI bubbles */
    .as-ai-tool-btn.as-btn-speak.as-speaking {
      color: #10b981 !important;
      background: rgba(16, 185, 129, 0.15) !important;
      border-color: rgba(16, 185, 129, 0.3) !important;
      animation: as-speak-bounce 0.8s infinite alternate ease-in-out !important;
    }

    @keyframes as-speak-bounce {
      from { transform: scale(0.96); }
      to { transform: scale(1.06); }
    }

    /* Range Slider Styling for Voice Speed */
    .as-range-slider {
      -webkit-appearance: none !important;
      appearance: none !important;
      height: 5px !important;
      border-radius: 4px !important;
      background: rgba(255, 255, 255, 0.14) !important;
      outline: none !important;
      cursor: pointer !important;
      transition: background 0.2s ease !important;
    }

    .as-range-slider::-webkit-slider-thumb {
      -webkit-appearance: none !important;
      appearance: none !important;
      width: 15px !important;
      height: 15px !important;
      border-radius: 50% !important;
      background: #facc15 !important;
      cursor: pointer !important;
      transition: transform 0.1s ease !important;
    }

    .as-range-slider::-webkit-slider-thumb:hover {
      transform: scale(1.2) !important;
    }

    .as-input-hint {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 10px;
      color: hsl(var(--muted-foreground));
      padding: 6px 6px 0 6px;
    }

    /* ------------------------------------------------------------------------
       View Architecture: Same Space Switching (#as-view-chat vs #as-view-settings)
       ------------------------------------------------------------------------ */
    .as-view-chat,
    .as-view-settings {
      display: flex;
      flex-direction: column;
      flex: 1 1 auto;
      min-height: 0;
      overflow: hidden;
      width: 100%;
      height: 100%;
      box-sizing: border-box;
    }

    /* ------------------------------------------------------------------------
       High-Contrast Theme System: Pure White & Deep Dark
       ------------------------------------------------------------------------ */
    /* Light Theme (Strictly Pure White, Zinc-200 Borders, Zinc-950 Text) */
    #agentic-sidebar-root:not(.dark) {
      background-color: #ffffff !important;
      border-left: 1px solid #e4e4e7 !important;
      border-top: none !important;
      border-right: none !important;
      border-bottom: none !important;
      border-radius: 0px !important;
      color: #09090b !important;
      box-shadow: none !important;
      padding: 0 !important;
    }
    #agentic-sidebar-root:not(.dark) .as-inner-container {
      background-color: #ffffff !important;
      border: none !important;
      border-radius: 0px !important;
      box-shadow: none !important;
    }
    #agentic-rail-root:not(.dark) {
      background-color: #ffffff !important;
      border-left: 1px solid #e4e4e7 !important;
      border-top: none !important;
      border-right: none !important;
      border-bottom: none !important;
      border-radius: 0px !important;
      color: #09090b !important;
      box-shadow: none !important;
    }
    #agentic-sidebar-root:not(.dark) .as-header {
      background: #ffffff !important;
      border-bottom: 1px solid #e4e4e7 !important;
    }
    #agentic-sidebar-root:not(.dark) .as-header-title-btn {
      color: #09090b !important;
      background: transparent !important;
      border: 1px solid transparent !important;
    }
    #agentic-sidebar-root:not(.dark) .as-header-title-btn:hover {
      background: #f4f4f5 !important;
      color: #09090b !important;
    }
    #agentic-sidebar-root:not(.dark) .as-header-title {
      color: #09090b !important;
    }
    #agentic-sidebar-root:not(.dark) .as-icon-btn {
      color: #71717a !important;
    }
    #agentic-sidebar-root:not(.dark) .as-icon-btn:hover {
      color: #09090b !important;
      background: #f4f4f5 !important;
    }
    #agentic-sidebar-root:not(.dark) .as-status-bar {
      background: #fafafa !important;
      border-bottom: 1px solid #e4e4e7 !important;
      color: #71717a !important;
    }
    #agentic-sidebar-root:not(.dark) .as-content-area {
      background: transparent !important;
    }
    #agentic-sidebar-root:not(.dark) .as-voxle-card {
      background: #ffffff !important;
      border: 1px solid #e4e4e7 !important;
      box-shadow: none !important;
    }
    #agentic-sidebar-root:not(.dark) .as-voxle-textarea {
      color: #09090b !important;
    }
    #agentic-sidebar-root:not(.dark) .as-voxle-textarea::placeholder {
      color: #a1a1aa !important;
    }
    #agentic-sidebar-root:not(.dark) .as-shadcn-select-trigger {
      background: #f4f4f5 !important;
      border: 1px solid #e4e4e7 !important;
      color: #09090b !important;
    }
    #agentic-sidebar-root:not(.dark) .as-shadcn-select-trigger:hover {
      background: #e4e4e7 !important;
    }
    #agentic-sidebar-root:not(.dark) .as-shadcn-select-popover {
      background: #ffffff !important;
      border: 1px solid #e4e4e7 !important;
      border-radius: 8px !important;
      box-shadow: 0 10px 25px -4px rgba(0, 0, 0, 0.08), 0 4px 10px -2px rgba(0, 0, 0, 0.04) !important;
      color: #09090b !important;
    }
    #agentic-sidebar-root:not(.dark) .as-select-label {
      color: #71717a !important;
    }
    #agentic-sidebar-root:not(.dark) .as-select-item {
      color: #09090b !important;
      border-radius: 6px !important;
      background: transparent !important;
      border: 1px solid transparent !important;
    }
    #agentic-sidebar-root:not(.dark) .as-select-item:hover {
      background: #f4f4f5 !important;
      color: #09090b !important;
    }
    #agentic-sidebar-root:not(.dark) .as-select-item.selected {
      background: #fef9c3 !important;
      border: 1px solid #fef08a !important;
      color: #854d0e !important;
    }
    #agentic-sidebar-root:not(.dark) .as-select-item.selected:hover {
      background: #fef08a !important;
      border-color: #fde047 !important;
      color: #713f12 !important;
    }
    #agentic-sidebar-root:not(.dark) .as-select-item-title {
      color: inherit !important;
    }
    #agentic-sidebar-root:not(.dark) .as-select-item-sub {
      color: #71717a !important;
    }
    #agentic-sidebar-root:not(.dark) .as-select-item.selected .as-select-item-sub {
      color: #a16207 !important;
    }
    #agentic-sidebar-root:not(.dark) .as-select-check {
      color: #ca8a04 !important;
    }
    #agentic-sidebar-root:not(.dark) .as-select-divider {
      background: #e4e4e7 !important;
    }
    #agentic-sidebar-root:not(.dark) .as-select-manage-btn {
      background: #f4f4f5 !important;
      border: 1px solid #e4e4e7 !important;
      color: #18181b !important;
    }
    #agentic-sidebar-root:not(.dark) .as-select-manage-btn:hover {
      background: #e4e4e7 !important;
      color: #000000 !important;
      border-color: #d4d4d8 !important;
    }
    #agentic-sidebar-root:not(.dark) .as-nim-status-pill {
      background: #f4f4f5 !important;
      border: 1px solid #e4e4e7 !important;
      color: #09090b !important;
    }
    #agentic-sidebar-root:not(.dark) .as-nim-status-pill.inactive {
      background: transparent !important;
      border-color: #e4e4e7 !important;
      color: #a1a1aa !important;
    }
    #agentic-sidebar-root:not(.dark) .as-som-switch {
      background: #e4e4e7 !important;
      border: 1px solid #d4d4d8 !important;
    }
    #agentic-sidebar-root:not(.dark) .as-som-switch:hover {
      border-color: #a1a1aa !important;
    }
    #agentic-sidebar-root:not(.dark) .as-som-switch.active:not(.as-voice-switch) {
      background: #facc15 !important;
      border-color: #eab308 !important;
    }
    #agentic-sidebar-root:not(.dark) .as-som-switch-thumb {
      background: #ffffff !important;
      color: #71717a !important;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15) !important;
    }
    #agentic-sidebar-root:not(.dark) .as-som-switch.active .as-som-switch-thumb {
      background: #ffffff !important;
      color: #f59e0b !important;
    }

    /* Dark Theme (Pure Deep Dark Zinc-950) */
    #agentic-sidebar-root.dark {
      background-color: #09090b !important;
      border-left: 1px solid #27272a !important;
      border-top: none !important;
      border-right: none !important;
      border-bottom: none !important;
      border-radius: 0px !important;
      color: #fafafa !important;
      box-shadow: none !important;
      padding: 0 !important;
    }
    #agentic-sidebar-root.dark .as-inner-container {
      background-color: #09090b !important;
      border: none !important;
      border-radius: 0px !important;
      box-shadow: none !important;
    }
    #agentic-rail-root.dark {
      background-color: #09090b !important;
      border-left: 1px solid #27272a !important;
      border-top: none !important;
      border-right: none !important;
      border-bottom: none !important;
      border-radius: 0px !important;
      color: #fafafa !important;
      box-shadow: none !important;
    }
    #agentic-sidebar-root.dark .as-header {
      background: #09090b !important;
      border-bottom: 1px solid #27272a !important;
    }
    #agentic-sidebar-root.dark .as-header-title-btn {
      color: #fafafa !important;
      background: transparent !important;
      border: 1px solid transparent !important;
    }
    #agentic-sidebar-root.dark .as-header-title-btn:hover {
      background: #27272a !important;
      color: #fafafa !important;
    }
    #agentic-sidebar-root.dark .as-status-bar {
      background: #121215 !important;
      border-bottom: 1px solid #27272a !important;
      color: #a1a1aa !important;
    }
    #agentic-sidebar-root.dark .as-content-area {
      background: transparent !important;
    }
    #agentic-sidebar-root.dark .as-voxle-card {
      background: #121215 !important;
      border: 1px solid #27272a !important;
      box-shadow: none !important;
    }
    #agentic-sidebar-root.dark .as-som-switch {
      background: #27272a !important;
      border: 1px solid rgba(255, 255, 255, 0.12) !important;
    }
    #agentic-sidebar-root.dark .as-som-switch.active:not(.as-voice-switch) {
      background: #facc15 !important;
      border-color: #eab308 !important;
    }

    /* ------------------------------------------------------------------------
       Universal Multi-Provider Settings Hub Styling (Aceternity / shadcn)
       ------------------------------------------------------------------------ */
    .as-view-chat,
    .as-view-settings {
      display: none !important;
      flex-direction: column !important;
      flex: 1 1 auto !important;
      width: 100% !important;
      height: 100% !important;
      min-height: 0 !important;
      overflow: hidden !important;
      background: inherit !important;
    }

    .as-view-chat.active,
    .as-view-settings.active {
      display: flex !important;
    }

    .as-settings-topbar {
      display: flex !important;
      align-items: center !important;
      justify-content: space-between !important;
      padding: 10px 14px !important;
      flex-shrink: 0 !important;
      gap: 10px !important;
    }
    #agentic-sidebar-root:not(.dark) .as-settings-topbar {
      border-bottom: 1px solid #e4e4e7 !important;
      background: #ffffff !important;
    }
    #agentic-sidebar-root.dark .as-settings-topbar {
      border-bottom: 1px solid #27272a !important;
      background: #09090b !important;
    }

    .as-btn-back {
      all: initial !important;
      display: inline-flex !important;
      align-items: center !important;
      gap: 5px !important;
      padding: 5px 9px !important;
      border-radius: 6px !important;
      cursor: pointer !important;
      font-size: 11.5px !important;
      font-weight: 500 !important;
      font-family: var(--font-sans) !important;
      transition: all 0.15s ease !important;
    }
    #agentic-sidebar-root:not(.dark) .as-btn-back {
      background: #f4f4f5 !important;
      color: #09090b !important;
      border: 1px solid #e4e4e7 !important;
    }
    #agentic-sidebar-root:not(.dark) .as-btn-back:hover {
      background: #e4e4e7 !important;
    }
    #agentic-sidebar-root.dark .as-btn-back {
      background: #18181b !important;
      color: #fafafa !important;
      border: 1px solid #27272a !important;
    }
    #agentic-sidebar-root.dark .as-btn-back:hover {
      background: #27272a !important;
      color: #fafafa !important;
    }

    .as-settings-topbar-title {
      font-size: 12.5px !important;
      font-weight: 600 !important;
      letter-spacing: -0.2px !important;
      color: inherit !important;
      flex: 1 1 auto !important;
      text-align: center !important;
    }

    .as-settings-topbar-actions {
      display: flex !important;
      align-items: center !important;
      gap: 6px !important;
    }

    .as-settings-hub-badge {
      display: inline-flex !important;
      align-items: center !important;
      gap: 4px !important;
      font-size: 9.5px !important;
      font-weight: 600 !important;
      padding: 2.5px 7px !important;
      border-radius: 9999px !important;
    }
    #agentic-sidebar-root:not(.dark) .as-settings-hub-badge {
      background: #f4f4f5 !important;
      color: #52525b !important;
      border: 1px solid #e4e4e7 !important;
    }
    #agentic-sidebar-root.dark .as-settings-hub-badge {
      background: #27272a !important;
      color: #a1a1aa !important;
      border: 1px solid #3f3f46 !important;
    }

    /* Tab Navigation Bar */
    .as-settings-tabs-bar {
      display: flex !important;
      align-items: center !important;
      gap: 4px !important;
      padding: 6px 12px !important;
      flex-shrink: 0 !important;
    }
    #agentic-sidebar-root:not(.dark) .as-settings-tabs-bar {
      background: #f4f4f5 !important;
      border-bottom: 1px solid #e4e4e7 !important;
    }
    #agentic-sidebar-root.dark .as-settings-tabs-bar {
      background: #121215 !important;
      border-bottom: 1px solid #27272a !important;
    }

    .as-settings-tab {
      all: initial !important;
      display: inline-flex !important;
      align-items: center !important;
      gap: 5px !important;
      padding: 5px 10px !important;
      border-radius: 6px !important;
      font-size: 11px !important;
      font-weight: 500 !important;
      font-family: var(--font-sans) !important;
      cursor: pointer !important;
      color: #71717a !important;
      transition: all 0.15s ease !important;
      position: relative !important;
    }
    .as-settings-tab:hover {
      color: inherit !important;
      background: rgba(255, 255, 255, 0.04) !important;
    }
    .as-settings-tab.active {
      font-weight: 600 !important;
    }
    #agentic-sidebar-root:not(.dark) .as-settings-tab.active {
      background: #ffffff !important;
      color: #09090b !important;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05) !important;
    }
    #agentic-sidebar-root.dark .as-settings-tab.active {
      background: #27272a !important;
      color: #fafafa !important;
    }

    .as-tab-badge {
      display: inline-flex !important;
      align-items: center !important;
      justify-content: center !important;
      min-width: 15px !important;
      height: 15px !important;
      padding: 0 4px !important;
      border-radius: 9999px !important;
      font-size: 9px !important;
      font-weight: 700 !important;
    }
    #agentic-sidebar-root:not(.dark) .as-tab-badge {
      background: #e4e4e7 !important;
      color: #52525b !important;
    }
    #agentic-sidebar-root:not(.dark) .as-settings-tab.active .as-tab-badge {
      background: #18181b !important;
      color: #fafafa !important;
    }
    #agentic-sidebar-root.dark .as-tab-badge {
      background: #27272a !important;
      color: #a1a1aa !important;
    }
    #agentic-sidebar-root.dark .as-settings-tab.active .as-tab-badge {
      background: #3f3f46 !important;
      color: #fafafa !important;
    }

    /* Scrollable Area */
    .as-settings-scroll-area {
      flex: 1 1 auto !important;
      overflow-y: auto !important;
      overflow-x: hidden !important;
      padding: 14px !important;
      display: flex !important;
      flex-direction: column !important;
      gap: 14px !important;
      box-sizing: border-box !important;
      width: 100% !important;
      max-width: 100% !important;
    }

    .as-settings-tab-page {
      display: none !important;
      flex-direction: column !important;
      width: 100% !important;
      min-width: 0 !important;
      box-sizing: border-box !important;
      gap: 12px !important;
    }

    .as-settings-tab-page.active {
      display: flex !important;
    }

    .as-section-header {
      display: flex !important;
      flex-direction: column !important;
      gap: 3px !important;
      margin-bottom: 2px !important;
    }

    .as-section-title {
      font-size: 12.5px !important;
      font-weight: 600 !important;
      letter-spacing: -0.2px !important;
      color: inherit !important;
    }

    .as-section-sub {
      font-size: 10.5px !important;
      color: #71717a !important;
      line-height: 1.4 !important;
    }

    /* Master-Detail AI Provider Hub (Aceternity / shadcn) */
    .as-providers-hub-view {
      display: flex !important;
      flex-direction: column !important;
      gap: 12px !important;
      width: 100% !important;
      box-sizing: border-box !important;
      animation: as-fade-in 0.2s cubic-bezier(0.16, 1, 0.3, 1) !important;
    }



    /* Section Header Details */
    .as-section-title-row {
      display: flex !important;
      align-items: center !important;
      justify-content: space-between !important;
      width: 100% !important;
    }
    .as-provider-count-pill {
      font-size: 9px !important;
      font-weight: 500 !important;
      padding: 2px 7px !important;
      border-radius: 4px !important;
    }
    #agentic-sidebar-root:not(.dark) .as-provider-count-pill {
      background: #f4f4f5 !important;
      color: #71717a !important;
      border: 1px solid #e4e4e7 !important;
    }
    #agentic-sidebar-root.dark .as-provider-count-pill {
      background: #18181b !important;
      color: #a1a1aa !important;
      border: 1px solid #27272a !important;
    }

    /* Provider Accordion Directory List (shadcn Accordion - Flat, Consistent) */
    .as-providers-bento-grid {
      display: flex !important;
      flex-direction: column !important;
      gap: 7px !important;
      width: 100% !important;
      box-sizing: border-box !important;
    }

    .as-provider-accordion-item {
      display: flex !important;
      flex-direction: column !important;
      width: 100% !important;
      box-sizing: border-box !important;
      border-radius: 8px !important;
      overflow: hidden !important;
      transition: border-color 0.25s cubic-bezier(0.16, 1, 0.3, 1), background 0.25s ease !important;
    }
    #agentic-sidebar-root:not(.dark) .as-provider-accordion-item {
      background: #ffffff !important;
      border: 1px solid #e4e4e7 !important;
    }
    #agentic-sidebar-root:not(.dark) .as-provider-accordion-item.open {
      border-color: #a1a1aa !important;
    }
    #agentic-sidebar-root.dark .as-provider-accordion-item {
      background: #18181b !important;
      border: 1px solid #27272a !important;
    }
    #agentic-sidebar-root.dark .as-provider-accordion-item.open {
      border-color: #3f3f46 !important;
    }

    .as-accordion-header {
      all: initial !important;
      display: flex !important;
      align-items: center !important;
      justify-content: space-between !important;
      box-sizing: border-box !important;
      padding: 9px 12px !important;
      cursor: pointer !important;
      font-family: var(--font-sans) !important;
      width: 100% !important;
      gap: 10px !important;
      user-select: none !important;
      transition: background 0.15s ease !important;
    }
    #agentic-sidebar-root:not(.dark) .as-accordion-header {
      background: #ffffff !important;
      color: #09090b !important;
    }
    #agentic-sidebar-root:not(.dark) .as-accordion-header:hover {
      background: #f4f4f5 !important;
    }
    #agentic-sidebar-root.dark .as-accordion-header {
      background: #18181b !important;
      color: #fafafa !important;
    }
    #agentic-sidebar-root.dark .as-accordion-header:hover {
      background: #27272a !important;
    }

    .as-bento-left {
      display: flex !important;
      align-items: center !important;
      gap: 10px !important;
      min-width: 0 !important;
      flex: 1 1 auto !important;
    }
    .as-bento-icon-wrapper {
      width: 28px !important;
      height: 28px !important;
      border-radius: 6px !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      flex-shrink: 0 !important;
    }
    #agentic-sidebar-root:not(.dark) .as-bento-icon-wrapper {
      background: #f4f4f5 !important;
      border: 1px solid #e4e4e7 !important;
      color: #09090b !important;
    }
    #agentic-sidebar-root.dark .as-bento-icon-wrapper {
      background: #27272a !important;
      border: 1px solid #3f3f46 !important;
      color: #fafafa !important;
    }

    .as-bento-body {
      display: flex !important;
      flex-direction: column !important;
      gap: 1.5px !important;
      min-width: 0 !important;
      flex: 1 1 auto !important;
    }
    .as-bento-title-row {
      display: flex !important;
      align-items: center !important;
      gap: 6px !important;
    }
    .as-bento-title {
      font-size: 11.5px !important;
      font-weight: 600 !important;
      color: inherit !important;
      white-space: nowrap !important;
      overflow: hidden !important;
      text-overflow: ellipsis !important;
    }
    .as-bento-desc {
      font-size: 9.5px !important;
      color: #71717a !important;
      white-space: nowrap !important;
      overflow: hidden !important;
      text-overflow: ellipsis !important;
      line-height: 1.3 !important;
    }
    #agentic-sidebar-root.dark .as-bento-desc {
      color: #a1a1aa !important;
    }

    .as-bento-right {
      display: flex !important;
      align-items: center !important;
      gap: 8px !important;
      flex-shrink: 0 !important;
    }
    .as-bento-chevron {
      color: #71717a !important;
      display: flex !important;
      align-items: center !important;
      transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), color 0.15s ease !important;
    }
    .as-provider-accordion-item.open .as-bento-chevron {
      transform: rotate(90deg) !important;
      color: inherit !important;
    }
    #agentic-sidebar-root:not(.dark) .as-accordion-header:hover .as-bento-chevron {
      color: #09090b !important;
    }
    #agentic-sidebar-root.dark .as-accordion-header:hover .as-bento-chevron {
      color: #fafafa !important;
    }

    .as-bento-status-pill {
      display: inline-flex !important;
      align-items: center !important;
      gap: 4px !important;
      font-size: 9px !important;
      font-weight: 500 !important;
      padding: 1.5px 6px !important;
      border-radius: 4px !important;
    }
    #agentic-sidebar-root:not(.dark) .as-bento-status-pill.connected {
      color: #15803d !important;
      background: #f0fdf4 !important;
      border: 1px solid #bbf7d0 !important;
    }
    #agentic-sidebar-root.dark .as-bento-status-pill.connected {
      color: #4ade80 !important;
      background: rgba(34, 197, 94, 0.12) !important;
      border: 1px solid rgba(34, 197, 94, 0.25) !important;
    }
    #agentic-sidebar-root:not(.dark) .as-bento-status-pill.ready {
      color: #1d4ed8 !important;
      background: #eff6ff !important;
      border: 1px solid #bfdbfe !important;
    }
    #agentic-sidebar-root.dark .as-bento-status-pill.ready {
      color: #60a5fa !important;
      background: rgba(59, 130, 246, 0.12) !important;
      border: 1px solid rgba(59, 130, 246, 0.25) !important;
    }
    #agentic-sidebar-root:not(.dark) .as-bento-status-pill.unconfigured {
      color: #71717a !important;
      background: #f4f4f5 !important;
      border: 1px solid #e4e4e7 !important;
    }
    #agentic-sidebar-root.dark .as-bento-status-pill.unconfigured {
      color: #a1a1aa !important;
      background: #27272a !important;
      border: 1px solid #3f3f46 !important;
    }
    .as-bento-status-dot {
      width: 4px !important;
      height: 4px !important;
      border-radius: 50% !important;
      background: #10b981 !important;
      box-shadow: none !important;
      display: inline-block !important;
    }

    /* Accordion Collapse & Drawer (Smooth CSS Grid Animation) */
    .as-accordion-collapse {
      display: grid !important;
      grid-template-rows: 0fr !important;
      transition: grid-template-rows 0.3s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.25s cubic-bezier(0.16, 1, 0.3, 1), visibility 0.3s !important;
      opacity: 0 !important;
      overflow: hidden !important;
      visibility: hidden !important;
      width: 100% !important;
      box-sizing: border-box !important;
      will-change: grid-template-rows, opacity !important;
    }
    .as-provider-accordion-item.open .as-accordion-collapse {
      grid-template-rows: 1fr !important;
      opacity: 1 !important;
      visibility: visible !important;
    }

    .as-accordion-drawer {
      min-height: 0 !important;
      overflow: hidden !important;
      display: flex !important;
      flex-direction: column !important;
      gap: 12px !important;
      padding: 12px 14px 14px 14px !important;
      box-sizing: border-box !important;
      width: 100% !important;
    }
    #agentic-sidebar-root:not(.dark) .as-accordion-drawer {
      background: #fafafa !important;
      border-top: 1px solid #e4e4e7 !important;
    }
    #agentic-sidebar-root.dark .as-accordion-drawer {
      background: #121215 !important;
      border-top: 1px solid #27272a !important;
    }

    .as-settings-field {
      display: flex !important;
      flex-direction: column !important;
      gap: 5px !important;
      width: 100% !important;
    }

    .as-field-label-row {
      display: flex !important;
      align-items: center !important;
      justify-content: space-between !important;
      width: 100% !important;
    }

    .as-settings-label {
      font-size: 11px !important;
      font-weight: 600 !important;
      color: inherit !important;
      letter-spacing: 0.1px !important;
    }

    .as-link-get-key {
      display: inline-flex !important;
      align-items: center !important;
      gap: 3px !important;
      font-size: 10px !important;
      cursor: pointer !important;
      text-decoration: underline !important;
      text-underline-offset: 2px !important;
      transition: color 0.15s ease !important;
    }
    #agentic-sidebar-root:not(.dark) .as-link-get-key {
      color: #71717a !important;
    }
    #agentic-sidebar-root:not(.dark) .as-link-get-key:hover {
      color: #09090b !important;
    }
    #agentic-sidebar-root.dark .as-link-get-key {
      color: #a1a1aa !important;
    }
    #agentic-sidebar-root.dark .as-link-get-key:hover {
      color: #fafafa !important;
    }

    .as-key-input-row {
      display: flex !important;
      gap: 6px !important;
      align-items: center !important;
      width: 100% !important;
    }

    .as-input-password-wrapper {
      position: relative !important;
      display: flex !important;
      align-items: center !important;
      flex: 1 1 auto !important;
      min-width: 0 !important;
    }

    .as-settings-input,
    .as-settings-select {
      all: initial !important;
      display: block !important;
      width: 100% !important;
      box-sizing: border-box !important;
      padding: 7px 10px !important;
      border-radius: 6px !important;
      font-size: 11.5px !important;
      font-family: var(--font-sans) !important;
      transition: border-color 0.15s ease !important;
    }
    #agentic-sidebar-root:not(.dark) .as-settings-input,
    #agentic-sidebar-root:not(.dark) .as-settings-select {
      background: #ffffff !important;
      border: 1px solid #e4e4e7 !important;
      color: #09090b !important;
    }
    #agentic-sidebar-root:not(.dark) .as-settings-input:focus,
    #agentic-sidebar-root:not(.dark) .as-settings-select:focus {
      border-color: #09090b !important;
    }
    #agentic-sidebar-root.dark .as-settings-input,
    #agentic-sidebar-root.dark .as-settings-select {
      background: #121215 !important;
      border: 1px solid #27272a !important;
      color: #fafafa !important;
    }
    #agentic-sidebar-root.dark .as-settings-input:focus,
    #agentic-sidebar-root.dark .as-settings-select:focus {
      border-color: #52525b !important;
    }

    .as-btn-toggle-eye {
      all: initial !important;
      position: absolute !important;
      right: 7px !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      cursor: pointer !important;
      color: #71717a !important;
      padding: 4px !important;
    }
    .as-btn-toggle-eye:hover {
      color: inherit !important;
    }

    .as-btn-test-ping {
      all: initial !important;
      display: inline-flex !important;
      align-items: center !important;
      justify-content: center !important;
      gap: 5px !important;
      padding: 7px 11px !important;
      border-radius: 6px !important;
      font-size: 11px !important;
      font-weight: 600 !important;
      font-family: var(--font-sans) !important;
      cursor: pointer !important;
      white-space: nowrap !important;
      flex-shrink: 0 !important;
      transition: all 0.15s ease !important;
    }
    #agentic-sidebar-root:not(.dark) .as-btn-test-ping {
      background: #f4f4f5 !important;
      color: #09090b !important;
      border: 1px solid #e4e4e7 !important;
    }
    #agentic-sidebar-root:not(.dark) .as-btn-test-ping:hover {
      background: #e4e4e7 !important;
      color: #09090b !important;
    }
    #agentic-sidebar-root.dark .as-btn-test-ping {
      background: #27272a !important;
      color: #fafafa !important;
      border: 1px solid #3f3f46 !important;
    }
    #agentic-sidebar-root.dark .as-btn-test-ping:hover {
      background: #3f3f46 !important;
      color: #ffffff !important;
    }

    .as-test-status-msg {
      font-size: 10px !important;
      padding: 6px 10px !important;
      border-radius: 6px !important;
      line-height: 1.35 !important;
      display: flex !important;
      align-items: center !important;
      gap: 6px !important;
    }
    .as-test-status-msg.success {
      background: rgba(16, 185, 129, 0.1) !important;
      color: #10b981 !important;
      border: 1px solid rgba(16, 185, 129, 0.25) !important;
    }
    .as-test-status-msg.error {
      background: rgba(239, 68, 68, 0.1) !important;
      color: #f87171 !important;
      border: 1px solid rgba(239, 68, 68, 0.25) !important;
    }

    /* Antigravity Banner (shadcn Minimalist Callout - Flat & Consistent) */
    .as-ag-hero-banner {
      display: flex !important;
      align-items: flex-start !important;
      gap: 11px !important;
      padding: 12px 14px !important;
      border-radius: 8px !important;
    }
    #agentic-sidebar-root:not(.dark) .as-ag-hero-banner {
      background: #f4f4f5 !important;
      border: 1px solid #e4e4e7 !important;
    }
    #agentic-sidebar-root.dark .as-ag-hero-banner {
      background: #18181b !important;
      border: 1px solid #27272a !important;
    }
    .as-ag-hero-icon {
      font-size: 16px !important;
      line-height: 1 !important;
      color: inherit !important;
      flex-shrink: 0 !important;
      margin-top: 2px !important;
    }
    #agentic-sidebar-root:not(.dark) .as-ag-hero-icon {
      color: #52525b !important;
    }
    #agentic-sidebar-root.dark .as-ag-hero-icon {
      color: #a1a1aa !important;
    }
    .as-ag-hero-text {
      display: flex !important;
      flex-direction: column !important;
      gap: 3px !important;
    }
    .as-ag-hero-title {
      font-size: 12px !important;
      font-weight: 600 !important;
      letter-spacing: -0.1px !important;
    }
    #agentic-sidebar-root:not(.dark) .as-ag-hero-title {
      color: #09090b !important;
    }
    #agentic-sidebar-root.dark .as-ag-hero-title {
      color: #fafafa !important;
    }
    .as-ag-hero-desc {
      font-size: 11px !important;
      line-height: 1.45 !important;
    }
    #agentic-sidebar-root:not(.dark) .as-ag-hero-desc {
      color: #71717a !important;
      font-weight: 400 !important;
    }
    #agentic-sidebar-root.dark .as-ag-hero-desc {
      color: #a1a1aa !important;
      font-weight: 400 !important;
    }

    /* Primary Button & Tag Pill Controls */
    .as-btn-primary {
      all: initial !important;
      display: inline-flex !important;
      align-items: center !important;
      justify-content: center !important;
      gap: 6px !important;
      padding: 7px 14px !important;
      border-radius: 6px !important;
      font-size: 11px !important;
      font-weight: 600 !important;
      font-family: var(--font-sans) !important;
      cursor: pointer !important;
      transition: all 0.15s ease !important;
      box-shadow: none !important;
    }
    #agentic-sidebar-root:not(.dark) .as-btn-primary {
      background: #09090b !important;
      color: #ffffff !important;
      border: 1px solid #09090b !important;
    }
    #agentic-sidebar-root:not(.dark) .as-btn-primary:hover {
      background: #27272a !important;
    }
    #agentic-sidebar-root.dark .as-btn-primary {
      background: #fafafa !important;
      color: #09090b !important;
      border: 1px solid #fafafa !important;
    }
    #agentic-sidebar-root.dark .as-btn-primary:hover {
      background: #e4e4e7 !important;
    }

    .as-settings-tag-pill {
      all: initial !important;
      display: inline-flex !important;
      align-items: center !important;
      gap: 4px !important;
      padding: 4px 8px !important;
      border-radius: 9999px !important;
      font-size: 10px !important;
      font-weight: 500 !important;
      font-family: var(--font-sans) !important;
      cursor: pointer !important;
      transition: all 0.15s ease !important;
    }
    #agentic-sidebar-root:not(.dark) .as-settings-tag-pill {
      background: #f4f4f5 !important;
      color: #52525b !important;
      border: 1px solid #e4e4e7 !important;
    }
    #agentic-sidebar-root:not(.dark) .as-settings-tag-pill:hover {
      background: #e4e4e7 !important;
      color: #18181b !important;
    }
    #agentic-sidebar-root.dark .as-settings-tag-pill {
      background: #27272a !important;
      color: #a1a1aa !important;
      border: 1px solid #3f3f46 !important;
    }
    #agentic-sidebar-root.dark .as-settings-tag-pill:hover {
      background: #3f3f46 !important;
      color: #fafafa !important;
    }

    /* Models Selection Group */
    .as-models-selection-section {
      display: flex !important;
      flex-direction: column !important;
      gap: 7px !important;
      margin-top: 2px !important;
    }

    .as-models-selection-header {
      display: flex !important;
      align-items: center !important;
      justify-content: space-between !important;
    }

    .as-models-selection-title {
      font-size: 11px !important;
      font-weight: 600 !important;
      letter-spacing: 0.1px !important;
    }

    .as-models-list-group {
      display: flex !important;
      flex-direction: column !important;
      gap: 5px !important;
      max-height: 180px !important;
      overflow-y: auto !important;
      padding-right: 2px !important;
    }

    .as-model-checkbox-item {
      display: flex !important;
      align-items: center !important;
      justify-content: space-between !important;
      padding: 7px 9px !important;
      border-radius: 6px !important;
      gap: 8px !important;
      transition: all 0.15s ease !important;
      cursor: pointer !important;
      user-select: none !important;
    }
    #agentic-sidebar-root:not(.dark) .as-model-checkbox-item {
      background: #fafafa !important;
      border: 1px solid #e4e4e7 !important;
    }
    #agentic-sidebar-root:not(.dark) .as-model-checkbox-item:hover {
      background: #f4f4f5 !important;
    }
    #agentic-sidebar-root.dark .as-model-checkbox-item {
      background: #121215 !important;
      border: 1px solid #27272a !important;
    }
    #agentic-sidebar-root.dark .as-model-checkbox-item:hover {
      background: #1c1c20 !important;
      border-color: #3f3f46 !important;
    }

    .as-model-checkbox-left {
      display: flex !important;
      align-items: center !important;
      gap: 8px !important;
      overflow: hidden !important;
    }

    .as-model-checkbox-input {
      cursor: pointer !important;
      accent-color: #18181b !important;
      width: 14px !important;
      height: 14px !important;
      margin: 0 !important;
      flex-shrink: 0 !important;
    }
    #agentic-sidebar-root.dark .as-model-checkbox-input {
      accent-color: #fafafa !important;
    }

    .as-model-name-label {
      font-size: 11px !important;
      font-weight: 500 !important;
      white-space: nowrap !important;
      overflow: hidden !important;
      text-overflow: ellipsis !important;
    }

    .as-model-tags-container {
      display: flex !important;
      align-items: center !important;
      gap: 4px !important;
      flex-shrink: 0 !important;
    }

    .as-model-tag-pill {
      font-size: 8.5px !important;
      font-weight: 600 !important;
      padding: 1.5px 5px !important;
      border-radius: 4px !important;
      background: rgba(255, 255, 255, 0.06) !important;
      color: #a1a1aa !important;
    }
    .as-model-tag-pill.top {
      font-weight: 600 !important;
    }
    #agentic-sidebar-root:not(.dark) .as-model-tag-pill.top {
      background: #e4e4e7 !important;
      color: #09090b !important;
    }
    #agentic-sidebar-root.dark .as-model-tag-pill.top {
      background: #27272a !important;
      color: #fafafa !important;
    }

    .as-btn-brand-primary {
      all: initial !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      gap: 6px !important;
      padding: 8px 14px !important;
      border-radius: 6px !important;
      cursor: pointer !important;
      font-size: 11.5px !important;
      font-weight: 600 !important;
      font-family: var(--font-sans) !important;
      transition: all 0.15s ease !important;
      margin-top: 4px !important;
      box-shadow: none !important;
    }
    #agentic-sidebar-root:not(.dark) .as-btn-brand-primary {
      background: #09090b !important;
      color: #ffffff !important;
      border: 1px solid #09090b !important;
    }
    #agentic-sidebar-root:not(.dark) .as-btn-brand-primary:hover {
      background: #27272a !important;
    }
    #agentic-sidebar-root.dark .as-btn-brand-primary {
      background: #fafafa !important;
      color: #09090b !important;
      border: 1px solid #fafafa !important;
    }
    #agentic-sidebar-root.dark .as-btn-brand-primary:hover {
      background: #e4e4e7 !important;
    }

    .as-accordion-toggle {
      all: initial !important;
      display: inline-flex !important;
      align-items: center !important;
      gap: 5px !important;
      font-size: 10.5px !important;
      color: #71717a !important;
      font-family: var(--font-sans) !important;
      cursor: pointer !important;
      padding: 3px 0 !important;
      transition: color 0.15s ease !important;
    }
    .as-accordion-toggle:hover {
      color: inherit !important;
    }

    /* Tab 2: Configured Models List */
    .as-configured-models-list {
      display: flex !important;
      flex-direction: column !important;
      gap: 6px !important;
    }

    .as-configured-model-item {
      display: flex !important;
      align-items: center !important;
      justify-content: space-between !important;
      padding: 9px 11px !important;
      border-radius: 8px !important;
      gap: 8px !important;
      transition: all 0.15s ease !important;
    }
    #agentic-sidebar-root:not(.dark) .as-configured-model-item {
      background: #fafafa !important;
      border: 1px solid #e4e4e7 !important;
    }
    #agentic-sidebar-root.dark .as-configured-model-item {
      background: #18181b !important;
      border: 1px solid #27272a !important;
    }

    .as-model-meta-info {
      display: flex !important;
      flex-direction: column !important;
      gap: 2px !important;
      overflow: hidden !important;
    }

    .as-model-item-title {
      font-size: 12px !important;
      font-weight: 600 !important;
      white-space: nowrap !important;
      overflow: hidden !important;
      text-overflow: ellipsis !important;
    }

    .as-model-item-sub {
      font-size: 10px !important;
      color: #71717a !important;
      white-space: nowrap !important;
      overflow: hidden !important;
      text-overflow: ellipsis !important;
    }

    .as-model-item-actions {
      display: flex !important;
      align-items: center !important;
      gap: 6px !important;
      flex-shrink: 0 !important;
    }

    .as-model-active-badge {
      display: inline-flex !important;
      align-items: center !important;
      gap: 4px !important;
      padding: 2.5px 7px !important;
      border-radius: 4px !important;
      font-size: 9.5px !important;
      font-weight: 600 !important;
    }
    #agentic-sidebar-root:not(.dark) .as-model-active-badge {
      background: #f4f4f5 !important;
      color: #09090b !important;
      border: 1px solid #e4e4e7 !important;
    }
    #agentic-sidebar-root.dark .as-model-active-badge {
      background: #27272a !important;
      color: #fafafa !important;
      border: 1px solid #3f3f46 !important;
    }

    .as-btn-model-activate {
      all: initial !important;
      padding: 4px 8px !important;
      border-radius: 4px !important;
      font-size: 10.5px !important;
      font-weight: 500 !important;
      font-family: var(--font-sans) !important;
      cursor: pointer !important;
      transition: all 0.15s ease !important;
    }
    #agentic-sidebar-root:not(.dark) .as-btn-model-activate {
      background: #f4f4f5 !important;
      border: 1px solid #e4e4e7 !important;
      color: #09090b !important;
    }
    #agentic-sidebar-root:not(.dark) .as-btn-model-activate:hover {
      background: #e4e4e7 !important;
    }
    #agentic-sidebar-root.dark .as-btn-model-activate {
      background: #27272a !important;
      border: 1px solid #3f3f46 !important;
      color: #fafafa !important;
    }
    #agentic-sidebar-root.dark .as-btn-model-activate:hover {
      background: #3f3f46 !important;
      color: #fafafa !important;
    }

    .as-btn-model-delete {
      all: initial !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      cursor: pointer !important;
      color: #ef4444 !important;
      padding: 5px !important;
      border-radius: 4px !important;
      transition: background 0.15s ease !important;
    }
    .as-btn-model-delete:hover {
      background: rgba(239, 68, 68, 0.15) !important;
    }

    .as-empty-models-notice {
      font-size: 11px !important;
      color: #71717a !important;
      text-align: center !important;
      padding: 20px 8px !important;
    }

    .as-custom-model-card {
      border-radius: 8px !important;
      border: 1px solid #27272a !important;
      background: #121215 !important;
      overflow: hidden !important;
      margin-top: 10px !important;
    }
    #agentic-sidebar-root:not(.dark) .as-custom-model-card {
      border: 1px solid #e4e4e7 !important;
      background: #ffffff !important;
    }

    .as-custom-model-header {
      display: flex !important;
      align-items: center !important;
      justify-content: space-between !important;
      padding: 10px 12px !important;
      cursor: pointer !important;
    }

    .as-custom-model-title {
      display: flex !important;
      align-items: center !important;
      gap: 6px !important;
      font-size: 11.5px !important;
      font-weight: 600 !important;
    }

    .as-custom-model-body {
      padding: 12px !important;
      border-top: 1px solid rgba(255, 255, 255, 0.06) !important;
      display: flex !important;
      flex-direction: column !important;
      gap: 10px !important;
    }

    /* Tab 3: Automation & Vision Preferences */
    .as-settings-card {
      border-radius: 10px !important;
      padding: 14px !important;
      box-sizing: border-box !important;
      display: flex !important;
      flex-direction: column !important;
      gap: 12px !important;
    }
    #agentic-sidebar-root:not(.dark) .as-settings-card {
      background: #ffffff !important;
      border: 1px solid #e4e4e7 !important;
      box-shadow: 0 1px 4px rgba(0, 0, 0, 0.03) !important;
    }
    #agentic-sidebar-root.dark .as-settings-card {
      background: #121215 !important;
      border: 1px solid #27272a !important;
    }

    .as-settings-card-header {
      display: flex !important;
      flex-direction: column !important;
      gap: 3px !important;
    }

    .as-settings-card-title {
      font-size: 12px !important;
      font-weight: 600 !important;
      letter-spacing: -0.2px !important;
    }

    .as-settings-card-sub {
      font-size: 10.5px !important;
      color: #71717a !important;
      line-height: 1.4 !important;
    }

    .as-setting-row {
      display: flex !important;
      align-items: center !important;
      justify-content: space-between !important;
      gap: 12px !important;
      padding: 4px 0 !important;
    }

    .as-setting-info {
      display: flex !important;
      flex-direction: column !important;
      gap: 2px !important;
      overflow: hidden !important;
    }

    .as-setting-label {
      font-size: 11.5px !important;
      font-weight: 600 !important;
    }

    .as-setting-desc {
      font-size: 10px !important;
      color: #71717a !important;
      line-height: 1.35 !important;
    }

    .as-setting-divider {
      height: 1px !important;
      width: 100% !important;
      background: rgba(255, 255, 255, 0.06) !important;
      margin: 4px 0 !important;
    }
    #agentic-sidebar-root:not(.dark) .as-setting-divider {
      background: #f4f4f5 !important;
    }

    .as-select-sm {
      max-width: 140px !important;
      padding: 5px 8px !important;
      font-size: 10.5px !important;
    }

    .as-switch-btn {
      all: initial !important;
      width: 34px !important;
      height: 19px !important;
      border-radius: 9999px !important;
      background: #27272a !important;
      border: 1px solid rgba(255, 255, 255, 0.1) !important;
      cursor: pointer !important;
      position: relative !important;
      transition: background 0.2s ease !important;
      flex-shrink: 0 !important;
    }
    .as-switch-btn.active {
      background: #09090b !important;
      border-color: #09090b !important;
    }
    #agentic-sidebar-root.dark .as-switch-btn.active {
      background: #fafafa !important;
      border-color: #fafafa !important;
    }
    .as-switch-thumb {
      display: block !important;
      width: 13px !important;
      height: 13px !important;
      border-radius: 50% !important;
      background: #ffffff !important;
      position: absolute !important;
      top: 2px !important;
      left: 2px !important;
      transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1) !important;
    }
    .as-switch-btn.active .as-switch-thumb {
      transform: translateX(15px) !important;
    }
    #agentic-sidebar-root.dark .as-switch-btn.active .as-switch-thumb {
      background: #09090b !important;
    }

    .as-empty-models-popover {
      display: flex !important;
      flex-direction: column !important;
      align-items: center !important;
      gap: 8px !important;
      padding: 14px 10px !important;
      text-align: center !important;
    }

    .as-empty-models-popover span {
      font-size: 11px !important;
      color: #71717a !important;
    }

    .as-btn-popover-settings {
      all: initial !important;
      display: inline-flex !important;
      align-items: center !important;
      gap: 5px !important;
      padding: 6px 11px !important;
      border-radius: 6px !important;
      font-size: 11px !important;
      font-weight: 600 !important;
      font-family: var(--font-sans) !important;
      cursor: pointer !important;
      transition: all 0.15s ease !important;
      box-shadow: none !important;
    }
    #agentic-sidebar-root:not(.dark) .as-btn-popover-settings {
      background: #09090b !important;
      color: #ffffff !important;
      border: 1px solid #09090b !important;
    }
    #agentic-sidebar-root:not(.dark) .as-btn-popover-settings:hover {
      background: #27272a !important;
    }
    #agentic-sidebar-root.dark .as-btn-popover-settings {
      background: #fafafa !important;
      color: #09090b !important;
      border: 1px solid #fafafa !important;
    }
    #agentic-sidebar-root.dark .as-btn-popover-settings:hover {
      background: #e4e4e7 !important;
    }`;
}
