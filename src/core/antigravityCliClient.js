"use strict";

import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import readline from "node:readline";
import { logger } from "../utils/logger.js";

/**
 * Client for interacting with the local Google Antigravity CLI (agy)
 * via non-interactive JSON stream IPC.
 */
export class AntigravityCliClient {
  /**
   * Resolves the absolute path to the local agy executable.
   */
  static getExecutablePath() {
    // 1. Explicit override via environment
    if (process.env.ANTIGRAVITY_BIN && fs.existsSync(process.env.ANTIGRAVITY_BIN)) {
      return process.env.ANTIGRAVITY_BIN;
    }

    // 2. Standard user home installation: ~/.gemini/bin/agy.exe
    const defaultHomeBin = path.join(os.homedir(), ".gemini", "bin", process.platform === "win32" ? "agy.exe" : "agy");
    if (fs.existsSync(defaultHomeBin)) {
      return defaultHomeBin;
    }

    // 3. Fallback to system PATH
    return process.platform === "win32" ? "agy.exe" : "agy";
  }

  /**
   * Checks whether the Antigravity CLI binary exists and is accessible.
   */
  static isAvailable() {
    const binPath = this.getExecutablePath();
    if (path.isAbsolute(binPath)) {
      return fs.existsSync(binPath);
    }
    return true;
  }

  /**
   * Streams a task prompt through the Antigravity CLI using stream-json output.
   *
   * @param {Object} options
   * @param {string} options.prompt - Prompt or command to execute
   * @param {string} [options.cwd] - Working directory for the agent
   * @param {string} [options.conversationId] - Optional conversation ID to continue
   * @param {Function} [options.onToken] - Callback for streaming response text deltas
   * @param {Function} [options.onThought] - Callback for reasoning/thinking steps
   * @param {Function} [options.onToolCall] - Callback when agent invokes a tool
   * @param {Function} [options.onDone] - Callback when turn completes successfully
   * @param {Function} [options.onError] - Callback when an error occurs
   * @returns {{ abort: Function, pid: number }}
   */
  static streamTask({
    prompt,
    cwd = process.cwd(),
    conversationId = null,
    onToken = null,
    onThought = null,
    onToolCall = null,
    onDone = null,
    onError = null,
  }) {
    const binPath = this.getExecutablePath();
    logger.info(`[AntigravityCli] Spawning agent process: ${binPath} (cwd: ${cwd})`);

    const args = [
      "--print",
      prompt,
      "--output-format",
      "stream-json",
      "--dangerously-skip-permissions",
    ];

    if (conversationId) {
      args.push("--conversation", conversationId);
    }

    const proc = spawn(binPath, args, {
      cwd,
      env: {
        ...process.env,
        CI: "1",
        PAGER: "cat",
      },
      windowsHide: true,
    });

    let fullResponse = "";
    let activeConversationId = conversationId;
    let turnResult = null;
    let completed = false;

    const rl = readline.createInterface({
      input: proc.stdout,
      crlfDelay: Infinity,
    });

    rl.on("line", (line) => {
      const trimmed = line.trim();
      if (!trimmed) return;

      try {
        const data = JSON.parse(trimmed);

        if (data.event === "init") {
          activeConversationId = data.conversation_id || activeConversationId;
          logger.debug(`[AntigravityCli] Agent initialized with session: ${activeConversationId}`);
        } else if (data.event === "step_update") {
          const update = data.step_update || {};

          // Text token streaming
          if (update.text_delta) {
            fullResponse += update.text_delta;
            if (typeof onToken === "function") {
              onToken(update.text_delta, fullResponse);
            }
          }

          // Tool call notification
          if (update.step_type === "tool_call" || update.tool_calls) {
            if (typeof onToolCall === "function") {
              onToolCall(update);
            }
          }

          // Thought / reasoning notification
          if (update.thought || update.thinking) {
            if (typeof onThought === "function") {
              onThought(update.thought || update.thinking);
            }
          }
        } else if (data.event === "result") {
          turnResult = data.result || {};
          if (turnResult.response && !fullResponse) {
            fullResponse = turnResult.response;
          }
        }
      } catch (err) {
        logger.debug(`[AntigravityCli] Raw stdout (non-JSON): ${trimmed}`);
      }
    });

    let stderrBuffer = "";
    proc.stderr.on("data", (chunk) => {
      stderrBuffer += chunk.toString("utf8");
    });

    proc.on("error", (err) => {
      logger.error(`[AntigravityCli] Process execution error: ${err.message}`);
      if (!completed) {
        completed = true;
        if (typeof onError === "function") {
          onError(err);
        }
      }
    });

    proc.on("close", (code) => {
      logger.info(`[AntigravityCli] Process exited with code ${code}`);
      if (!completed) {
        completed = true;
        if (code === 0) {
          if (typeof onDone === "function") {
            onDone({
              status: "SUCCESS",
              response: fullResponse.trim() || turnResult?.response || "Task executed successfully.",
              conversationId: activeConversationId,
              usage: turnResult?.usage || null,
            });
          }
        } else {
          const errMsg = stderrBuffer.trim() || `Antigravity CLI process failed with exit code ${code}`;
          if (typeof onError === "function") {
            onError(new Error(errMsg));
          }
        }
      }
    });

    return {
      abort: () => {
        try {
          proc.kill("SIGTERM");
        } catch { }
      },
      pid: proc.pid,
      getConversationId: () => activeConversationId,
    };
  }
}
