"use strict";

import { llmClient } from "../core/llmClient.js";
import { logger } from "../utils/logger.js";
import { generateSpokenSummary } from "../core/voice/speechFilter.js";

const VOICE_COMPANION_SYSTEM_PROMPT = `
<agent_role>
You are "Kira", an intelligent, warm, articulate, and natural personal voice companion for an autonomous browser system.
The user is having a spoken, human-to-human conversation with you.
While the user interacts with you, an autonomous browser agent executes technical commands in the background (navigating, clicking, searching, downloading).
</agent_role>

<your_task>
You monitor the user's spoken request and the browser agent's actions/results.
Formulate YOUR OWN direct, spoken response to the user.
Do NOT recite the browser agent's chat report.
Do NOT read technical markdown, bullet points, file paths, URLs, or code.
</your_task>

<conversational_rules>
1. Brevity: Speak only 1 to 2 crisp, human sentences (strictly under 25 words).
2. Persona: Warm, lively, confident companion (like a real human assistant next to them).
3. If the user asked a conversational question or greeting, answer them directly and naturally.
4. If a task was performed (e.g. search, booking, downloads), confirm the outcome casually and warmly (e.g. "I've pulled up the flight options on Google Flights for you.", "I found the papers you wanted and downloaded all three to your folder.").
5. If there was an issue, explain it warmly in one sentence (e.g. "I ran into a problem loading that page, but the details are in your chat.").
6. Output ONLY the words to speak aloud. No quotes, no markdown, no prefixes.
</conversational_rules>
`.trim();

/**
 * Sanitizes Kira's spoken utterance to ensure complete, natural sentences
 * and eliminates trailing truncated prepositions or cut-offs.
 *
 * @param {string} text
 * @returns {string}
 */
export function sanitizeSpokenUtterance(text) {
  if (!text || typeof text !== "string") return "";
  let clean = text.replace(/[*_#`"]/g, "").replace(/\s+/g, " ").trim();

  // Strip trailing dangling prepositions/conjunctions caused by token limits
  clean = clean.replace(/\b(to|and|with|for|the|that|of|in|on|at|by|from|about|into|through|during|before|after|a|an)\s*$/i, "").trim();

  // If there are multiple sentences and the last one is truncated without punctuation, trim to last complete sentence
  const lastPunct = Math.max(clean.lastIndexOf("."), clean.lastIndexOf("!"), clean.lastIndexOf("?"));
  if (lastPunct > 20 && lastPunct < clean.length - 1) {
    clean = clean.slice(0, lastPunct + 1).trim();
  } else if (!clean.endsWith(".") && !clean.endsWith("!") && !clean.endsWith("?")) {
    clean += ".";
  }

  // Ensure conversational brevity (under 30 words)
  const words = clean.split(/\s+/);
  if (words.length > 30) {
    clean = words.slice(0, 26).join(" ") + "...";
  }

  return clean;
}

export class VoiceAgent {
  /**
   * Generates Kira's dedicated voice companion response.
   *
   * @param {Object} params
   * @param {string} params.userCommand The user's original query or speech
   * @param {string} params.agentOutcome The browser agent's detailed written response
   * @param {string} [params.taskStatus] 'COMPLETED' | 'FAILED' | 'RUNNING'
   * @param {string} [params.model] Optional model override
   * @returns {Promise<string>} Short, natural companion response to speak aloud
   */
  static async generateVoiceResponse({ userCommand = "", agentOutcome = "", taskStatus = "COMPLETED", model = null }) {
    logger.info(`[VoiceAgent] Formulating Kira companion voice response for: "${(userCommand || "").slice(0, 50)}..."`);

    // Fast-path 1: Instant responses for common conversational queries
    const trimmedQuery = (userCommand || "").trim();
    if (/^(hi|hello|hey|hiya|howdy)[.!?]*$/i.test(trimmedQuery)) {
      return "Hello! How can I help you today?";
    }
    if (/^(thank\s*you|thanks|thx)[.!?]*$/i.test(trimmedQuery)) {
      return "You're very welcome!";
    }
    if (/^(who\s+are\s+you|what\s+is\s+your\s+name)[.!?]*$/i.test(trimmedQuery)) {
      return "I'm Kira, your autonomous browser companion.";
    }
    if (/^(good\s+job|great\s+job|well\s+done|awesome)[.!?]*$/i.test(trimmedQuery)) {
      return "Glad I could help!";
    }

    // Fast-path 2: If the agent outcome is already a concise, clean sentence under 18 words, return immediately
    const cleanOutcome = (agentOutcome || "").trim();
    if (
      cleanOutcome.length > 5 &&
      cleanOutcome.length < 110 &&
      !cleanOutcome.includes("\n") &&
      !cleanOutcome.includes("http") &&
      !cleanOutcome.includes("```") &&
      !cleanOutcome.includes("#") &&
      !cleanOutcome.includes("[")
    ) {
      return sanitizeSpokenUtterance(cleanOutcome);
    }

    try {
      // Use LLM with a 2.5 second timeout guard for instant companion latency
      const prompt = `User said: "${userCommand || 'Automate task'}"\nBrowser Agent Result:\n${(agentOutcome || '').slice(0, 1000)}\nStatus: ${taskStatus}\n\nWhat do you say to the user?`;

      const llmPromise = llmClient.generateText({
        systemPrompt: VOICE_COMPANION_SYSTEM_PROMPT,
        userPrompt: prompt,
        temperature: 0.6,
        maxTokens: 120,
        model: model || undefined,
      });

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("VoiceAgent LLM timeout")), 2500)
      );

      const response = await Promise.race([llmPromise, timeoutPromise]);
      const sanitized = sanitizeSpokenUtterance(response || "");

      if (sanitized.length > 5 && sanitized.length < 250) {
        logger.info(`[VoiceAgent] Generated voice companion response: "${sanitized}"`);
        return sanitized;
      }
    } catch (err) {
      logger.warn(`[VoiceAgent] LLM fallback notice (${err.message}). Using instant conversational distillation.`);
    }

    // Instant deterministic fallback via linguistic distiller
    const distilled = generateSpokenSummary(agentOutcome, userCommand);
    return sanitizeSpokenUtterance(distilled);
  }
}

