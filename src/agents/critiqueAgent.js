"use strict";

import { llmClient } from "../core/llmClient.js";
import { logger } from "../utils/logger.js";
import { CritiqueError } from "../utils/errors.js";

const CRITIQUE_SYSTEM_PROMPT = `
<agent_role>
You are an expert Critique Agent responsible for evaluating the progress of an autonomous web automation task.
You are in a loop: Planner -> Browser Agent -> Critique [You].
You analyze the action performed by the Browser Agent and provide concrete feedback to the Planner.
You are also responsible for the termination of the entire workflow.
</agent_role>

<rules>
1. Evaluate whether the current step was successfully executed based on the tool response, DOM state changes / diff, and visual analysis (if applicable).
2. If the user's intent or goal is satisfied, set "terminate": true AND provide the complete, detailed final answer in "final_response".
3. STRICT PROHIBITION: Never provide generic filler in "final_response" like "Information has been compiled", "The task was executed", or canned introductions ("Hello! I'm your Web Navigation Browser Agent..."). You MUST output the actual requested data, prices, dates, summaries, or a natural summary of what was accomplished on the webpage!
4. If the task is NOT yet complete, set "terminate": false, leave "final_response": null, and provide clear, specific guidance in "feedback" telling the Planner what succeeded, what failed, and what to do next.
5. If the system is stuck in an unrecoverable loop (same error repeated multiple times), set "terminate": true with a clear explanation of where and why the system was blocked.
</rules>

<output_format>
You MUST respond with valid JSON adhering to this exact schema:
{
  "feedback": "Detailed feedback for the Planner on current progress and recommended next steps",
  "terminate": true/false,
  "final_response": "The actual full answer to the user's question, or null if ongoing",
  "verdict": "SUCCESS" or "FAIL_RETRY" or "REPLAN" or "TASK_COMPLETED"
}
</output_format>
`.trim();

export class CritiqueAgent {
  static async critique({ currentStep, originalPlan, toolResponse, domDiff = "N/A", ssAnalysis = "N/A", model = null }) {
    logger.info(`[CritiqueAgent] Evaluating outcome of step: "${currentStep}" [Model: ${model || "default"}]`);

    const userPrompt = `
Original Plan:
${Array.isArray(originalPlan) ? originalPlan.map((s, i) => `${i + 1}. ${s}`).join("\n") : originalPlan}

Current Step Attempted:
"${currentStep}"

Browser Tool Execution Response:
${typeof toolResponse === "object" ? JSON.stringify(toolResponse, null, 2) : toolResponse}

DOM State Changes / Diff:
${domDiff}

Screenshot Visual Analysis:
${ssAnalysis}

Evaluate the progress and determine if the task should terminate or proceed.
`.trim();

    try {
      const evaluation = await llmClient.generateJson({
        systemPrompt: CRITIQUE_SYSTEM_PROMPT,
        userPrompt,
        temperature: 0.2,
        ...(model ? { model } : {}),
      });

      if (!evaluation || typeof evaluation.terminate !== "boolean") {
        throw new CritiqueError("Critique Agent returned invalid response format", evaluation);
      }

      logger.info(`[CritiqueAgent] Verdict: ${evaluation.verdict || (evaluation.terminate ? "TASK_COMPLETED" : "ONGOING")}`);

      return {
        feedback: evaluation.feedback || "Step evaluated.",
        terminate: Boolean(evaluation.terminate),
        finalResponse: evaluation.final_response || null,
        verdict: evaluation.verdict || (evaluation.terminate ? "TASK_COMPLETED" : "SUCCESS"),
      };
    } catch (err) {
      logger.error(`[CritiqueAgent] Critique failed: ${err.message}`);
      return {
        feedback: `Critique error (${err.message}). Proceeding with plan.`,
        terminate: false,
        finalResponse: null,
        verdict: "FAIL_RETRY",
      };
    }
  }
}
