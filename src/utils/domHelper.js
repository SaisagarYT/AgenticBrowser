"use strict";

export const DOM_INJECTION_SCRIPT = `
(() => {
  let counter = 1;
  const elements = document.querySelectorAll('a, button, input, textarea, select, [role="button"], [role="link"], [role="checkbox"], [tabindex], [contenteditable="true"]');
  
  elements.forEach((el) => {
    if (!el.getAttribute('mmid')) {
      el.setAttribute('mmid', String(counter++));
    }
  });

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

export async function extractDomRepresentation(page, contentType = "fields") {
  await tagInteractiveElements(page);

  if (contentType === "text_only") {
    return await page.evaluate(() => {
      const clone = document.body.cloneNode(true);
      const scripts = clone.querySelectorAll("script, style, noscript, svg");
      scripts.forEach((s) => s.remove());
      return clone.innerText.replace(/\\n{3,}/g, "\\n\\n").trim();
    });
  }

  // "fields" or full representation
  return await page.evaluate(() => {
    const hasCanvas = !!document.querySelector("canvas");
    const interactive = Array.from(
      document.querySelectorAll('[mmid]')
    );

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

    return {
      title: document.title,
      url: window.location.href,
      hasCanvas,
      interactiveElements: items.slice(0, 150),
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
