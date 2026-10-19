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
2. The page state is structured into visual Semantic Blocks (e.g. [Block 3 (article): "Product Title"]). To interact with elements on the page (clicks, inputs), inspect the relevant block and use the "mmid" attribute of the element (e.g. '5' or '[mmid="5"]'). Identifying the target element inside its specific block guarantees 1-shot accuracy (e.g. selecting the "Add to Cart" button inside the exact product card intended).
3. If entering text into a search bar, set pressEnter: true unless a separate submit button is targeted.
4. If asked to navigate to a new site, use open_url.
5. If the current page content is needed to answer a query or find buttons, call get_dom_with_content_type.
6. When the user's objective is fully accomplished and you have the final answer, call final_response. In the "answer" parameter, write a natural, conversational response directly answering the user or concisely summarizing the actions completed on the web page (e.g. "I navigated to Excalidraw, selected the ellipse tool, and drew a circle on the canvas."). NEVER output canned capability monologues, resumes, or generic tool explanations.
7. Scholarly & Research Article Tasks:
   - You must NEVER hallucinate downloads or call final_response without clicking the download links!
   - On Google Scholar (scholar.google.com): The search results display direct "[PDF]" links (e.g. "[PDF] arxiv.org") on the right side of the results. Call click_using_selector on each "[PDF]" link (e.g. selector "86") to download that article directly into the download folder. Alternatively, click the article's title link to navigate to the paper's landing page and click "Download PDF" there.
   - On arXiv (arxiv.org): Click the paper title link to visit its webpage, then click the on-page "View PDF" or "Download PDF" button.
   - Repeat for each requested paper (e.g. Paper 1, Paper 2, Paper 3).
   - Only AFTER all requested articles have been downloaded by clicking their links, call final_response with a summary of the downloaded papers and confirming their saved locations in the download folder.
8. Viewport & Scrolling: If a target button, product card, search result, or section is not visible in the current Semantic Blocks or is located below the fold, use scroll_page (e.g. { direction: "down" }) or scroll_to_element to bring it into view before interacting.
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

export function formatSemanticBlocksForPrompt(dom) {
  if (!dom) return "No DOM state available.";

  if (Array.isArray(dom.semanticBlocks) && dom.semanticBlocks.length > 0) {
    return dom.semanticBlocks.map((b) => {
      const headerLine = `[Block ${b.blockId} (${b.type}): "${b.label}"]`;
      const elementLines = (b.elements || []).map((el) => `    ${el}`).join("\n");
      return `${headerLine}\n${elementLines}`;
    }).join("\n\n");
  }

  // Graceful fallback to flat list
  if (Array.isArray(dom.interactiveElements) && dom.interactiveElements.length > 0) {
    return dom.interactiveElements.slice(0, 100).join("\n");
  }

  return "No interactive elements detected on the page.";
}

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
        const blockStructure = formatSemanticBlocksForPrompt(dom);
        domSnapshot = `Current Page Title: "${pageTitle}"\nCurrent URL: ${currentUrl}\n\n=== Webpage Semantic Blocks (Visual Layout) ===\n${blockStructure}`;
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
