"use strict";

import { browserManager } from "../core/browserManager.js";

export async function takeScreenshot({ name = "capture" } = {}) {
  const result = await browserManager.captureScreenshot(name);
  return {
    filename: result.filename,
    filepath: result.filepath,
    message: `Saved screenshot to ${result.filename}`,
  };
}
