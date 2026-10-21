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
    candidate = candidate.replace(/[A-Za-z]:\\[^\s]+/g, "your local folder");
    candidate = candidate.replace(/(?:\/[a-zA-Z0-9._-]+){2,}\.[a-zA-Z0-9]+/g, "your local file");
    candidate = candidate.replace(/https?:\/\/[^\s]+/g, "the webpage");

    // Keep under ~150 chars or ~25 words
    const words = candidate.split(/\s+/);
    if (words.length > 28) {
      candidate = words.slice(0, 24).join(" ") + "...";
    }

    if (!candidate.endsWith(".") && !candidate.endsWith("!") && !candidate.endsWith("?")) {
      candidate += ".";
    }

    // Add conversational touch only if action was performed and not a casual conversational sentence
    const isConversational = /^(hi|hello|hey|good\s+|i am|i'm|sure|yes|no|certainly|glad|how)\b/i.test(candidate);
    if (words.length <= 12 && !isConversational && !candidate.toLowerCase().includes("chat") && !candidate.toLowerCase().includes("detail")) {
      return candidate + " Details are in your chat.";
    }

    return candidate;
  }

  return "I've completed your task. Check the chat for details.";
}

/**
 * Speech Input Normalizer: Cleans, refines, and corrects phonetic slips and technical
 * terminology in spoken user queries before sending them to the agent planner.
 *
 * @param {string} rawSpeech
 * @returns {string}
 */
export function normalizeVoiceInput(rawSpeech) {
  if (!rawSpeech || typeof rawSpeech !== "string") return "";

  let text = rawSpeech.trim().replace(/\s+/g, " ");

  // 1. Common conversational web command prefixes
  text = text
    .replace(/^(?:hey\s+kira|kira|hey\s+browser|can\s+you\s+please|please|could\s+you)\s+/i, "")
    .trim();

  // 2. Technical acronyms and brand names (case & phonetic fixes)
  const technicalReplacements = [
    [/\b(?:a\s+i|eye(?=\s+(?:in\s+a|in|model|agent|bubble|tech|trend|research)))\b/gi, "AI"],
    [/\b(?:a\s+i)\b/gi, "AI"],
    [/\b(?:l\s+l\s+m|l\s+lm|llm)\b/gi, "LLM"],
    [/\b(?:g\s+p\s+t|gpt)\b/gi, "GPT"],
    [/\b(?:chat\s*gpt)\b/gi, "ChatGPT"],
    [/\b(?:p\s+d\s+f|pdf)\b/gi, "PDF"],
    [/\b(?:u\s+r\s+l|url)\b/gi, "URL"],
    [/\b(?:a\s+p\s+i|api)\b/gi, "API"],
    [/\b(?:you\s*tube)\b/gi, "YouTube"],
    [/\b(?:git\s*hub)\b/gi, "GitHub"],
    [/\b(?:ar\s*k?ive?|r\s*kive?|arxiv)\b/gi, "arXiv"],
    [/\b(?:wiki\s*pedia)\b/gi, "Wikipedia"],
    [/\b(?:hugging\s*face)\b/gi, "Hugging Face"],
    [/\b(?:u\s*i)\b/gi, "UI"],
    [/\b(?:u\s*x)\b/gi, "UX"],
    [/\b(?:html|h\s+t\s+m\s+l)\b/gi, "HTML"],
    [/\b(?:css|c\s+s\s+s)\b/gi, "CSS"],
    [/\b(?:js|javascript|java\s+script)\b/gi, "JavaScript"],
  ];

  for (const [pattern, replacement] of technicalReplacements) {
    text = text.replace(pattern, replacement);
  }

  // 3. Domain navigation expansions (e.g. "go to youtube.com" or "go to youtube dot com" -> "Open youtube.com")
  text = text.replace(/^(?:open\s+up|go\s+to|navigate\s+to)\s+([a-zA-Z0-9-]+)(?:\s+dot\s+com|\.com)\b/i, (m, domain) => `Open ${domain.toLowerCase()}.com`);

  // 4. Ensure first character is capitalized
  if (text.length > 0) {
    text = text.charAt(0).toUpperCase() + text.slice(1);
  }

  return text;
}

/**
 * Distills live intermediate browser actions and plan steps into brief, natural
 * spoken co-pilot phrases (strictly under 8 words) for real-time progress narration.
 *
 * @param {string} rawText The action description or plan step instruction
 * @param {string} [type] "plan" | "browser" | "artifact" | "download"
 * @returns {string} Short co-pilot phrase to speak, or empty string if action should be silent
 */
export function distillProgressForSpeech(rawText, type = "browser") {
  if (!rawText || typeof rawText !== "string") return "";
  const trimmed = rawText.trim();

  // 1. Skip noisy, micro, or internal actions that shouldn't interrupt speech
  if (/(?:cookie|consent|scroll|screenshot|evaluat|wait|sleep|viewport|press\s+key)/i.test(trimmed)) {
    return "";
  }

  // 2. Download / Artifact actions
  if (type === "artifact" || type === "download" || /download/i.test(trimmed)) {
    return "Downloading the file for you.";
  }

  // 3. Navigation to URLs
  const urlMatch = trimmed.match(/https?:\/\/(?:www\.)?([a-zA-Z0-9.-]+)/i);
  if (urlMatch && urlMatch[1]) {
    const host = urlMatch[1].replace(/\.(com|org|net|io|edu|gov|ai)$/i, "");
    let siteName = host.charAt(0).toUpperCase() + host.slice(1);
    if (/goldmansachs/i.test(host)) siteName = "Goldman Sachs";
    if (/arxiv/i.test(host)) siteName = "arXiv";
    if (/github/i.test(host)) siteName = "GitHub";
    if (/google/i.test(host)) siteName = "Google";
    if (/wikipedia/i.test(host)) siteName = "Wikipedia";
    return `Opening ${siteName} now.`;
  }

  // 4. Web searches
  const searchMatch = trimmed.match(/(?:searched\s+for|search\s+for|search\s+google\s+for)\s+['"]?([^'";\n]+)['"]?/i);
  if (searchMatch && searchMatch[1]) {
    const query = searchMatch[1].trim().split(/\s+/).slice(0, 5).join(" ");
    return `Searching for ${query}.`;
  }

  // 5. Clicks on meaningful links/buttons
  const clickMatch = trimmed.match(/(?:clicked\s+on|click)\s+['"]?([^'";\n]{3,30})['"]?/i);
  if (clickMatch && clickMatch[1] && !/(?:submit|button|div|span|input)/i.test(clickMatch[1])) {
    return `Opening ${clickMatch[1].trim()}.`;
  }

  // 6. Plan step instructions
  if (type === "plan" && trimmed.length > 5 && trimmed.length < 90) {
    let clean = cleanTextForSpeech(trimmed);
    clean = clean.replace(/^(?:step\s+\d+:?|first,?|next,?|then,?)\s*/i, "");
    const words = clean.split(/\s+/);
    if (words.length <= 7) {
      return clean.endsWith(".") ? clean : clean + ".";
    }
  }

  return "";
}
