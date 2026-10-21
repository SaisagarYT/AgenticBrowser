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
import { SessionRepository } from "../db/repositories/sessionRepository.js";
import { PlanRepository } from "../db/repositories/planRepository.js";
import { ActionRepository } from "../db/repositories/actionRepository.js";
import { CritiqueRepository } from "../db/repositories/critiqueRepository.js";
import { LogRepository } from "../db/repositories/logRepository.js";
import { uiManager } from "../utils/uiManager.js";
import { extractDomRepresentation, computeDomDiff, isVisualCheckRequired } from "../utils/domHelper.js";
import { AntigravityCliClient } from "./antigravityCliClient.js";

export class Orchestrator extends EventEmitter {
  constructor(options = {}) {
    super();
    this.maxSteps = options.maxSteps || config.browser.maxSteps;
    this._recentTaskCommand = "";
    this._recentTaskTime = 0;
  }

  async runTask(command, existingTaskId = null, options = {}) {
    const cleanCmd = (command || "").trim();
    const now = Date.now();
    const cleanLower = cleanCmd.toLowerCase();
    const recentLower = (this._recentTaskCommand || "").toLowerCase();

    // Semantic deduplication: ignore identical or partial fragment commands within 4s window
    if (cleanCmd && (cleanLower === recentLower || ((now - this._recentTaskTime < 4000) && (cleanLower.includes(recentLower) || recentLower.includes(cleanLower))))) {
      logger.warn(`[Orchestrator] Dropped duplicate concurrent task command within 4s window: "${cleanCmd}"`);
      return {
        status: "COMPLETED",
        command: cleanCmd,
        duplicateSuppressed: true,
      };
    }
    this._recentTaskCommand = cleanCmd;
    this._recentTaskTime = now;
    uiManager.setExecuting(true);

    const taskId = existingTaskId || randomUUID();
    const taskModel = options.model || null;
    let sessionId = options.sessionId || null;
    const startTime = Date.now();

    // Ensure session exists or create one
    if (sessionId) {
      const existingSession = SessionRepository.getById(sessionId);
      if (!existingSession) {
        SessionRepository.create({ id: sessionId, title: command.trim().slice(0, 80), model: taskModel });
      }
    } else {
      const newSession = SessionRepository.create({ title: command.trim().slice(0, 80), model: taskModel });
      sessionId = newSession.id;
    }

    logger.info(`[Orchestrator] Starting task "${taskId}" under session "${sessionId}": "${command}" [Model: ${taskModel || "default"}]`);
    uiManager.setActiveSession(sessionId, command.trim().slice(0, 80));
    const existing = TaskRepository.getById(taskId);
    if (!existing) {
      TaskRepository.create({ id: taskId, command, sessionId });
    } else {
      TaskRepository.updateStatus(taskId, "RUNNING");
    }
    SessionRepository.touch(sessionId, { status: "ACTIVE", model: taskModel });
    this._emit(taskId, "task_started", { taskId, sessionId, command, model: taskModel });

    // Route to Antigravity CLI Agent if requested
    const isAntigravity = options.agent === "antigravity" ||
      (typeof taskModel === "string" && taskModel.toLowerCase().includes("antigravity"));

    if (isAntigravity) {
      return this._runAntigravityTask(command, taskId, sessionId, options, startTime);
    }

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

      // Handle simple conversational greetings immediately without executing heavy browser planner steps
      const isGreeting = /^(hi|hello|hey|hiya|howdy|good\s+(morning|afternoon|evening)|what'?s\s+up|sup|greetings|who\s+are\s+you|what\s+can\s+you\s+do|help|thanks|thank\s+you)[.!?]*$/i.test(command.trim());
      if (isGreeting) {
        finalAnswer = "Hello! How can I help you with your project today?";
        TaskRepository.complete(taskId, finalAnswer, 1, Date.now() - startTime);
        SessionRepository.touch(sessionId, { status: "COMPLETED", model: taskModel });
        this._emit(taskId, "task_completed", {
          taskId,
          sessionId,
          finalResponse: finalAnswer,
          totalSteps: 1,
          durationMs: Date.now() - startTime,
        });
        const finalPage = await browserManager.getPage().catch(() => activePage);
        if (finalPage && !finalPage.isClosed()) {
          await uiManager.addSystemMessage(finalPage, finalAnswer, "done");
          await uiManager.commandCompleted(finalPage);
        }

        // Trigger AI session title generation asynchronously
        this._autoGenerateSessionTitle(sessionId, command, finalAnswer, taskModel).catch(() => {});

        return {
          taskId,
          sessionId,
          status: "COMPLETED",
          finalResponse: finalAnswer,
          totalSteps: 1,
          durationMs: Date.now() - startTime,
        };
      }

      while (stepIndex < this.maxSteps) {
        stepIndex++;
        const stepTimerStart = Date.now();
        this._log(taskId, "INFO", `Starting step ${stepIndex}/${this.maxSteps}`);

        // 1. Planner Phase
        this._emit(taskId, "planner_thinking", { stepIndex });
        const priorTurns = SessionRepository.getRecentTurnsContext(sessionId, 4);
        const planResult = await PlannerAgent.plan({
          query: command,
          currentPlan,
          feedback,
          stepIndex: stepIndex - 1,
          model: taskModel,
          conversationHistory: priorTurns,
        });

        if (planResult.is_conversational) {
          finalAnswer = planResult.direct_response;
          this._log(taskId, "INFO", "Planner returned direct conversational response.");
          break;
        }

        currentPlan = planResult.plan;
        const currentInstruction = planResult.next_step;

        PlanRepository.savePlan({
          taskId,
          planText: currentPlan.join("\n"),
          version: stepIndex,
          steps: currentPlan,
        });

        const currentPage = await browserManager.getPage().catch(() => activePage);

        await uiManager.addSystemMessage(currentPage, JSON.stringify({
          plan: currentPlan,
          stepIndex,
          currentInstruction,
        }), "plan");

        if (planResult.reasoning) {
          await uiManager.addSystemMessage(currentPage, planResult.reasoning, "thought");
        }

        this._emit(taskId, "plan_updated", {
          stepIndex,
          plan: currentPlan,
          currentInstruction,
          reasoning: planResult.reasoning,
        });

        // 2. Pre-Action State Capture (DOM snapshot & conditional before-screenshot)
        let beforeDom = null;
        try {
          if (currentPage && !currentPage.isClosed()) {
            beforeDom = await extractDomRepresentation(currentPage, "fields");
          }
        } catch {
          // Ignore capture error
        }

        const preNeedsVision = isVisualCheckRequired({
          instruction: currentInstruction,
          verificationMode: config.llm.verificationMode,
          visionEnabled: config.llm.visionEnabled,
        });

        let beforeScreenshot = null;
        if (preNeedsVision) {
          try {
            beforeScreenshot = await browserManager.captureScreenshot(`task_${taskId}_step_${stepIndex}_before`);
          } catch {
            // Ignore capture error
          }
        }

        // 3. Execution Phase (Browser Agent)
        this._emit(taskId, "browser_acting", { stepIndex, instruction: currentInstruction });
        const actionResult = await BrowserAgent.executeStep({
          stepInstruction: currentInstruction,
          previousActions,
          model: taskModel,
        });

        if (currentPage && !currentPage.isClosed()) {
          const actionDesc = actionResult.actionName || actionResult.rationale || (actionResult.toolName === "final_response" ? "Final response prepared." : `Executed ${actionResult.toolName}${actionResult.parameters ? ": " + JSON.stringify(actionResult.parameters) : ""}`);
          await uiManager.addSystemMessage(currentPage, actionDesc, "browser");
        }

        // 4. Post-Action State Capture & DOM Diff
        const pageAfter = await browserManager.getPage().catch(() => currentPage);
        let afterDom = null;
        try {
          if (pageAfter && !pageAfter.isClosed()) {
            afterDom = await extractDomRepresentation(pageAfter, "fields");
          }
        } catch {
          // Ignore capture error
        }

        const domDiff = computeDomDiff(beforeDom, afterDom);

        // 5. Visual Check (Hybrid: only if visual task/canvas or configured)
        const needsVision = isVisualCheckRequired({
          instruction: currentInstruction,
          toolName: actionResult.toolName,
          domDiff,
          verificationMode: config.llm.verificationMode,
          visionEnabled: config.llm.visionEnabled,
        });

        let afterScreenshot = null;
        let ssAnalysis = "N/A (DOM diff verified; visual screenshot not required)";

        if (needsVision) {
          try {
            afterScreenshot = await browserManager.captureScreenshot(`task_${taskId}_step_${stepIndex}_after`);
          } catch {
            // Ignore capture error
          }

          if (afterScreenshot) {
            ssAnalysis = await analyzeScreenshots({
              base64Before: beforeScreenshot?.base64,
              base64After: afterScreenshot.base64,
              actionDescription: `${actionResult.toolName} with ${JSON.stringify(actionResult.parameters)}`,
              expectedResult: currentInstruction,
            });
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
          domDiff: domDiff.diffSummary,
        });

        // Check if browser agent explicitly called final_response
        if (actionResult.toolName === "final_response" && actionResult.result?.answer) {
          finalAnswer = actionResult.result.answer;
          this._log(taskId, "INFO", "Browser Agent reached final response.");
          break;
        }

        // 6. Evaluation Phase (Critique Agent)
        this._emit(taskId, "critique_evaluating", { stepIndex });
        const critiqueResult = await CritiqueAgent.critique({
          currentStep: currentInstruction,
          originalPlan: currentPlan,
          toolResponse: actionResult.result,
          domDiff: domDiff.diffSummary,
          ssAnalysis,
          model: taskModel,
        });

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

        if (currentPage && !currentPage.isClosed() && critiqueResult.feedback) {
          await uiManager.addSystemMessage(currentPage, critiqueResult.feedback, "critique");
        }

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
      SessionRepository.touch(sessionId, { status: "COMPLETED", model: taskModel });
      this._emit(taskId, "task_completed", {
        taskId,
        sessionId,
        finalResponse: finalAnswer,
        totalSteps: stepIndex,
        durationMs,
      });

      const finalPage = await browserManager.getPage().catch(() => activePage);
      if (finalPage && !finalPage.isClosed()) {
        await uiManager.addSystemMessage(finalPage, finalAnswer, "done");
        await uiManager.commandCompleted(finalPage);
      }

      // Trigger AI session title generation asynchronously
      this._autoGenerateSessionTitle(sessionId, command, finalAnswer, taskModel).catch(() => {});

      return {
        taskId,
        sessionId,
        status: "COMPLETED",
        finalResponse: finalAnswer,
        totalSteps: stepIndex,
        durationMs,
      };
    } catch (err) {
      const durationMs = Date.now() - startTime;
      logger.error(`[Orchestrator] Task failed: ${err.message}`, err);
      TaskRepository.fail(taskId, err.message, stepIndex, durationMs);
      SessionRepository.touch(sessionId, { status: "FAILED", model: taskModel });
      this._emit(taskId, "task_failed", { taskId, sessionId, error: err.message });

      try {
        const errorPage = await browserManager.getPage().catch(() => null);
        if (errorPage && !errorPage.isClosed()) {
          await uiManager.addSystemMessage(errorPage, `Error: ${err.message}`, "done");
          await uiManager.commandCompleted(errorPage);
        }
      } catch {
        // Ignore UI update errors on failure
      }

    } finally {
      uiManager.setExecuting(false);
      // Keep browser alive for inspection in non-headless mode, or clean up if desired
      if (config.browser.headless) {
        await browserManager.close();
      }
    }
  }

  async _runAntigravityTask(command, taskId, sessionId, options, startTime) {
    logger.info(`[Orchestrator] Running Antigravity CLI Agent for task "${taskId}" under session "${sessionId}": "${command}"`);
    let activePage = null;

    try {
      await browserManager.initialize();
      activePage = await browserManager.getPage();
      await uiManager.addUserMessage(activePage, command, Boolean(options.fromOverlay));
      await uiManager.updateState(activePage, "processing");
    } catch (err) {
      logger.warn(`[Orchestrator] Initial UI setup notice: ${err.message}`);
    }

    this._emit(taskId, "planner_thinking", { stepIndex: 1 });

    let activeUrl = "about:blank";
    try {
      if (activePage && !activePage.isClosed()) {
        activeUrl = activePage.url();
      }
    } catch {}

    let promptToSend = command;
    const isDownloadTask = /\b(download|get|save|fetch)\b.*\b(articles?|papers?|pdf|documents?)\b/i.test(command) ||
      /\b(articles?|papers?|pdf)\b.*\b(download|get|save|fetch)\b/i.test(command);

    if (isDownloadTask) {
      promptToSend = `[Active Browser URL: ${activeUrl}]
User Instruction: "${command}"

CRITICAL MANDATORY INSTRUCTIONS:
1. You are controlling the user's live Chromium browser window via the agentic-browser MCP tools.
2. The user is actively watching the browser. You MUST physically click the download buttons or [PDF] links on the webpage!
3. If on Google Scholar or search results:
   - Call browser_get_dom to view the interactive elements and their mmid numbers.
   - For each requested article, identify the on-page "[PDF]" link or article title link (e.g. "[PDF] arxiv.org" on Google Scholar) and call browser_click({ selector: "<mmid>" }).
   - Calling browser_click on a PDF link automatically captures and downloads the file into the user's download folder.
4. STRICT PROHIBITION: You must NEVER call browser_final_response before you have actually executed browser_click on the download elements! Hallucinating that files were downloaded without calling browser_click is strictly prohibited.
5. Only call browser_final_response AFTER you have clicked and downloaded the requested number of papers.`.trim();
    } else if (activeUrl && activeUrl !== "about:blank") {
      promptToSend = `[Active Browser URL: ${activeUrl}]\nUser Instruction: "${command}"`;
    }

    return new Promise((resolve, reject) => {
      let fullTokens = "";
      let stepCount = 1;

      AntigravityCliClient.streamTask({
        prompt: promptToSend,
        cwd: process.cwd(),
        onToken: async (delta, accumulated) => {
          fullTokens = accumulated;
          this._emit(taskId, "agent_token", { delta, accumulated });
          const currPage = await browserManager.getPage().catch(() => activePage);
          if (currPage && !currPage.isClosed()) {
            await uiManager.streamToken(currPage, accumulated).catch(() => {});
          }
        },
        onThought: async (thoughtText) => {
          this._emit(taskId, "agent_thought", { text: thoughtText });
          const currPage = await browserManager.getPage().catch(() => activePage);
          if (currPage && !currPage.isClosed()) {
            await uiManager.addSystemMessage(currPage, String(thoughtText), "thought").catch(() => {});
          }
        },
        onToolCall: async (toolUpdate) => {
          stepCount++;
          let toolDesc = "Executing browser action...";
          if (Array.isArray(toolUpdate.tool_calls) && toolUpdate.tool_calls.length > 0) {
            const tc = toolUpdate.tool_calls[0];
            const cleanName = (tc.name || "action").replace(/^browser_/, "");
            const cleanArgs = tc.args ? JSON.stringify(tc.args) : "";
            toolDesc = `⚡ ${cleanName} ${cleanArgs}`.trim();
          } else if (toolUpdate.step_type) {
            toolDesc = `⚡ Action: ${toolUpdate.step_type}`;
          }

          this._emit(taskId, "action_completed", {
            stepIndex: stepCount,
            toolName: "antigravity_tool",
            result: toolUpdate,
          });
          const currPage = await browserManager.getPage().catch(() => activePage);
          if (currPage && !currPage.isClosed()) {
            await uiManager.addSystemMessage(currPage, toolDesc, "browser").catch(() => {});
          }
        },
        onDone: async (result) => {
          const durationMs = Date.now() - startTime;
          const finalAnswer = result.response || fullTokens || "Task completed successfully.";

          TaskRepository.complete(taskId, finalAnswer, stepCount, durationMs);
          SessionRepository.touch(sessionId, { status: "COMPLETED", model: options.model || null });
          this._emit(taskId, "task_completed", {
            taskId,
            sessionId,
            finalResponse: finalAnswer,
            totalSteps: stepCount,
            durationMs,
          });

          const finalPage = await browserManager.getPage().catch(() => activePage);
          if (finalPage && !finalPage.isClosed()) {
            await uiManager.addSystemMessage(finalPage, finalAnswer, "done").catch(() => {});
            await uiManager.commandCompleted(finalPage).catch(() => {});
          }

          // Trigger AI session title generation asynchronously
          this._autoGenerateSessionTitle(sessionId, command, finalAnswer, options.model || null).catch(() => {});

          resolve({
            taskId,
            sessionId,
            status: "COMPLETED",
            finalResponse: finalAnswer,
            totalSteps: stepCount,
            durationMs,
            agent: "antigravity",
          });
        },
        onError: async (err) => {
          const durationMs = Date.now() - startTime;
          logger.error(`[Orchestrator] Antigravity task error: ${err.message}`);
          TaskRepository.fail(taskId, err.message, stepCount, durationMs);
          SessionRepository.touch(sessionId, { status: "FAILED", model: options.model || null });
          this._emit(taskId, "task_failed", { taskId, sessionId, error: err.message });

          const finalPage = await browserManager.getPage().catch(() => activePage);
          if (finalPage && !finalPage.isClosed()) {
            await uiManager.addSystemMessage(finalPage, `Antigravity CLI Error: ${err.message}`, "done").catch(() => {});
            await uiManager.commandCompleted(finalPage).catch(() => {});
          }

          reject(err);
        },
      });
    });
  }

  async _autoGenerateSessionTitle(sessionId, command, finalAnswer, model) {
    if (!sessionId) return;
    try {
      const session = SessionRepository.getById(sessionId);
      const isDefaultTitle = !session || !session.title || session.title === "New AI Chat" ||
        session.title === command.trim().slice(0, 80) || session.total_turns <= 1;

      if (!isDefaultTitle) return;

      const { llmClient } = await import("./llmClient.js");
      const titlePrompt = `Generate a very short, professional, descriptive 3 to 5 word title for this chat conversation.
User Request: "${command}"
Assistant Response: "${(finalAnswer || "").slice(0, 250)}"

Rules:
- Exactly 3 to 5 words.
- Do NOT use quotes, brackets, or ending punctuation.
- Be concise and descriptive (e.g., "Amazon Headphone Search", "Weather Forecast Check", "AI Assistant Overview", "React Code Refactoring").
Title:`;

      const generated = await llmClient.generateText({
        systemPrompt: "You are a concise title generator. Output only the short 3-5 word title text, nothing else.",
        userPrompt: titlePrompt,
        model,
        temperature: 0.3,
        maxTokens: 25,
      }).catch(() => null);

      let cleanTitle = (generated || "").replace(/["'`*#]/g, "").replace(/\.+$/, "").trim();
      if (cleanTitle && cleanTitle.length >= 3 && cleanTitle.length <= 60 && !cleanTitle.toLowerCase().includes("user request")) {
        logger.info(`[Orchestrator] AI generated title for session "${sessionId}": "${cleanTitle}"`);
        SessionRepository.updateTitle(sessionId, cleanTitle);
        uiManager.setActiveSession(sessionId, cleanTitle);

        const activePage = await browserManager.getPage().catch(() => null);
        if (activePage && !activePage.isClosed()) {
          await activePage.evaluate(({ sid, title }) => {
            window.agenticSidebar?.updateSessionTitle?.(sid, title);
          }, { sid: sessionId, title: cleanTitle }).catch(() => {});
        }
      }
    } catch (err) {
      logger.debug(`[Orchestrator] AI title generation notice: ${err.message}`);
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
