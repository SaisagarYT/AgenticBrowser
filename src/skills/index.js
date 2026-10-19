"use strict";

import { openUrl } from "./openUrl.js";
import { getUrl } from "./getUrl.js";
import { clickSelector } from "./clickSelector.js";
import { enterText } from "./enterText.js";
import { enterTextAndClick } from "./enterTextAndClick.js";
import { pressKey } from "./pressKey.js";
import { googleSearch } from "./googleSearch.js";
import { getDomContent } from "./getDomContent.js";
import { extractPdfText } from "./pdfExtractor.js";
import { takeScreenshot } from "./takeScreenshot.js";
import { finalResponse } from "./finalResponse.js";
import { SkillError } from "../utils/errors.js";

export const SKILL_REGISTRY = {
  open_url: openUrl,
  get_url: getUrl,
  click_using_selector: clickSelector,
  enter_text_using_selector: enterText,
  enter_text_and_click: enterTextAndClick,
  press_key_combination: pressKey,
  google_search: googleSearch,
  get_dom_with_content_type: getDomContent,
  pdf_text_extractor: extractPdfText,
  take_screenshot: takeScreenshot,
  final_response: finalResponse,
};

export const TOOL_DESCRIPTIONS = [
  {
    name: "open_url",
    description: "Navigate directly to a web page by URL.",
    parameters: { url: "string (e.g. 'https://www.amazon.in')" },
  },
  {
    name: "get_url",
    description: "Get the current URL and page title.",
    parameters: {},
  },
  {
    name: "click_using_selector",
    description: "Click an interactive element (button, link, or [pdf] download button) using its mmid attribute (e.g. '5' or '[mmid=\"5\"]') or CSS selector. If clicking a PDF/download link, automatically captures the browser download into the downloads library.",
    parameters: { selector: "string" },
  },
  {
    name: "enter_text_using_selector",
    description: "Type text into an input field or textarea identified by mmid or selector.",
    parameters: { selector: "string", text: "string", pressEnter: "boolean (optional)" },
  },
  {
    name: "enter_text_and_click",
    description: "Atomic typing into an input field and clicking a submit button in one action.",
    parameters: { inputSelector: "string", text: "string", clickSelector: "string" },
  },
  {
    name: "press_key_combination",
    description: "Press a keyboard key or combination (e.g. 'Enter', 'Tab', 'Escape', 'Control+A').",
    parameters: { key: "string" },
  },
  {
    name: "google_search",
    description: "Search Google for websites or information when a direct URL is unknown.",
    parameters: { query: "string", num: "number (optional, default 10)" },
  },
  {
    name: "get_dom_with_content_type",
    description: "Extract the page DOM to inspect interactive elements tagged with mmid attributes or read clean text.",
    parameters: { contentType: "'fields' (interactive items) or 'text_only' (readable text)" },
  },
  {
    name: "pdf_text_extractor",
    description: "Extract text from an online PDF link or local PDF file.",
    parameters: { pdfSource: "string (URL or filepath)" },
  },
  {
    name: "take_screenshot",
    description: "Save a screenshot of the current page viewport to disk.",
    parameters: { name: "string (optional filename prefix)" },
  },
  {
    name: "final_response",
    description: "Submit the final answer to the user's task request.",
    parameters: { answer: "string", summary: "string (optional)" },
  },
];

export async function executeSkill(skillName, params = {}) {
  const normalized = skillName.trim().toLowerCase();
  const handler = SKILL_REGISTRY[normalized];

  if (!handler) {
    throw new SkillError(`Unknown skill: "${skillName}". Available skills: ${Object.keys(SKILL_REGISTRY).join(", ")}`);
  }

  return await handler(params);
}
