"use strict";

import { EventEmitter } from "node:events";
import { randomUUID } from "node:crypto";
import { config } from "../config.js";
import { logger } from "../utils/logger.js";
import { browserManager } from "./browserManager.js";
import { PlannerAgent } from "../agents/plannerAgent.js";
import { BrowserAgent } from "../agents/browserAgent.js";
import { CritiqueAgent } from "../agents/critiqueAgent.js";
import { analyzeScreenshots } from "../utils/ssAnalysis.js";
import { TaskRepository } from "../db/repositories/taskRepository.js";
import { PlanRepository } from "../db/repositories/planRepository.js";
import { ActionRepository } from "../db/repositories/actionRepository.js";
import { CritiqueRepository } from "../db/repositories/critiqueRepository.js";
import { LogRepository } from "../db/repositories/logRepository.js";
import { uiManager } from "../utils/uiManager.js";

export class Orchestrator extends EventEmitter {
  constructor(options = {}) {
    super();
    this.maxSteps = options.maxSteps || config.browser.maxSteps;
  }

  async runTask(command, existingTaskId = null, options = {}) {
    const taskId = existingTaskId || randomUUID();
    const taskModel = options.model || null;
    const startTime = Date.now();

    logger.info(`[Orchestrator] Starting task "${taskId}": "${command}" [Model: ${taskModel || "default"}]`);
    const existing = TaskRepository.getById(taskId);
    if (!existing) {
      TaskRepository.create({ id: taskId, command });
    } else {
      TaskRepository.updateStatus(taskId, "RUNNING");
    }
    this._emit(taskId, "task_started", { taskId, command, model: taskModel });

    let currentPlan = null;
    let feedback = null;
    let stepIndex = 0;
    let previousActions = [];
    let finalAnswer = null;

    try {
      // Ensure browser is up
      await browserManager.initialize();
      const activePage = await browserManager.getPage();
      await uiManager.addUserMessage(activePage, command, Boolean(options.fromOverlay));
      await uiManager.updateState(activePage, "processing");

      while (stepIndex < this.maxSteps) {
        stepIndex++;
        const stepTimerStart = Date.now();
        this._log(taskId, "INFO", `Starting step ${stepIndex}/${this.maxSteps}`);

        // 1. Planner Phase
        this._emit(taskId, "planner_thinking", { stepIndex });
        const currentPage = await browserManager.getPage().catch(() => activePage);
        if (currentPage && !currentPage.isClosed()) {
          await uiManager.addSystemMessage(currentPage, JSON.stringify({
            type: "thinking",
            stage: "planner",
            text: `Formulating strategy for Step ${stepIndex}...`,
          }), "thinking");
        }

        const planResult = await PlannerAgent.plan({
          query: command,
          currentPlan,
          feedback,
          stepIndex: stepIndex - 1,
          model: taskModel,
        });

        if (planResult.is_conversational) {
          finalAnswer = planResult.direct_response;
          this._log(taskId, "INFO", "Planner returned direct conversational response.");
          break;
        }

        if (currentPage && !currentPage.isClosed() && planResult.reasoning) {
          await uiManager.addSystemMessage(currentPage, JSON.stringify({
            type: "thought",
            stage: "planner",
            text: `Strategy: ${planResult.reasoning}`,
          }), "thinking");
        }

        currentPlan = planResult.plan;
        const currentInstruction = planResult.next_step;

        PlanRepository.savePlan({
          taskId,
          planText: currentPlan.join("\n"),
          version: stepIndex,
          steps: currentPlan,
        });

        await uiManager.addSystemMessage(currentPage, JSON.stringify({
          plan: currentPlan,
          stepIndex,
          currentInstruction,
        }), "plan");

        this._emit(taskId, "plan_updated", {
          stepIndex,
          plan: currentPlan,
          currentInstruction,
          reasoning: planResult.reasoning,
        });

        // 2. Capture Before-Screenshot (for vision critique)
        let beforeScreenshot = null;
        if (config.llm.visionEnabled) {
          try {
            beforeScreenshot = await browserManager.captureScreenshot(`task_${taskId}_step_${stepIndex}_before`);
          } catch {
            // Ignore capture error
          }
        }

        // 3. Execution Phase (Browser Agent)
        this._emit(taskId, "browser_acting", { stepIndex, instruction: currentInstruction });
        if (currentPage && !currentPage.isClosed()) {
          await uiManager.addSystemMessage(currentPage, JSON.stringify({
            type: "thinking",
            stage: "browser",
            text: `Inspecting page DOM and deciding action for: "${currentInstruction}"...`,
          }), "thinking");
        }

        const actionResult = await BrowserAgent.executeStep({
          stepInstruction: currentInstruction,
          previousActions,
          model: taskModel,
        });

        if (currentPage && !currentPage.isClosed()) {
          const actionDesc = actionResult.rationale || (actionResult.toolName === "final_response" ? "Final response prepared." : `Executed ${actionResult.toolName}${actionResult.parameters ? ": " + JSON.stringify(actionResult.parameters) : ""}`);
          await uiManager.addSystemMessage(currentPage, actionDesc, "browser");
        }

        // 4. Capture After-Screenshot
        let afterScreenshot = null;
        try {
          afterScreenshot = await browserManager.captureScreenshot(`task_${taskId}_step_${stepIndex}_after`);
        } catch {
          // Ignore capture error
        }

        // Deliver screenshot to UI for camera flash animation and interactive preview
        if (afterScreenshot && currentPage && !currentPage.isClosed()) {
          await uiManager.addSystemMessage(currentPage, JSON.stringify({
            type: "screenshot",
            base64: afterScreenshot.base64,
            filename: afterScreenshot.filename,
            stepIndex,
          }), "screenshot");
        }

        // 5. Visual Analysis (Screenshot diff)
        let ssAnalysis = "N/A";
        if (config.llm.visionEnabled && afterScreenshot) {
          if (currentPage && !currentPage.isClosed()) {
            await uiManager.addSystemMessage(currentPage, JSON.stringify({
              type: "thinking",
              stage: "vision",
              text: `Analyzing visual page state with Vision model (${config.llm.visionModel})...`,
            }), "thinking");
          }

          ssAnalysis = await analyzeScreenshots({
            base64Before: beforeScreenshot ? beforeScreenshot.base64 : null,
            base64After: afterScreenshot.base64,
            actionDescription: `${actionResult.toolName} with ${JSON.stringify(actionResult.parameters)}`,
            expectedResult: currentInstruction,
          });

          if (currentPage && !currentPage.isClosed() && ssAnalysis && ssAnalysis !== "N/A") {
            await uiManager.addSystemMessage(currentPage, JSON.stringify({
              type: "thought",
              stage: "vision",
              text: `Vision verification: ${ssAnalysis}`,
            }), "thinking");
          }
        }

        // Record action to SQLite
        ActionRepository.record({
          taskId,
          stepNumber: stepIndex,
          toolName: actionResult.toolName,
          parameters: actionResult.parameters,
          result: actionResult.result,
          screenshotPath: afterScreenshot ? afterScreenshot.filepath : null,
          status: actionResult.result?.error ? "FAILED" : "SUCCESS",
        });

        previousActions.push({
          tool_name: actionResult.toolName,
          status: actionResult.result?.error ? "FAILED" : "SUCCESS",
        });

        this._emit(taskId, "action_completed", {
          stepIndex,
          toolName: actionResult.toolName,
          parameters: actionResult.parameters,
          result: actionResult.result,
          screenshot: afterScreenshot ? afterScreenshot.filename : null,
          ssAnalysis,
        });

        // Check if browser agent explicitly called final_response
        if (actionResult.toolName === "final_response" && actionResult.result?.answer) {
          finalAnswer = actionResult.result.answer;
          this._log(taskId, "INFO", "Browser Agent reached final response.");
          break;
        }

        // 6. Evaluation Phase (Critique Agent)
        this._emit(taskId, "critique_evaluating", { stepIndex });
        if (currentPage && !currentPage.isClosed()) {
          await uiManager.addSystemMessage(currentPage, JSON.stringify({
            type: "thinking",
            stage: "critique",
            text: "Evaluating step outcome with Critique Agent...",
          }), "thinking");
        }

        const critiqueResult = await CritiqueAgent.critique({
          currentStep: currentInstruction,
          originalPlan: currentPlan,
          toolResponse: actionResult.result,
          ssAnalysis,
          model: taskModel,
        });

        if (currentPage && !currentPage.isClosed()) {
          await uiManager.addSystemMessage(currentPage, `${critiqueResult.verdict}: ${critiqueResult.feedback}`, "critique");
        }

        CritiqueRepository.record({
          taskId,
          stepNumber: stepIndex,
          feedback: critiqueResult.feedback,
          terminate: critiqueResult.terminate,
          finalResponse: critiqueResult.finalResponse,
        });

        this._emit(taskId, "critique_completed", {
          stepIndex,
          verdict: critiqueResult.verdict,
          feedback: critiqueResult.feedback,
          terminate: critiqueResult.terminate,
          finalResponse: critiqueResult.finalResponse,
        });

        // Terminate condition reached
        if (critiqueResult.terminate) {
          finalAnswer = critiqueResult.finalResponse || actionResult.result?.answer || "Task completed successfully.";
          this._log(taskId, "INFO", `Critique terminated task. Verdict: ${critiqueResult.verdict}`);
          break;
        }

        // Pass critique guidance to next loop iteration
        feedback = critiqueResult.feedback;
      }

      const durationMs = Date.now() - startTime;

      if (!finalAnswer && stepIndex >= this.maxSteps) {
        finalAnswer = `Reached maximum allowed steps (${this.maxSteps}) without explicit termination. Last feedback: ${feedback}`;
      }

      TaskRepository.complete(taskId, finalAnswer, stepIndex, durationMs);
      this._emit(taskId, "task_completed", {
        taskId,
        finalResponse: finalAnswer,
        totalSteps: stepIndex,
        durationMs,
      });

      const finalPage = await browserManager.getPage().catch(() => activePage);
      if (finalPage && !finalPage.isClosed()) {
        await uiManager.addSystemMessage(finalPage, finalAnswer, "done");
        await uiManager.commandCompleted(finalPage);
      }

      return {
        taskId,
        status: "COMPLETED",
        finalResponse: finalAnswer,
        totalSteps: stepIndex,
        durationMs,
      };
    } catch (err) {
      const durationMs = Date.now() - startTime;
      logger.error(`[Orchestrator] Task failed: ${err.message}`, err);
      TaskRepository.fail(taskId, err.message, stepIndex, durationMs);
      this._emit(taskId, "task_failed", { taskId, error: err.message });

      try {
        const errorPage = await browserManager.getPage().catch(() => null);
        if (errorPage && !errorPage.isClosed()) {
          await uiManager.addSystemMessage(errorPage, `Error: ${err.message}`, "done");
          await uiManager.commandCompleted(errorPage);
        }
      } catch {
        // Ignore UI update errors on failure
      }

      throw err;
    } finally {
      // Keep browser alive for inspection in non-headless mode, or clean up if desired
      if (config.browser.headless) {
        await browserManager.close();
      }
    }
  }

  _emit(taskId, event, data) {
    this.emit(event, { ...data, taskId, timestamp: new Date().toISOString() });
    this.emit(`task:${taskId}`, { event, ...data, timestamp: new Date().toISOString() });
  }

  _log(taskId, level, message) {
    logger.info(`[Task ${taskId}] ${message}`);
    LogRepository.log(taskId, level, message);
  }
}

export const orchestrator = new Orchestrator();
