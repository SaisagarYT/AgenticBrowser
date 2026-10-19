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
      background-color: #f4f4f5 !important;
      border-left: 1px solid hsl(var(--border)) !important;
      box-shadow: none !important;
      color: hsl(var(--foreground)) !important;
      font-family: var(--font-sans) !important;
      transition: transform 0.28s cubic-bezier(0.16, 1, 0.3, 1) !important;
      user-select: text !important;
      margin: 0 !important;
      padding: 2px !important;
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
      border-radius: 8px !important;
      border: 1px solid #e4e4e7 !important;
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
      box-shadow: none !important;
      border: 1px solid rgba(255, 255, 255, 0.12) !important;
      padding: 10px 12px 10px 12px !important;
      transition: border-color 0.2s ease, background 0.2s ease !important;
      box-sizing: border-box !important;
      width: 100% !important;
      min-height: 88px !important;
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
      background-color: #f4f4f5 !important;
      border-left: 1px solid #e4e4e7 !important;
      border-top: none !important;
      border-right: none !important;
      border-bottom: none !important;
      border-radius: 0px !important;
      color: #09090b !important;
      box-shadow: none !important;
    }
    #agentic-sidebar-root:not(.dark) .as-inner-container {
      background-color: #ffffff !important;
      border: 1px solid #e4e4e7 !important;
      border-radius: 8px !important;
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
    #agentic-sidebar-root:not(.dark) .as-som-switch.active {
      background: #facc15 !important;
      border-color: #eab308 !important;
    }
    #agentic-sidebar-root:not(.dark) .as-som-switch-thumb {
      background: #ffffff !important;
      color: #71717a !important;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15) !important;
    }
    #agentic-sidebar-root:not(.dark) .as-som-switch.active .as-som-switch-thumb {
      background: #09090b !important;
      color: #facc15 !important;
    }

    /* Dark Theme (Pure Deep Dark Zinc-950) */
    #agentic-sidebar-root.dark {
      background-color: #121215 !important;
      border-left: 1px solid #27272a !important;
      border-top: none !important;
      border-right: none !important;
      border-bottom: none !important;
      border-radius: 0px !important;
      color: #fafafa !important;
      box-shadow: none !important;
    }
    #agentic-sidebar-root.dark .as-inner-container {
      background-color: #09090b !important;
      border: 1px solid #27272a !important;
      border-radius: 8px !important;
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
    #agentic-sidebar-root.dark .as-som-switch.active {
      background: #facc15 !important;
      border-color: #eab308 !important;
    }

    /* ------------------------------------------------------------------------
       Settings View Styling (Occupies 100% of the Chat Space)
       ------------------------------------------------------------------------ */
    .as-settings-topbar {
      display: flex !important;
      align-items: center !important;
      justify-content: space-between !important;
      padding: 12px 16px !important;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1) !important;
      flex-shrink: 0 !important;
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
      gap: 6px !important;
      padding: 6px 10px !important;
      border-radius: 6px !important;
      cursor: pointer !important;
      font-size: 12px !important;
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
      color: #facc15 !important;
    }

    .as-settings-header-title {
      font-size: 13px !important;
      font-weight: 600 !important;
      font-family: var(--font-sans) !important;
      letter-spacing: -0.2px !important;
    }

    .as-settings-scroll-area {
      flex: 1 1 auto !important;
      overflow-y: auto !important;
      padding: 16px !important;
      display: flex !important;
      flex-direction: column !important;
      gap: 16px !important;
      box-sizing: border-box !important;
    }

    .as-settings-card {
      border-radius: 10px !important;
      padding: 16px !important;
      box-sizing: border-box !important;
      display: flex !important;
      flex-direction: column !important;
      gap: 14px !important;
    }
    #agentic-sidebar-root:not(.dark) .as-settings-card {
      background: #ffffff !important;
      border: 1px solid #e4e4e7 !important;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04) !important;
    }
    #agentic-sidebar-root.dark .as-settings-card {
      background: #121215 !important;
      border: 1px solid #27272a !important;
      box-shadow: 0 4px 14px rgba(0, 0, 0, 0.3) !important;
    }

    .as-settings-card-header {
      display: flex !important;
      flex-direction: column !important;
      gap: 3px !important;
    }

    .as-settings-card-title {
      font-size: 13.5px !important;
      font-weight: 600 !important;
      letter-spacing: -0.2px !important;
    }

    .as-settings-card-sub {
      font-size: 11px !important;
      color: #71717a !important;
      line-height: 1.4 !important;
    }

    .as-settings-form {
      display: flex !important;
      flex-direction: column !important;
      gap: 12px !important;
    }

    .as-settings-field {
      display: flex !important;
      flex-direction: column !important;
      gap: 5px !important;
    }

    .as-settings-label {
      font-size: 11px !important;
      font-weight: 600 !important;
      color: inherit !important;
      letter-spacing: 0.2px !important;
    }

    .as-settings-input,
    .as-settings-select {
      all: initial !important;
      display: block !important;
      width: 100% !important;
      box-sizing: border-box !important;
      padding: 8px 10px !important;
      border-radius: 6px !important;
      font-size: 12px !important;
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
      background: #18181b !important;
      border: 1px solid #27272a !important;
      color: #fafafa !important;
    }
    #agentic-sidebar-root.dark .as-settings-input:focus,
    #agentic-sidebar-root.dark .as-settings-select:focus {
      border-color: #facc15 !important;
    }

    .as-input-password-wrapper {
      position: relative !important;
      display: flex !important;
      align-items: center !important;
      width: 100% !important;
    }

    .as-btn-toggle-eye {
      all: initial !important;
      position: absolute !important;
      right: 8px !important;
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

    .as-settings-hint {
      font-size: 10px !important;
      color: #71717a !important;
    }

    .as-settings-btn-save {
      all: initial !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      gap: 6px !important;
      padding: 9px 14px !important;
      border-radius: 6px !important;
      cursor: pointer !important;
      font-size: 12px !important;
      font-weight: 600 !important;
      font-family: var(--font-sans) !important;
      transition: all 0.15s ease !important;
      margin-top: 4px !important;
    }
    #agentic-sidebar-root:not(.dark) .as-settings-btn-save {
      background: #09090b !important;
      color: #ffffff !important;
    }
    #agentic-sidebar-root:not(.dark) .as-settings-btn-save:hover {
      background: #27272a !important;
    }
    #agentic-sidebar-root.dark .as-settings-btn-save {
      background: #facc15 !important;
      color: #09090b !important;
    }
    #agentic-sidebar-root.dark .as-settings-btn-save:hover {
      background: #eab308 !important;
    }

    .as-configured-models-list {
      display: flex !important;
      flex-direction: column !important;
      gap: 8px !important;
    }

    .as-configured-model-item {
      display: flex !important;
      align-items: center !important;
      justify-content: space-between !important;
      padding: 10px 12px !important;
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
      font-size: 12.5px !important;
      font-weight: 600 !important;
      white-space: nowrap !important;
      overflow: hidden !important;
      text-overflow: ellipsis !important;
    }

    .as-model-item-sub {
      font-size: 10.5px !important;
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
      padding: 3px 7px !important;
      border-radius: 4px !important;
      font-size: 10.5px !important;
      font-weight: 600 !important;
      background: #facc15 !important;
      color: #09090b !important;
    }

    .as-btn-model-activate {
      all: initial !important;
      padding: 4px 8px !important;
      border-radius: 4px !important;
      font-size: 11px !important;
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
      color: #facc15 !important;
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
      font-size: 11.5px !important;
      color: #71717a !important;
      text-align: center !important;
      padding: 16px 8px !important;
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
      font-size: 11.5px !important;
      color: #71717a !important;
    }

    .as-btn-popover-settings {
      all: initial !important;
      display: inline-flex !important;
      align-items: center !important;
      gap: 5px !important;
      padding: 6px 10px !important;
      border-radius: 5px !important;
      font-size: 11px !important;
      font-weight: 600 !important;
      font-family: var(--font-sans) !important;
      cursor: pointer !important;
      background: #facc15 !important;
      color: #09090b !important;
      transition: background 0.15s ease !important;
    }
    .as-btn-popover-settings:hover {
      background: #eab308 !important;
    }`;
}
