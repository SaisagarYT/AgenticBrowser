"use strict";

export const DOM_INJECTION_SCRIPT = `
(() => {
  // 1. Tag all interactive elements with mmid if not already tagged
  let counter = 1;
  const elements = document.querySelectorAll('a, button, input, textarea, select, [role="button"], [role="link"], [role="checkbox"], [tabindex], [contenteditable="true"]');
  
  elements.forEach((el) => {
    // Skip anything inside the agentic sidebar, rail dock, or existing overlay
    if (el.closest('#agentic-sidebar-wrapper') || el.closest('#agentic-rail-root') || el.closest('#agentic-som-overlay')) {
      return;
    }
    if (!el.getAttribute('mmid')) {
      el.setAttribute('mmid', String(counter++));
    }
  });

  // 2. Helper to find closest meaningful semantic container
  function getSemanticContainer(el) {
    let cur = el.parentElement;
    let best = null;
    while (cur && cur !== document.body && cur !== document.documentElement) {
      if (cur.id === 'agentic-sidebar-wrapper' || cur.id === 'agentic-rail-root' || cur.id === 'agentic-som-overlay') {
        return null;
      }
      const tag = cur.tagName.toLowerCase();
      const role = (cur.getAttribute('role') || '').toLowerCase();
      const cls = typeof cur.className === 'string' ? cur.className.toLowerCase() : '';
      const id = (cur.id || '').toLowerCase();

      const isSemanticTag = ['article', 'section', 'nav', 'header', 'footer', 'aside', 'form', 'table'].includes(tag);
      const isSemanticRole = ['dialog', 'region', 'navigation', 'search', 'feed', 'listitem', 'form'].includes(role);
      const isCardClass = /(^|\s|-|_)(card|item|product|result|panel|box|container|widget|entry|listing)($|\s|-|_)/i.test(cls) ||
                          /(^|\s|-|_)(card|item|product|result|panel|box|widget)($|\s|-|_)/i.test(id);

      if (isSemanticTag || isSemanticRole || isCardClass) {
        const rect = cur.getBoundingClientRect();
        if (rect.width >= 35 && rect.height >= 24) {
          best = cur;
          if (tag === 'article' || tag === 'form' || isCardClass) break;
        }
      }
      cur = cur.parentElement;
    }
    return best;
  }

  function getContainerLabel(container) {
    if (!container) return 'Component';
    const tag = container.tagName.toLowerCase();
    const aria = container.getAttribute('aria-label') || container.getAttribute('title');
    if (aria && aria.trim()) return aria.trim().slice(0, 32);

    const h = container.querySelector('h1, h2, h3, h4, h5, h6, [class*="title"], [class*="name"]');
    if (h && h.innerText && h.innerText.trim()) {
      return h.innerText.trim().slice(0, 32);
    }

    if (tag === 'form') return 'Form Container';
    if (tag === 'nav') return 'Navigation Bar';
    if (tag === 'header') return 'Header';
    if (tag === 'footer') return 'Footer';
    if (tag === 'table') return 'Data Table';
    if (tag === 'article') return 'Content Card';
    if (tag === 'section') return 'Section Block';
    return 'Card Container';
  }

  // 3. Render visual Set-of-Marks (SoM) bounding boxes & numbered tags
  function renderVisualMarks() {
    let overlay = document.getElementById('agentic-som-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'agentic-som-overlay';
      overlay.style.cssText = 'position: fixed !important; top: 0px !important; left: 0px !important; width: 100vw !important; height: 100vh !important; pointer-events: none !important; z-index: 2147483640 !important; overflow: hidden !important;';
      
      const targetMount = document.body || document.documentElement;
      if (targetMount) {
        targetMount.appendChild(overlay);
      }

      let scrollRaf = null;
      const handleViewportUpdate = () => {
        if (scrollRaf) return;
        scrollRaf = requestAnimationFrame(() => {
          scrollRaf = null;
          if (typeof window.__renderVisualMarks === 'function') {
            window.__renderVisualMarks();
          }
        });
      };

      window.addEventListener('scroll', handleViewportUpdate, { passive: true });
      window.addEventListener('resize', handleViewportUpdate, { passive: true });
    } else {
      overlay.innerHTML = '';
    }

    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const interactive = document.querySelectorAll('[mmid]');
    const fragment = document.createDocumentFragment();

    // Pass 1: Render outer semantic container bounding boxes (Phase 3)
    const containersDrawn = new Set();
    interactive.forEach((el) => {
      if (el.closest('#agentic-sidebar-wrapper') || el.closest('#agentic-rail-root') || el.closest('#agentic-som-overlay')) return;
      const container = getSemanticContainer(el);
      if (!container || containersDrawn.has(container)) return;
      containersDrawn.add(container);

      const cRect = container.getBoundingClientRect();
      if (cRect.width < 40 || cRect.height < 25) return;
      if (cRect.bottom < 0 || cRect.top > vh || cRect.right < 0 || cRect.left > vw) return;
      // Skip if it takes up the entire viewport
      if (cRect.width >= vw * 0.98 && cRect.height >= vh * 0.98) return;

      const cBox = document.createElement('div');
      cBox.className = 'as-som-container-box';
      cBox.style.cssText = \`
        position: absolute !important;
        left: \${Math.round(cRect.left)}px !important;
        top: \${Math.round(cRect.top)}px !important;
        width: \${Math.round(cRect.width)}px !important;
        height: \${Math.round(cRect.height)}px !important;
        border: 1.5px dashed rgba(59, 130, 246, 0.45) !important;
        background-color: rgba(59, 130, 246, 0.015) !important;
        box-sizing: border-box !important;
        pointer-events: none !important;
        border-radius: 4px !important;
      \`;

      const cBadge = document.createElement('span');
      cBadge.className = 'as-som-container-badge';
      cBadge.textContent = getContainerLabel(container);
      const cBadgeAbove = cRect.top >= 16;
      cBadge.style.cssText = \`
        position: absolute !important;
        top: \${cBadgeAbove ? -14 : 2}px !important;
        left: 4px !important;
        background: #0f172a !important;
        color: #93c5fd !important;
        border: 1px solid rgba(147, 197, 253, 0.35) !important;
        font-size: 8.5px !important;
        font-weight: 700 !important;
        text-transform: uppercase !important;
        letter-spacing: 0.4px !important;
        padding: 1px 5px !important;
        border-radius: 3px !important;
        white-space: nowrap !important;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.4) !important;
        pointer-events: none !important;
        user-select: none !important;
        z-index: 1 !important;
      \`;

      cBox.appendChild(cBadge);
      fragment.appendChild(cBox);
    });

    // Pass 2: Render individual interactive element boxes (Phase 1)
    interactive.forEach((el) => {
      if (el.closest('#agentic-sidebar-wrapper') || el.closest('#agentic-rail-root') || el.closest('#agentic-som-overlay')) {
        return;
      }

      const rect = el.getBoundingClientRect();
      if (rect.width < 4 || rect.height < 4) return;
      if (rect.bottom < 0 || rect.top > vh || rect.right < 0 || rect.left > vw) return;

      const style = window.getComputedStyle(el);
      if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') return;

      const mmid = el.getAttribute('mmid');
      const box = document.createElement('div');
      box.className = 'as-som-box';
      box.setAttribute('data-mmid', mmid);

      box.style.cssText = \`
        position: absolute !important;
        left: \${Math.round(rect.left)}px !important;
        top: \${Math.round(rect.top)}px !important;
        width: \${Math.round(rect.width)}px !important;
        height: \${Math.round(rect.height)}px !important;
        border: 1.5px solid rgba(37, 99, 235, 0.78) !important;
        background-color: rgba(37, 99, 235, 0.04) !important;
        box-sizing: border-box !important;
        pointer-events: none !important;
        border-radius: 2px !important;
        transition: border-color 0.15s ease, background-color 0.15s ease !important;
      \`;

      const badge = document.createElement('span');
      badge.className = 'as-som-badge';
      badge.textContent = mmid;

      const badgeAbove = rect.top >= 15;
      badge.style.cssText = \`
        position: absolute !important;
        top: \${badgeAbove ? -14 : 0}px !important;
        left: 0px !important;
        background: #1d4ed8 !important;
        color: #ffffff !important;
        font-size: 10px !important;
        font-weight: 700 !important;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, monospace !important;
        line-height: 12px !important;
        padding: 1px 3.5px !important;
        border-radius: 2px !important;
        white-space: nowrap !important;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.4) !important;
        pointer-events: none !important;
        user-select: none !important;
        z-index: 1 !important;
      \`;

      box.appendChild(badge);
      fragment.appendChild(box);
    });

    overlay.appendChild(fragment);
  }

  // Attach global helpers for dynamic updates and external controls
  window.__renderVisualMarks = renderVisualMarks;
  window.__clearVisualMarks = () => {
    const overlay = document.getElementById('agentic-som-overlay');
    if (overlay) overlay.remove();
  };

  renderVisualMarks();

  return {
    taggedCount: counter - 1,
    url: window.location.href,
    title: document.title,
  };
})();
`;

export async function tagInteractiveElements(page) {
  try {
    return await page.evaluate(DOM_INJECTION_SCRIPT);
  } catch {
    return { taggedCount: 0, url: page.url(), title: "" };
  }
}

export async function renderVisualMarks(page) {
  try {
    return await page.evaluate(() => {
      if (typeof window.__renderVisualMarks === "function") {
        window.__renderVisualMarks();
        return true;
      }
      return false;
    });
  } catch {
    return false;
  }
}

export async function clearVisualMarks(page) {
  try {
    return await page.evaluate(() => {
      if (typeof window.__clearVisualMarks === "function") {
        window.__clearVisualMarks();
        return true;
      }
      return false;
    });
  } catch {
    return false;
  }
}

export async function highlightActionElement(page, { selector, actionType = "click", detail = "" }) {
  if (!page || page.isClosed()) return false;

  try {
    return await page.evaluate(({ selector, actionType, detail }) => {
      try {
        let mmid = null;
        const clean = (selector || "").trim();
        const mmidMatch = clean.match(/mmid=["']?(\d+)["']?/i) || clean.match(/^(\d+)$/);
        if (mmidMatch) {
          mmid = mmidMatch[1];
        } else {
          const el = document.querySelector(clean);
          if (el) mmid = el.getAttribute("mmid");
        }

        const overlay = document.getElementById("agentic-som-overlay");
        if (!overlay) return false;

        let box = mmid ? overlay.querySelector(`.as-som-box[data-mmid="${mmid}"]`) : null;
        if (!box && mmid && typeof window.__renderVisualMarks === "function") {
          window.__renderVisualMarks();
          box = overlay.querySelector(`.as-som-box[data-mmid="${mmid}"]`);
        }

        if (!box) return false;

        // Ensure keyframe animations and styles are present
        if (!document.getElementById("agentic-som-action-styles")) {
          const st = document.createElement("style");
          st.id = "agentic-som-action-styles";
          st.textContent = `
            @keyframes asSomRipple {
              0% { transform: scale(0.3); opacity: 1; }
              100% { transform: scale(2.4); opacity: 0; }
            }
            @keyframes asSomPop {
              0% { transform: scale(0.7); opacity: 0; }
              100% { transform: scale(1); opacity: 1; }
            }
            .as-som-active-box {
              border: 2px solid #f97316 !important;
              background-color: rgba(249, 115, 22, 0.16) !important;
              box-shadow: 0 0 0 3px rgba(249, 115, 22, 0.45) !important;
              z-index: 2147483645 !important;
            }
            .as-som-action-pill {
              display: inline-flex !important;
              align-items: center !important;
              gap: 4px !important;
              padding: 1px 5px !important;
              margin-left: 3px !important;
              background: #18181b !important;
              color: #facc15 !important;
              border: 1px solid rgba(250, 204, 21, 0.5) !important;
              border-radius: 3px !important;
              font-size: 9.5px !important;
              font-weight: 700 !important;
              line-height: 12px !important;
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, monospace !important;
              box-shadow: 0 2px 6px rgba(0, 0, 0, 0.6) !important;
              animation: asSomPop 0.15s cubic-bezier(0.16, 1, 0.3, 1) !important;
              white-space: nowrap !important;
              pointer-events: none !important;
              user-select: none !important;
            }
            .as-som-click-pointer {
              position: absolute !important;
              top: 50% !important;
              left: 50% !important;
              transform: translate(-50%, -50%) !important;
              pointer-events: none !important;
              display: flex !important;
              align-items: center !important;
              justify-content: center !important;
              width: 28px !important;
              height: 28px !important;
              z-index: 2147483646 !important;
            }
            .as-som-ripple-ring {
              position: absolute !important;
              width: 24px !important;
              height: 24px !important;
              border-radius: 50% !important;
              border: 2px solid #f97316 !important;
              animation: asSomRipple 0.6s cubic-bezier(0.1, 0.8, 0.3, 1) forwards !important;
            }
            .as-som-arrow-icon {
              width: 14px !important;
              height: 14px !important;
              filter: drop-shadow(0 1px 3px rgba(0,0,0,0.5)) !important;
            }
          `;
          document.head.appendChild(st);
        }

        // 1. Highlight box with active spotlight
        box.classList.add("as-som-active-box");

        // 2. Add action pill next to badge
        const badge = box.querySelector(".as-som-badge");
        let actionPill = box.querySelector(".as-som-action-pill");
        if (!actionPill && badge) {
          actionPill = document.createElement("span");
          actionPill.className = "as-som-action-pill";
          const label = actionType === "type" ? `Type: "${(detail || "").slice(0, 15)}"` : "Click";
          actionPill.textContent = label;
          badge.insertAdjacentElement("afterend", actionPill);
        }

        // 3. Add animated click ripple pointer
        const pointer = document.createElement("div");
        pointer.className = "as-som-click-pointer";
        pointer.innerHTML = `
          <div class="as-som-ripple-ring"></div>
          <svg class="as-som-arrow-icon" viewBox="0 0 24 24" fill="#ea580c" stroke="#ffffff" stroke-width="1.5">
            <polygon points="3 3 10 20 13 13 20 10 3 3"/>
          </svg>
        `;
        box.appendChild(pointer);

        // Auto-cleanup after action duration
        setTimeout(() => {
          try {
            if (box) {
              box.classList.remove("as-som-active-box");
              if (actionPill) actionPill.remove();
              if (pointer) pointer.remove();
            }
          } catch {}
        }, 700);

        return true;
      } catch {
        return false;
      }
    }, { selector, actionType, detail });
  } catch {
    return false;
  }
}

export async function extractDomRepresentation(page, contentType = "fields") {
  await tagInteractiveElements(page);

  if (contentType === "text_only") {
    return await page.evaluate(() => {
      const clone = document.body.cloneNode(true);
      const scripts = clone.querySelectorAll("script, style, noscript, svg, #agentic-som-overlay, #agentic-sidebar-wrapper");
      scripts.forEach((s) => s.remove());
      return clone.innerText.replace(/\\n{3,}/g, "\\n\\n").trim();
    });
  }

  // "fields" or full representation
  return await page.evaluate(() => {
    const hasCanvas = !!document.querySelector("canvas");
    const interactive = Array.from(
      document.querySelectorAll('[mmid]')
    ).filter((el) => !el.closest('#agentic-sidebar-wrapper') && !el.closest('#agentic-rail-root') && !el.closest('#agentic-som-overlay'));

    const items = interactive.map((el) => {
      const tag = el.tagName.toLowerCase();
      const mmid = el.getAttribute("mmid");
      const text = (el.innerText || el.textContent || el.placeholder || "").trim().slice(0, 80);
      const value = el.value !== undefined && el.value !== "" ? String(el.value).trim().slice(0, 60) : "";
      const type = el.getAttribute("type") || "";
      const ariaLabel = el.getAttribute("aria-label") || "";
      const href = el.getAttribute("href") || "";
      const disabled = el.disabled === true || el.getAttribute("aria-disabled") === "true";
      const checked = el.checked === true;

      let desc = `<${tag} mmid="${mmid}"`;
      if (type) desc += ` type="${type}"`;
      if (ariaLabel) desc += ` aria-label="${ariaLabel}"`;
      if (text) desc += ` text="${text}"`;
      if (value) desc += ` value="${value}"`;
      if (checked) desc += ` checked="true"`;
      if (disabled) desc += ` disabled="true"`;
      if (href && href.startsWith("http")) desc += ` href="${href.slice(0, 60)}"`;
      desc += " />";

      return desc;
    });

    // 2. Build semantic container blocks grouping (Phase 3)
    function findContainer(el) {
      let cur = el.parentElement;
      let best = null;
      while (cur && cur !== document.body && cur !== document.documentElement) {
        if (cur.id === 'agentic-sidebar-wrapper' || cur.id === 'agentic-rail-root' || cur.id === 'agentic-som-overlay') return null;
        const tag = cur.tagName.toLowerCase();
        const role = (cur.getAttribute('role') || '').toLowerCase();
        const cls = typeof cur.className === 'string' ? cur.className.toLowerCase() : '';
        const id = (cur.id || '').toLowerCase();

        const isSemanticTag = ['article', 'section', 'nav', 'header', 'footer', 'aside', 'form', 'table'].includes(tag);
        const isSemanticRole = ['dialog', 'region', 'navigation', 'search', 'feed', 'listitem', 'form'].includes(role);
        const isCardClass = /(^|\s|-|_)(card|item|product|result|panel|box|container|widget|entry|listing)($|\s|-|_)/i.test(cls) ||
                            /(^|\s|-|_)(card|item|product|result|panel|box|widget)($|\s|-|_)/i.test(id);

        if (isSemanticTag || isSemanticRole || isCardClass) {
          const rect = cur.getBoundingClientRect();
          if (rect.width >= 35 && rect.height >= 24) {
            best = cur;
            if (tag === 'article' || tag === 'form' || isCardClass) break;
          }
        }
        cur = cur.parentElement;
      }
      return best;
    }

    function getLabel(c) {
      if (!c) return 'General Section';
      const aria = c.getAttribute('aria-label') || c.getAttribute('title');
      if (aria && aria.trim()) return aria.trim().slice(0, 40);
      const h = c.querySelector('h1, h2, h3, h4, h5, h6, [class*="title"], [class*="name"]');
      if (h && h.innerText && h.innerText.trim()) return h.innerText.trim().slice(0, 40);
      const tag = c.tagName.toLowerCase();
      if (tag === 'form') return 'Form Container';
      if (tag === 'nav') return 'Navigation Bar';
      if (tag === 'header') return 'Header';
      if (tag === 'footer') return 'Footer';
      if (tag === 'table') return 'Data Table';
      if (tag === 'article') return 'Content Card';
      if (tag === 'section') return 'Section Block';
      return 'Component Block';
    }

    const blockMap = new Map();
    interactive.forEach((el, idx) => {
      const container = findContainer(el);
      const key = container || document.body;
      if (!blockMap.has(key)) {
        blockMap.set(key, {
          container,
          label: getLabel(container),
          tag: container ? container.tagName.toLowerCase() : 'body',
          elements: [],
        });
      }
      blockMap.get(key).elements.push(items[idx]);
    });

    let bCounter = 1;
    const semanticBlocks = [];
    for (const [, bData] of blockMap.entries()) {
      if (bData.elements.length > 0) {
        semanticBlocks.push({
          blockId: bCounter++,
          label: bData.label,
          type: bData.tag,
          elementsCount: bData.elements.length,
          elements: bData.elements,
        });
      }
    }

    return {
      title: document.title,
      url: window.location.href,
      hasCanvas,
      interactiveElements: items.slice(0, 150),
      semanticBlocks: semanticBlocks.slice(0, 40),
    };
  });
}

/**
 * Computes a readable structural diff between before-action and after-action DOM states.
 */
export function computeDomDiff(beforeDom, afterDom) {
  if (!afterDom) {
    return {
      hasChanges: false,
      hasCanvas: false,
      diffSummary: "Page is unavailable, closed, or currently navigating.",
    };
  }

  if (!beforeDom) {
    return {
      hasChanges: true,
      hasCanvas: Boolean(afterDom.hasCanvas),
      diffSummary: `- Initial Page Loaded: "${afterDom.title || "Untitled"}" (${afterDom.url})\n- Interactive Elements Found: ${(afterDom.interactiveElements || []).length}`,
    };
  }

  const urlChanged = beforeDom.url !== afterDom.url;
  const titleChanged = beforeDom.title !== afterDom.title;

  const beforeList = beforeDom.interactiveElements || [];
  const afterList = afterDom.interactiveElements || [];

  const beforeSet = new Set(beforeList);
  const afterSet = new Set(afterList);

  const addedElements = afterList.filter((el) => !beforeSet.has(el));
  const removedElements = beforeList.filter((el) => !afterSet.has(el));

  const hasChanges = urlChanged || titleChanged || addedElements.length > 0 || removedElements.length > 0;
  const hasCanvas = Boolean(beforeDom.hasCanvas || afterDom.hasCanvas);

  const summaryParts = [];

  if (urlChanged) {
    summaryParts.push(`- Navigation: URL changed from "${beforeDom.url}" to "${afterDom.url}"`);
  } else {
    summaryParts.push(`- URL: ${afterDom.url}`);
  }

  if (titleChanged) {
    summaryParts.push(`- Page Title changed: "${afterDom.title}" (previously "${beforeDom.title}")`);
  }

  if (addedElements.length > 0) {
    summaryParts.push(`- Newly Appeared / Changed Elements (+${addedElements.length}):`);
    addedElements.slice(0, 10).forEach((el) => summaryParts.push(`    + ${el}`));
    if (addedElements.length > 10) {
      summaryParts.push(`    ... and ${addedElements.length - 10} more`);
    }
  }

  if (removedElements.length > 0) {
    summaryParts.push(`- Removed Elements (-${removedElements.length}):`);
    removedElements.slice(0, 8).forEach((el) => summaryParts.push(`    - ${el}`));
    if (removedElements.length > 8) {
      summaryParts.push(`    ... and ${removedElements.length - 8} more`);
    }
  }

  if (!hasChanges) {
    summaryParts.push("- No structural DOM element or URL changes detected.");
    if (hasCanvas) {
      summaryParts.push("  (Note: Page contains an active <canvas> element; visual changes may have occurred directly on the canvas.)");
    }
  }

  return {
    hasChanges,
    urlChanged,
    titleChanged,
    hasCanvas,
    addedCount: addedElements.length,
    removedCount: removedElements.length,
    diffSummary: summaryParts.join("\n"),
  };
}

/**
 * Determines whether visual screenshot inspection is required for a step.
 * In "hybrid" mode, standard DOM changes skip vision entirely.
 */
export function isVisualCheckRequired({
  instruction = "",
  toolName = "",
  domDiff = {},
  verificationMode = "hybrid",
  visionEnabled = false,
}) {
  if (!visionEnabled) return false;
  if (verificationMode === "dom_diff") return false;
  if (verificationMode === "vision") return true;

  // Hybrid Mode:
  const lowerInst = (instruction || "").toLowerCase();
  const lowerTool = (toolName || "").toLowerCase();

  // 1. Explicit visual terms in instruction (canvas, drawing, painting, image inspection, CAPTCHA)
  const visualKeywords = /\b(canvas|draw|drawing|sketch|paint|circle|box|rectangle|diagram|chart|graph|captcha|visual|visually|screenshot|look at|picture)\b/i;
  if (visualKeywords.test(lowerInst)) {
    return true;
  }

  // 2. Coordinate clicks or drawing tools on a page with a canvas
  if (domDiff.hasCanvas && (lowerTool.includes("coordinate") || lowerTool.includes("mouse") || lowerTool.includes("draw"))) {
    return true;
  }

  // 3. Action executed, but DOM had zero structural changes on a page with canvas (likely canvas-rendered app)
  if (domDiff.hasCanvas && !domDiff.hasChanges) {
    return true;
  }

  return false;
}
