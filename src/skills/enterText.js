"use strict";

import { browserManager } from "../core/browserManager.js";
import { logger } from "../utils/logger.js";
import { SkillError } from "../utils/errors.js";

function resolveSelector(selector) {
  if (!selector) return "";
  const clean = selector.trim();
  if (/^\d+$/.test(clean)) return `[mmid="${clean}"]`;
  if (/^mmid=["']?(\d+)["']?$/i.test(clean)) {
    const num = clean.replace(/[^0-9]/g, "");
    return `[mmid="${num}"]`;
  }
  return clean;
}

export async function enterText({ selector, text, pressEnter = false, clearBefore = true }) {
  if (!selector) throw new SkillError("Selector parameter is required");
  if (text === undefined || text === null) throw new SkillError("Text parameter is required");

  const resolved = resolveSelector(selector);
  logger.info(`Entering text into "${resolved}": "${text}"`);
  const page = await browserManager.getPage();

  try {
    const element = page.locator(resolved).first();
    await element.waitFor({ state: "visible", timeout: 10000 });
    await element.scrollIntoViewIfNeeded();

    if (clearBefore) {
      await element.fill("");
    }

    await element.fill(String(text));

    if (pressEnter) {
      await element.press("Enter");
    }

    return {
      success: true,
      selector: resolved,
      enteredText: text,
      message: `Successfully entered text into "${resolved}"`,
    };
  } catch (err) {
    throw new SkillError(`Failed to enter text into "${resolved}": ${err.message}`);
  }
}
