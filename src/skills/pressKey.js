"use strict";

import { browserManager } from "../core/browserManager.js";
import { logger } from "../utils/logger.js";
import { SkillError } from "../utils/errors.js";

export async function pressKey({ key }) {
  if (!key) throw new SkillError("Key parameter is required");

  logger.info(`Pressing key combination: ${key}`);
  const page = await browserManager.getPage();

  try {
    await page.keyboard.press(key);
    return {
      success: true,
      key,
      message: `Successfully pressed key "${key}"`,
    };
  } catch (err) {
    throw new SkillError(`Failed to press key "${key}": ${err.message}`);
  }
}
