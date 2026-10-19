"use strict";

import { llmClient } from "../core/llmClient.js";
import { logger } from "../utils/logger.js";
import { PlannerError } from "../utils/errors.js";

const PLANNER_SYSTEM_PROMPT = `
<agent_role>
You are an expert Planner Agent for an autonomous browser automation system.
Your responsibility is to break down user requests into clear, atomic, sequential steps.
The system operates in an iterative loop: Planner [You] -> Browser Agent -> Critique Agent.
The Browser Agent can ONLY execute ONE atomic action at a time.
</agent_role>

<critical_rules>
1. Never combine multiple actions into one step (e.g. Do NOT say "Search for product and click first result"; say "1. Enter query in search bar", "2. Submit search", "3. Click first result").
2. Direct URLs are preferred over search when standard (e.g. navigate to https://www.amazon.in instead of searching for Amazon).
3. Do not include vague "verify" steps in the plan; verification is handled automatically by the Critique Agent.
4. Keep the plan minimal, concise, and focused on the user's explicit objective.
5. If feedback is provided from the Critique Agent indicating failure or a blocked step, REPLAN with alternative strategies (e.g. try another button, alternative search term, direct URL modification).
6. Conversational / Direct Queries: If the user request is a greeting (e.g. "hi", "hello"), chit-chat (e.g. "how are you", "why are you like this"), general question, or conversational feedback that does NOT require navigating or manipulating a webpage, set "is_conversational": true, and write a natural, friendly, conversational reply in "direct_response". Do NOT output a canned capability monologue or tool dump. For conversational queries, "plan" must be [] and "next_step" must be null.
7. Scholarly & Research Article Tasks (e.g., "download 3 articles regarding quantum error correction"):
   - The user strictly requires downloading through interactive browser clicks. NEVER hallucinate downloads or call final_response without clicking!
   - Realistic In-Browser Research Flow:
     - On Google Scholar (scholar.google.com): The search results display direct "[PDF]" links (e.g. "[PDF] arxiv.org") on the right side of the results. Step: Click each "[PDF]" link or article title with click_using_selector to trigger the download into the download folder.
     - On arXiv (arxiv.org): Click the paper's title link to navigate to the paper's webpage, then click the on-page "View PDF" or "Download PDF" button with click_using_selector.
     - Repeat for each requested paper (e.g. Paper 1, Paper 2, Paper 3).
     - Final Step: Conclude with final_response summarizing the downloaded papers and confirming their saved locations in the downloads folder.
   - The user explicitly expects to see the browser navigate to the page and click the buttons on the screen!
8. Scrolling & Exploration: If a task requires browsing multiple items, discovering options further down a page, or locating an element not immediately visible upon page load, include a step to scroll down using scroll_page (e.g. "Scroll down to reveal more results").
</critical_rules>

<output_format>
You MUST respond with valid JSON adhering to one of these schemas:

For web automation tasks:
{
  "is_conversational": false,
  "plan": [
    "Step 1 description",
    "Step 2 description"
  ],
  "next_step": "The exact step description to execute right now",
  "reasoning": "Brief explanation of this step choice and adaptations made from feedback"
}

For conversational / direct queries:
{
  "is_conversational": true,
  "direct_response": "Natural, helpful, friendly answer to the user's input without any robotic tool lists or canned intros",
  "plan": [],
  "next_step": null,
  "reasoning": "Conversational reply"
}
</output_format>
`.trim();

export class PlannerAgent {
  static async plan({ query, currentPlan = null, feedback = null, stepIndex = 0, model = null, conversationHistory = [] }) {
    logger.info(`[PlannerAgent] Formulating plan for step ${stepIndex + 1} [Model: ${model || "default"}]`);

    let userPrompt = "";
    if (Array.isArray(conversationHistory) && conversationHistory.length > 0) {
      userPrompt += "Previous Multi-Turn Conversation Thread in this session:\n";
      conversationHistory.forEach((turn, idx) => {
        const cleanCmd = (turn.command || "").trim();
        const cleanResp = (turn.final_response || turn.finalResponse || "Task executed.").trim();
        userPrompt += `[Turn ${idx + 1}]\nUser: "${cleanCmd}"\nAssistant: "${cleanResp.slice(0, 300)}"\n\n`;
      });
      userPrompt += `Current Follow-up Request: "${query}"\n`;
    } else {
      userPrompt += `User Request: "${query}"\n`;
    }

    if (currentPlan && currentPlan.length > 0) {
      userPrompt += `\nExisting Plan:\n${currentPlan.map((s, i) => `${i + 1}. ${s}`).join("\n")}\n`;
      userPrompt += `Current Step Index: ${stepIndex + 1}\n`;
    }

    if (feedback) {
      userPrompt += `\nCritique Feedback from previous action:\n"${feedback}"\n`;
      userPrompt += `\nPlease inspect this feedback carefully. If the previous step failed or got stuck, revise the plan with an alternative path. If successful, progress to the next logical step.\n`;
    } else if (!conversationHistory || conversationHistory.length === 0) {
      userPrompt += `\nThis is a brand new task. Generate a complete initial plan and pick the first step, or respond conversationally if it is general chat/greeting.\n`;
    } else {
      userPrompt += `\nThis is a follow-up turn in an existing session. Interpret the current follow-up in the context of the previous turns, and generate an actionable plan or conversational response.\n`;
    }

    try {
      const output = await llmClient.generateJson({
        systemPrompt: PLANNER_SYSTEM_PROMPT,
        userPrompt,
        temperature: 0.3,
        ...(model ? { model } : {}),
      });

      if (output && output.is_conversational) {
        return {
          is_conversational: true,
          direct_response: output.direct_response || "Hello! How can I help you today? Let me know what you'd like me to look up or automate.",
          plan: [],
          next_step: null,
          reasoning: output.reasoning || "Conversational response",
        };
      }

      if (!output || !output.next_step) {
        throw new PlannerError("Planner model returned invalid response without next_step", output);
      }

      // Normalize plan format if returned as multiline string
      let normalizedPlan = [];
      if (Array.isArray(output.plan)) {
        normalizedPlan = output.plan;
      } else if (typeof output.plan === "string") {
        normalizedPlan = output.plan
          .split("\n")
          .map((line) => line.replace(/^\d+[\.\)]\s*/, "").trim())
          .filter(Boolean);
      } else if (currentPlan) {
        normalizedPlan = currentPlan;
      } else {
        normalizedPlan = [output.next_step];
      }

      return {
        plan: normalizedPlan,
        next_step: output.next_step,
        reasoning: output.reasoning || "",
      };
    } catch (err) {
      logger.error(`[PlannerAgent] Planning failed: ${err.message}`);
      throw new PlannerError(`Planner Agent error: ${err.message}`, err);
    }
  }
}
