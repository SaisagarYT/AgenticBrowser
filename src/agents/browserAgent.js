"use strict";

import { llmClient } from "../core/llmClient.js";
import { executeSkill, TOOL_DESCRIPTIONS } from "../skills/index.js";
import { browserManager } from "../core/browserManager.js";
import { extractDomRepresentation } from "../utils/domHelper.js";
import { logger } from "../utils/logger.js";
import { BrowserNavigationError } from "../utils/errors.js";

const BROWSER_AGENT_SYSTEM_PROMPT = `
<agent_role>
You are an expert Web Navigation Browser Agent responsible for executing concrete web actions.
You are in a loop: Planner -> Browser Agent [You] -> Critique.
You execute exactly ONE atomic tool action per step.
</agent_role>

<rules>
1. Always choose exactly ONE tool from the list below.
2. To interact with elements on the page (clicks, inputs), inspect the DOM or use the "mmid" attribute of the element (e.g. '5' or '[mmid="5"]').
3. If entering text into a search bar, set pressEnter: true unless a separate submit button is targeted.
4. If asked to navigate to a new site, use open_url.
5. If the current page content is needed to answer a query or find buttons, call get_dom_with_content_type.
6. When the user's objective is fully accomplished and you have the final answer, call final_response. In the "answer" parameter, write a natural, conversational response directly answering the user or concisely summarizing the actions completed on the web page (e.g. "I navigated to Excalidraw, selected the ellipse tool, and drew a circle on the canvas."). NEVER output canned capability monologues, resumes, or generic tool explanations.
</rules>

<available_tools>
${JSON.stringify(TOOL_DESCRIPTIONS, null, 2)}
</available_tools>

<output_format>
You MUST respond with valid JSON adhering to this exact schema:
{
  "tool": "name_of_the_tool_to_call",
  "parameters": {
    "key": "value"
  },
  "rationale": "Brief sentence explaining why this tool and these parameters were chosen"
}
</output_format>
`.trim();

export class BrowserAgent {
  static async executeStep({ stepInstruction, previousActions = [], model = null }) {
    logger.info(`[BrowserAgent] Deciding action for instruction: "${stepInstruction}" [Model: ${model || "default"}]`);

    const page = await browserManager.getPage();
    const currentUrl = page.url();
    const pageTitle = await page.title().catch(() => "");

    // Extract quick context snapshot of current page
    let domSnapshot = "";
    if (currentUrl && currentUrl !== "about:blank") {
      try {
        const dom = await extractDomRepresentation(page, "fields");
        domSnapshot = `Current Page Title: "${pageTitle}"\nCurrent URL: ${currentUrl}\nInteractive Elements Sample:\n` +
          (dom.interactiveElements || []).slice(0, 100).join("\n");
      } catch (err) {
        domSnapshot = `Current URL: ${currentUrl} (DOM extraction error: ${err.message})`;
      }
    } else {
      domSnapshot = "Browser is currently on blank page (no URL open yet).";
    }

    const userPrompt = `
Current Step to Execute: "${stepInstruction}"

Page State:
${domSnapshot}

Recent Actions History:
${previousActions.slice(-3).map((a, i) => `${i + 1}. Tool: ${a.tool_name}, Status: ${a.status}`).join("\n") || "No prior actions yet."}

Select the single best tool and parameters to accomplish this step.
`.trim();

    try {
      const decision = await llmClient.generateJson({
        systemPrompt: BROWSER_AGENT_SYSTEM_PROMPT,
        userPrompt,
        temperature: 0.2,
        ...(model ? { model } : {}),
      });

      if (!decision || !decision.tool) {
        throw new BrowserNavigationError("Browser Agent returned invalid decision without tool", decision);
      }

      logger.info(`[BrowserAgent] Executing tool "${decision.tool}" with params:`, decision.parameters);

      // Execute the chosen skill
      const executionResult = await executeSkill(decision.tool, decision.parameters || {});

      return {
        toolName: decision.tool,
        parameters: decision.parameters || {},
        rationale: decision.rationale || "",
        result: executionResult,
      };
    } catch (err) {
      logger.error(`[BrowserAgent] Action execution failed: ${err.message}`);
      return {
        toolName: "error",
        parameters: {},
        rationale: "Execution failure",
        result: {
          success: false,
          error: err.message,
        },
      };
    }
  }
}
