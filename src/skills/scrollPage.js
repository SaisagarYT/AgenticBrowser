"use strict";

import { browserManager } from "../core/browserManager.js";
import { logger } from "../utils/logger.js";
import { SkillError } from "../utils/errors.js";

function resolveSelector(selector) {
  if (!selector) return "";
  const clean = selector.trim();
  if (/^\d+$/.test(clean)) {
    return `[mmid="${clean}"]`;
  }
  if (/^mmid=["']?(\d+)["']?$/i.test(clean)) {
    const num = clean.replace(/[^0-9]/g, "");
    return `[mmid="${num}"]`;
  }
  return clean;
}

/**
 * Scroll the page viewport or a specific scrollable container in a given direction.
 *
 * @param {Object} options
 * @param {string} [options.direction="down"] - "down", "up", "top", "bottom", "left", "right"
 * @param {number|string} [options.amount="auto"] - number of pixels (e.g. 600), "half_page", "full_page", or "auto"
 * @param {string} [options.selector=null] - Optional mmid or CSS selector for a specific scrollable container
 * @param {boolean} [options.smooth=true] - Whether to use smooth scrolling
 * @param {number} [options.delayMs=400] - Settle delay for dynamic loading / lazy images
 */
export async function scrollPage({
  direction = "down",
  amount = "auto",
  selector = null,
  smooth = true,
  delayMs = 400,
} = {}) {
  const page = await browserManager.getPage();
  const dir = String(direction || "down").toLowerCase().trim();
  const resolvedSelector = selector ? resolveSelector(selector) : null;

  logger.info(`[Scroll] Direction: "${dir}", Amount: "${amount}", Selector: ${resolvedSelector || "window"}`);

  try {
    const scrollResult = await page.evaluate(
      ({ dir, amount, selector, smooth }) => {
        // Find scroll target: container element or window
        let targetEl = null;
        if (selector) {
          targetEl = document.querySelector(selector);
        }

        const isWindow = !targetEl;
        const currentX = isWindow ? window.scrollX : targetEl.scrollLeft;
        const currentY = isWindow ? window.scrollY : targetEl.scrollTop;
        const viewportW = isWindow ? window.innerWidth : targetEl.clientWidth;
        const viewportH = isWindow ? window.innerHeight : targetEl.clientHeight;
        const totalW = isWindow ? Math.max(document.body.scrollWidth, document.documentElement.scrollWidth) : targetEl.scrollWidth;
        const totalH = isWindow ? Math.max(document.body.scrollHeight, document.documentElement.scrollHeight) : targetEl.scrollHeight;

        let deltaX = 0;
        let deltaY = 0;

        // Calculate scroll delta based on amount
        let pxAmount = 650; // default auto delta
        if (typeof amount === "number" && !isNaN(amount)) {
          pxAmount = Math.abs(amount);
        } else if (typeof amount === "string") {
          const lower = amount.toLowerCase().trim();
          if (lower === "full_page" || lower === "page") {
            pxAmount = Math.round(viewportH * 0.85);
          } else if (lower === "half_page") {
            pxAmount = Math.round(viewportH * 0.45);
          } else {
            const parsed = parseInt(lower, 10);
            if (!isNaN(parsed)) pxAmount = Math.abs(parsed);
          }
        }

        if (dir === "down") {
          deltaY = pxAmount;
        } else if (dir === "up") {
          deltaY = -pxAmount;
        } else if (dir === "left") {
          deltaX = -pxAmount;
        } else if (dir === "right") {
          deltaX = pxAmount;
        } else if (dir === "top") {
          deltaY = -currentY; // Scroll all the way to top
        } else if (dir === "bottom") {
          deltaY = totalH - currentY; // Scroll all the way to bottom
        } else {
          deltaY = pxAmount; // default down
        }

        const behavior = smooth ? "smooth" : "auto";

        if (isWindow) {
          if (dir === "top") {
            window.scrollTo({ top: 0, left: currentX, behavior });
          } else if (dir === "bottom") {
            window.scrollTo({ top: totalH, left: currentX, behavior });
          } else {
            window.scrollBy({ top: deltaY, left: deltaX, behavior });
          }
        } else {
          if (dir === "top") {
            targetEl.scrollTo({ top: 0, left: currentX, behavior });
          } else if (dir === "bottom") {
            targetEl.scrollTo({ top: totalH, left: currentX, behavior });
          } else {
            targetEl.scrollBy({ top: deltaY, left: deltaX, behavior });
          }
        }

        return {
          prevX: Math.round(currentX),
          prevY: Math.round(currentY),
          targetSelector: selector || "window",
          intendedDeltaX: deltaX,
          intendedDeltaY: deltaY,
        };
      },
      { dir, amount, selector: resolvedSelector, smooth }
    );

    // Wait for smooth scroll and lazy loading / dynamic render to settle
    await new Promise((r) => setTimeout(r, Math.max(delayMs, smooth ? 350 : 100)));

    // Re-render visual marks if SoM is active
    await page.evaluate(() => {
      if (typeof window.__renderVisualMarks === "function") {
        window.__renderVisualMarks();
      }
    }).catch(() => {});

    // Inspect new viewport measurements
    const finalMetrics = await page.evaluate(({ selector }) => {
      let targetEl = selector ? document.querySelector(selector) : null;
      const isWindow = !targetEl;

      const x = isWindow ? window.scrollX : targetEl.scrollLeft;
      const y = isWindow ? window.scrollY : targetEl.scrollTop;
      const vW = isWindow ? window.innerWidth : targetEl.clientWidth;
      const vH = isWindow ? window.innerHeight : targetEl.clientHeight;
      const tW = isWindow ? Math.max(document.body.scrollWidth, document.documentElement.scrollWidth) : targetEl.scrollWidth;
      const tH = isWindow ? Math.max(document.body.scrollHeight, document.documentElement.scrollHeight) : targetEl.scrollHeight;

      const maxScrollY = Math.max(0, tH - vH);
      const scrollPercent = maxScrollY > 0 ? Math.round((y / maxScrollY) * 100) : 100;
      const isAtBottom = y >= maxScrollY - 15;
      const isAtTop = y <= 5;

      return {
        scrollX: Math.round(x),
        scrollY: Math.round(y),
        viewportWidth: vW,
        viewportHeight: vH,
        totalWidth: tW,
        totalHeight: tH,
        maxScrollY,
        scrollPercent,
        isAtTop,
        isAtBottom,
      };
    }, { selector: resolvedSelector });

    const movedY = finalMetrics.scrollY - scrollResult.prevY;
    const movedX = finalMetrics.scrollX - scrollResult.prevX;

    const message = `Scrolled ${dir} ${Math.abs(movedY || movedX)}px. Position: ${finalMetrics.scrollY}/${finalMetrics.totalHeight}px (${finalMetrics.scrollPercent}%). ${
      finalMetrics.isAtBottom ? "Reached page bottom." : finalMetrics.isAtTop ? "At top of page." : ""
    }`.trim();

    logger.info(`[Scroll Complete] ${message}`);

    return {
      success: true,
      direction: dir,
      movedY,
      movedX,
      ...finalMetrics,
      message,
    };
  } catch (err) {
    logger.error(`Scroll failed: ${err.message}`);
    throw new SkillError(`Scroll failed: ${err.message}`);
  }
}

/**
 * Scroll specifically to bring a target element (button, link, heading, or card) into the center of the viewport.
 *
 * @param {Object} options
 * @param {string} options.selector - mmid (e.g. "12") or CSS selector of the target element
 * @param {string} [options.block="center"] - "center", "start", "end", "nearest"
 * @param {number} [options.delayMs=350] - Settle delay
 */
export async function scrollToElement({ selector, block = "center", delayMs = 350 } = {}) {
  if (!selector) throw new SkillError("Selector parameter is required for scroll_to_element");

  const page = await browserManager.getPage();
  const resolved = resolveSelector(selector);

  logger.info(`[ScrollToElement] Scrolling element into view: ${resolved}`);

  try {
    const res = await page.evaluate(
      ({ selector, block }) => {
        const el = document.querySelector(selector);
        if (!el) {
          return { found: false };
        }

        el.scrollIntoView({ behavior: "smooth", block, inline: "center" });
        const rect = el.getBoundingClientRect();
        return {
          found: true,
          tagName: el.tagName.toLowerCase(),
          mmid: el.getAttribute("mmid") || null,
          text: (el.innerText || el.textContent || "").trim().slice(0, 50),
          rect: {
            top: Math.round(rect.top),
            left: Math.round(rect.left),
            width: Math.round(rect.width),
            height: Math.round(rect.height),
          },
        };
      },
      { selector: resolved, block }
    );

    if (!res.found) {
      throw new Error(`Element not found with selector: ${resolved}`);
    }

    await new Promise((r) => setTimeout(r, delayMs));

    // Update Set-of-Marks tags
    await page.evaluate(() => {
      if (typeof window.__renderVisualMarks === "function") {
        window.__renderVisualMarks();
      }
    }).catch(() => {});

    const msg = `Scrolled element ${resolved} (${res.tagName}${res.text ? ` "${res.text}"` : ""}) into center of viewport.`;
    logger.info(`[ScrollToElement] ${msg}`);

    return {
      success: true,
      selector: resolved,
      element: res,
      message: msg,
    };
  } catch (err) {
    logger.error(`scrollToElement failed: ${err.message}`);
    throw new SkillError(`Scroll to element failed: ${err.message}`);
  }
}
