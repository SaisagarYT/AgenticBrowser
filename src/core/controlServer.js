"use strict";

import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { executeSkill, TOOL_DESCRIPTIONS } from "../skills/index.js";
import { browserManager } from "./browserManager.js";
import { uiManager } from "../utils/uiManager.js";
import { logger } from "../utils/logger.js";
import { extractDomRepresentation } from "../utils/domHelper.js";

const DEFAULT_PORT = 39100;
const PORT_FILE = path.resolve(process.cwd(), "data", "control_port.txt");

let serverInstance = null;
let activePort = DEFAULT_PORT;

export function getControlPort() {
  if (fs.existsSync(PORT_FILE)) {
    try {
      const saved = parseInt(fs.readFileSync(PORT_FILE, "utf8").trim(), 10);
      if (!isNaN(saved) && saved > 0) return saved;
    } catch {
      // Ignore
    }
  }
  return activePort;
}

export async function startControlServer(preferredPort = DEFAULT_PORT) {
  if (serverInstance) {
    return activePort;
  }

  return new Promise((resolve) => {
    const server = http.createServer(async (req, res) => {
      // Allow local CORS
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
      res.setHeader("Access-Control-Allow-Headers", "Content-Type");

      if (req.method === "OPTIONS") {
        res.writeHead(204);
        res.end();
        return;
      }

      const url = new URL(req.url, `http://127.0.0.1:${activePort}`);

      // 1. Health check
      if (url.pathname === "/health" && req.method === "GET") {
        let pageUrl = "about:blank";
        try {
          if (browserManager.page && !browserManager.page.isClosed()) {
            pageUrl = browserManager.page.url();
          }
        } catch { }

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ status: "ok", activeUrl: pageUrl, port: activePort }));
        return;
      }

      // 2. Available tools description
      if (url.pathname === "/tools" && req.method === "GET") {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ tools: TOOL_DESCRIPTIONS }));
        return;
      }

      // 3. Extract DOM representation directly
      if (url.pathname === "/dom" && req.method === "GET") {
        try {
          const page = await browserManager.getPage();
          const dom = await extractDomRepresentation(page, "fields");
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ success: true, dom }));
        } catch (err) {
          res.writeHead(500, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ success: false, error: err.message }));
        }
        return;
      }

      // 4. Execute a browser action
      if (url.pathname === "/execute" && req.method === "POST") {
        let body = "";
        req.on("data", (chunk) => {
          body += chunk;
        });

        req.on("end", async () => {
          try {
            const data = JSON.parse(body || "{}");
            const skillName = data.tool || data.skill || data.name;
            const params = data.parameters || data.params || data.args || {};

            if (!skillName) {
              res.writeHead(400, { "Content-Type": "application/json" });
              res.end(JSON.stringify({ success: false, error: "Missing 'tool' parameter" }));
              return;
            }

            logger.info(`[ControlServer] Executing tool: ${skillName} with ${JSON.stringify(params)}`);

            // Notify overlay in-page
            const page = await browserManager.getPage().catch(() => null);
            if (page && !page.isClosed()) {
              const actionLabel = `Tool: ${skillName} ${JSON.stringify(params)}`;
              await uiManager.addSystemMessage(page, actionLabel, "browser").catch(() => {});
            }

            const result = await executeSkill(skillName, params);

            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ success: true, result }));
          } catch (err) {
            logger.error(`[ControlServer] Tool execution error: ${err.message}`);
            res.writeHead(500, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ success: false, error: err.message }));
          }
        });
        return;
      }

      // Not found
      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Endpoint not found" }));
    });

    const listenOnPort = (port) => {
      server.listen(port, "127.0.0.1", () => {
        activePort = port;
        serverInstance = server;
        try {
          const dir = path.dirname(PORT_FILE);
          if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
          fs.writeFileSync(PORT_FILE, String(port), "utf8");
        } catch { }

        logger.info(`[ControlServer] Local browser control server listening on http://127.0.0.1:${port}`);
        resolve(activePort);
      });

      server.on("error", (err) => {
        if (err.code === "EADDRINUSE") {
          logger.warn(`[ControlServer] Port ${port} in use, trying next port...`);
          listenOnPort(port + 1);
        } else {
          logger.error(`[ControlServer] Server error: ${err.message}`);
          resolve(null);
        }
      });
    };

    listenOnPort(preferredPort);
  });
}

export function stopControlServer() {
  if (serverInstance) {
    try {
      serverInstance.close();
      if (fs.existsSync(PORT_FILE)) fs.unlinkSync(PORT_FILE);
    } catch { }
    serverInstance = null;
  }
}
