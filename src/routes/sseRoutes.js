"use strict";

import express from "express";
import { orchestrator } from "../core/orchestrator.js";

export const sseRouter = express.Router();

sseRouter.get("/tasks/:id/stream", (req, res) => {
  const taskId = req.params.id;

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.flushHeaders();

  res.write(`data: ${JSON.stringify({ event: "connected", taskId })}\n\n`);

  const listener = (data) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);

    if (data.event === "task_completed" || data.event === "task_failed") {
      res.end();
    }
  };

  orchestrator.on(`task:${taskId}`, listener);

  req.on("close", () => {
    orchestrator.off(`task:${taskId}`, listener);
  });
});
