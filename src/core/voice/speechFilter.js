"use strict";

/**
 * Speech Filter
 * Prepares raw LLM text and markdown for natural, conversational human speech.
 * Strips code blocks, URLs, markdown symbols, and technical jargon.
 */

export function cleanTextForSpeech(rawText) {
  if (!rawText || typeof rawText !== "string") return "";

  let text = rawText;

  // 1. Remove code blocks ```...``` completely
  text = text.replace(/```[\s\S]*?```/g, " [code snippet omitted] ");

  // 2. Remove inline code `...`
  text = text.replace(/`([^`]+)`/g, "$1");

  // 3. Remove HTML tags <...>
  text = text.replace(/<[^>]+>/g, " ");

  // 4. Transform Markdown links: [GitHub](https://github.com) -> "GitHub"
  text = text.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");

  // 5. Replace bare URLs (https://www.google.com/path -> "google.com")
  text = text.replace(/https?:\/\/(?:www\.)?([a-zA-Z0-9.-]+)(?:\/[^\s]*)?/g, "$1");

  // 6. Remove JSON payloads { ... }
  text = text.replace(/\{[\s\S]*?\}/g, " ");

  // 7. Strip Markdown formatting symbols: *, _, #, >, ~, |
  text = text.replace(/[*_#~>|]/g, " ");

  // 8. Replace bullet points (- item or * item or 1. item) with commas/pauses
  text = text.replace(/^\s*[-*]\s+/gm, " ");
  text = text.replace(/^\s*\d+\.\s+/gm, " ");

  // 9. Clean up multiple punctuation marks or ellipses
  text = text.replace(/\.{2,}/g, ".");
  text = text.replace(/!{2,}/g, "!");
  text = text.replace(/\?{2,}/g, "?");

  // 10. Normalize whitespace
  text = text.replace(/\s+/g, " ").trim();

  // 11. Limit length to ~350 characters for conversational brevity if needed
  if (text.length > 400) {
    // Find the last period before 350 chars
    const cutIdx = text.lastIndexOf(".", 350);
    if (cutIdx > 120) {
      text = text.slice(0, cutIdx + 1);
    } else {
      text = text.slice(0, 350) + "...";
    }
  }

  return text;
}
