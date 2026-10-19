"use strict";

/**
 * Speech Filter & Conversational Distiller
 * Prepares raw LLM text and markdown for natural, conversational human speech.
 * Distills complex markdown/task reports into short, human-like voice summaries.
 */

/**
 * Basic cleaner: strips code blocks, URLs, markdown symbols, and technical jargon.
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

  // 11. Limit length to ~350 characters for conversational brevity
  if (text.length > 400) {
    const cutIdx = text.lastIndexOf(".", 350);
    if (cutIdx > 120) {
      text = text.slice(0, cutIdx + 1);
    } else {
      text = text.slice(0, 350) + "...";
    }
  }

  return text;
}

/**
 * Conversational Distiller: Converts full written chat responses into a short,
 * human-like spoken response (1-2 crisp sentences, max ~25-30 words) for Kira's voice.
 *
 * @param {string} rawText Full written markdown response from the agent
 * @param {string} [userPrompt] Optional original user prompt for semantic context
 * @returns {string} Short, natural, spoken human response
 */
export function generateSpokenSummary(rawText, userPrompt = "") {
  if (!rawText || typeof rawText !== "string") {
    return "I've completed your task. Check the chat for details.";
  }

  const trimmed = rawText.trim();

  // 1. Direct conversational greetings & simple answers
  if (/^(hello|hi|hey|good\s+(morning|afternoon|evening)|howdy|welcome)\b/i.test(trimmed)) {
    const firstLine = trimmed.split(/\n+/)[0] || trimmed;
    const cleanFirst = firstLine.replace(/[*_#`]/g, "").trim();
    if (cleanFirst.length > 0 && cleanFirst.length < 120) {
      return cleanFirst;
    }
  }

  // 2. Error reports
  if (/^(error|failed|failure|unable to|could not|exception)\b/i.test(trimmed)) {
    return "I ran into an issue completing that. Please check the details in your chat.";
  }

  // 3. Downloaded scholarly articles / files
  if (/(downloaded|saved|retrieved)\s+(\d+|several|all)?\s*(articles?|papers?|files?|pdfs?)/i.test(trimmed)) {
    const match = trimmed.match(/(?:downloaded|saved|retrieved)\s+(\d+|several|three|two|four)?\s*(articles?|papers?|files?|pdfs?)/i);
    const count = match && match[1] ? match[1] : "the requested";
    const itemType = match && match[2] ? match[2] : "articles";
    return `I've downloaded ${count} ${itemType} to your downloads folder. Full details are in your chat.`;
  }

  // 4. Web navigation & search queries
  if (/(navigated to|opened|searched for|found\s+\d+)/i.test(trimmed)) {
    const lines = trimmed.split("\n").filter(l => l.trim().length > 0);
    const firstActionLine = lines.find(l => !l.startsWith("#") && !l.startsWith("```"));
    if (firstActionLine) {
      let clean = cleanTextForSpeech(firstActionLine);
      if (clean.length > 20 && clean.length < 130) {
        return clean.endsWith(".") ? clean : clean + ".";
      }
    }
  }

  // 5. General Responses: Extract the first meaningful sentence and cap at ~25 words
  // Strip code blocks and markdown headings first
  let cleaned = trimmed
    .replace(/```[\s\S]*?```/g, "")
    .replace(/^#+\s+.*$/gm, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[*_~`]/g, "")
    .replace(/\{[\s\S]*?\}/g, "");

  // Find sentences
  const sentences = cleaned
    .split(/(?<=[.!?])\s+|\n+/)
    .map(s => s.trim())
    .filter(s => s.length > 15 && !s.startsWith("-") && !s.startsWith("*") && !s.startsWith("1."));

  if (sentences.length > 0) {
    let candidate = sentences[0];

    // If candidate contains path or technical artifacts, generalize it
    candidate = candidate.replace(/[A-Z]:\\[^\s]+/g, "your local folder");
    candidate = candidate.replace(/https?:\/\/[^\s]+/g, "the webpage");

    // Keep under ~150 chars or ~25 words
    const words = candidate.split(/\s+/);
    if (words.length > 28) {
      candidate = words.slice(0, 24).join(" ") + "...";
    }

    if (!candidate.endsWith(".") && !candidate.endsWith("!") && !candidate.endsWith("?")) {
      candidate += ".";
    }

    // Add conversational touch if candidate is very short
    if (words.length <= 12 && !candidate.toLowerCase().includes("chat")) {
      return candidate + " Details are in your chat.";
    }

    return candidate;
  }

  return "I've completed your task. Check the chat for details.";
}
