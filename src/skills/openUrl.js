"use strict";

import { browserManager } from "../core/browserManager.js";
import { logger } from "../utils/logger.js";
import { BrowserNavigationError } from "../utils/errors.js";

export async function openUrl({ url }) {
  if (!url) throw new BrowserNavigationError("URL parameter is required");

  let formattedUrl = url.trim();
  if (!/^https?:\/\//i.test(formattedUrl)) {
    formattedUrl = `https://${formattedUrl}`;
  }

  logger.info(`Navigating to URL: ${formattedUrl}`);
  const page = await browserManager.getPage();

  try {
    const response = await page.goto(formattedUrl, { waitUntil: "domcontentloaded" });
    const status = response ? response.status() : "unknown";
    const title = await page.title();

    try {
      const { uiManager } = await import("../utils/uiManager.js");
      await uiManager.injectOverlay(page);
    } catch {
      // Ignore
    }

    return {
      success: true,
      url: page.url(),
      title,
      statusCode: status,
      message: `Successfully navigated to ${formattedUrl} (${title})`,
    };
  } catch (err) {
    throw new BrowserNavigationError(`Failed to navigate to ${formattedUrl}: ${err.message}`);
  }
}
