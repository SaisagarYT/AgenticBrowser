"use strict";

import { browserManager } from "../core/browserManager.js";
import { logger } from "../utils/logger.js";
import { SkillError } from "../utils/errors.js";
import { highlightActionElement } from "../utils/domHelper.js";

function resolveSelector(selector) {
  if (!selector) return "";
  const clean = selector.trim();
  // If it's a numeric mmid
  if (/^\d+$/.test(clean)) {
    return `[mmid="${clean}"]`;
  }
  // If user passes mmid="1" or mmid=1
  if (/^mmid=["']?(\d+)["']?$/i.test(clean)) {
    const num = clean.replace(/[^0-9]/g, "");
    return `[mmid="${num}"]`;
  }
  return clean;
}

export async function clickSelector({ selector, timeout = 10000 }) {
  if (!selector) throw new SkillError("Selector parameter is required");

  const resolved = resolveSelector(selector);
  logger.info(`Clicking element: ${resolved}`);
  const page = await browserManager.getPage();

  try {
    const element = page.locator(resolved).first();
    await element.waitFor({ state: "visible", timeout });
    await element.scrollIntoViewIfNeeded();

    // Trigger visual action highlight & click ripple badge (Phase 2)
    await highlightActionElement(page, { selector: resolved, actionType: "click" }).catch(() => {});
    await new Promise((r) => setTimeout(r, 220));

    try {
      await element.click({ timeout: Math.min(timeout, 3500) });
    } catch (clickErr) {
      if (
        clickErr.message.includes("intercepts pointer events") ||
        clickErr.message.includes("Timeout") ||
        clickErr.message.includes("not visible")
      ) {
        logger.warn(`Click on "${resolved}" intercepted or obscured (${clickErr.message.split("\n")[0]}). Retrying with force click...`);
        try {
          await element.click({ force: true, timeout: 3000 });
        } catch (forceErr) {
          logger.warn(`Force click failed on "${resolved}". Dispatching direct DOM click event...`);
          await element.evaluate((el) => {
            el.scrollIntoView({ block: "center", inline: "center" });
            el.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, view: window }));
            if (typeof el.click === "function") el.click();
          });
        }
      } else {
        throw clickErr;
      }
    }

    return {
      success: true,
      selector: resolved,
      message: `Successfully clicked element matching "${resolved}"`,
    };
  } catch (err) {
    throw new SkillError(`Failed to click "${resolved}": ${err.message}`);
  }
}
