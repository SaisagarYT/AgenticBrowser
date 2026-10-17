"use strict";

import express from "express";
import crypto from "node:crypto";
import { orchestrator } from "../core/orchestrator.js";
import { TaskRepository } from "../db/repositories/taskRepository.js";
import { LogRepository } from "../db/repositories/logRepository.js";
import { modelRegistry } from "../core/modelRegistry.js";
import { AntigravityCliClient } from "../core/antigravityCliClient.js";
import { logger } from "../utils/logger.js";

export const apiRouter = express.Router();

/**
 * Compatible with TheAgenticBrowser Python FastAPI endpoint:
 * POST /execute_task
 * Body: { "command": "...", "client_id": "...", "model": "...", "agent": "..." }
 */
apiRouter.post("/execute_task", async (req, res) => {
  const { command, client_id, model, agent } = req.body || {};

  if (!command || typeof command !== "string") {
    return res.status(400).json({ error: "Missing or invalid 'command' field in request body." });
  }

  // If client requested async background execution
  const asyncMode = req.query.async === "true";

  if (asyncMode) {
    const taskId = client_id || crypto.randomUUID();
    orchestrator.runTask(command.trim(), taskId, { model, agent }).catch((err) => {
      logger.error(`Async execution failed for task ${taskId}: ${err.message}`);
    });

    return res.status(202).json({
      message: "Task accepted and running in background.",
      stream_url: `/api/tasks/${taskId}/stream`,
      details_url: `/api/tasks/${taskId}`,
    });
  }

  try {
    const result = await orchestrator.runTask(command.trim(), client_id, { model, agent });
    return res.json(result);
  } catch (err) {
    return res.status(500).json({
      error: "Task execution failed",
      message: err.message,
    });
  }
});

// Standard REST task endpoint
apiRouter.post("/tasks", async (req, res) => {
  const { command, model, agent, async: runAsync } = req.body || {};

  if (!command) {
    return res.status(400).json({ error: "Field 'command' is required." });
  }

  if (runAsync) {
    const taskId = crypto.randomUUID();
    const task = TaskRepository.create({ id: taskId, command });
    orchestrator.runTask(command, taskId, { model, agent }).catch((err) => {
      logger.error(`Async task ${taskId} error: ${err.message}`);
    });
    return res.status(202).json(task);
  }

  try {
    const result = await orchestrator.runTask(command, null, { model, agent });
    return res.json(result);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

apiRouter.get("/tasks", (req, res) => {
  const limit = parseInt(req.query.limit || "50", 10);
  const offset = parseInt(req.query.offset || "0", 10);
  const tasks = TaskRepository.list({ limit, offset });
  return res.json({ count: tasks.length, tasks });
});

apiRouter.get("/tasks/:id", (req, res) => {
  const details = TaskRepository.getFullTaskDetails(req.params.id);
  if (!details) {
    return res.status(404).json({ error: `Task not found with ID ${req.params.id}` });
  }
  return res.json(details);
});

apiRouter.get("/tasks/:id/logs", (req, res) => {
  const logs = LogRepository.getByTask(req.params.id);
  return res.json({ taskId: req.params.id, logs });
});

apiRouter.delete("/tasks/:id", (req, res) => {
  TaskRepository.delete(req.params.id);
  return res.json({ success: true, message: `Task ${req.params.id} deleted` });
});

// Model & Agent Management Endpoints
apiRouter.get("/models", (req, res) => {
  return res.json({
    models: modelRegistry.getModels(),
    providers: modelRegistry.getProviders(),
    antigravityAvailable: AntigravityCliClient.isAvailable(),
  });
});

apiRouter.post("/models", (req, res) => {
  const { id, name, provider, description, baseURL, apiKey } = req.body || {};
  if (!id) {
    return res.status(400).json({ error: "Model ID is required." });
  }

  try {
    const created = modelRegistry.addModel({ id, name, provider, description, baseURL, apiKey });
    return res.status(201).json({ success: true, model: created });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
});

apiRouter.delete("/models/:id", (req, res) => {
  const removed = modelRegistry.removeModel(req.params.id);
  if (!removed) {
    return res.status(404).json({ error: "Model not found." });
  }
  return res.json({ success: true, message: `Model ${req.params.id} removed.` });
});

apiRouter.get("/health", (req, res) => {
  res.json({
    status: "ok",
    service: "agentic-browser-node",
    antigravity: AntigravityCliClient.isAvailable() ? "connected" : "unavailable",
    time: new Date().toISOString(),
  });
});
