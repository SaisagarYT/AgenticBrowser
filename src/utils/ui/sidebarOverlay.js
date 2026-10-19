"use strict";

/**
 * Agentic Browser - Sidebar Overlay (Modular Architecture)
 *
 * This file serves as the clean modular entrypoint for the sidebar overlay system.
 * The monolithic 4,000+ line implementation has been decomposed into specialized, maintainable ES modules:
 *
 * - sidebar/styles.js: CSS design tokens, animations, radial-gradient dot pattern & responsive rules
 * - sidebar/icons.js: Lucide SVG vector icon paths & Voxle Cube branding SVG
 * - sidebar/templates.js: 46px rail dock and expanded sidebar HTML markup
 * - sidebar/markdown.js: Markdown parser, code blocks, tables, inline styling & HTML sanitization
 * - sidebar/visionManager.js: Camera screenshot flash animation & preview lightbox modal
 * - sidebar/planManager.js: Realtime multi-step execution plan, progress bar & interior step action logs
 * - sidebar/settingsManager.js: In-place model configuration, smart provider forms & active model sync
 * - sidebar/chatManager.js: User message bubbles, shadcn skeleton shimmer & assistant response cards
 * - sidebar/inputManager.js: Textarea auto-resize, file attachments, drag-and-drop & task submission
 * - sidebar/clientManager.js: Viewport reflow, SPA watchdogs, sheet drawer, theme & window API
 * - sidebar/build.js: Master builder assembling submodules into the runtime browser injection script
 */

export { buildSidebarScript } from "./sidebar/build.js";
export { getSidebarStyles } from "./sidebar/styles.js";
export { ICONS, VOXLE_CUBE_SVG } from "./sidebar/icons.js";
export { getRailHtml, getSidebarHtml } from "./sidebar/templates.js";
export { escapeHtml, stripStartSymbols, formatAiMarkdown, getMarkdownCode } from "./sidebar/markdown.js";
export { getVisionManagerCode } from "./sidebar/visionManager.js";
export { getPlanManagerCode } from "./sidebar/planManager.js";
export { getSettingsManagerCode } from "./sidebar/settingsManager.js";
export { getChatManagerCode } from "./sidebar/chatManager.js";
export { getInputManagerCode } from "./sidebar/inputManager.js";
export { getClientManagerCode } from "./sidebar/clientManager.js";

import { buildSidebarScript } from "./sidebar/build.js";
export default buildSidebarScript;
