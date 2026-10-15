"use strict";

import { llmClient } from "../core/llmClient.js";
import { config } from "../config.js";
import { logger } from "./logger.js";

export async function analyzeScreenshots({ base64Before, base64After, actionDescription, expectedResult }) {
  if (!config.llm.visionEnabled) {
    return "Screenshot vision analysis is disabled.";
  }

  const prompt = `
You are the visual verification module of an autonomous browser agent.
Compare the two screenshots (Before and After the action was taken).

Action Attempted: "${actionDescription}"
Expected Outcome: "${expectedResult || "Visual confirmation of action"}"

Answer the following concisely:
1. Did the page visually change as expected?
2. Are there any errors, popups, captchas, or unexpected banners visible?
3. What is the current visible state of the page relevant to the goal?
`.trim();

  try {
    const analysis = await llmClient.analyzeVision({
      prompt,
      base64Before,
      base64After,
    });
    return analysis;
  } catch (err) {
    logger.warn(`Screenshot visual analysis skipped: ${err.message}`);
    return `Visual analysis unavailable: ${err.message}`;
  }
}
