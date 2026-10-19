#!/usr/bin/env node
"use strict";

import readline from "node:readline";
import fs from "node:fs";
import path from "node:path";

const PORT_FILE = path.resolve(process.cwd(), "data", "control_port.txt");
const DEFAULT_PORT = 39100;

function getPort() {
  if (fs.existsSync(PORT_FILE)) {
    try {
      const port = parseInt(fs.readFileSync(PORT_FILE, "utf8").trim(), 10);
      if (!isNaN(port) && port > 0) return port;
    } catch { }
  }
  return DEFAULT_PORT;
}

async function callControlServer(endpoint, method = "GET", body = null) {
  const port = getPort();
  const url = `http://127.0.0.1:${port}${endpoint}`;
  try {
    const opts = {
      method,
      headers: { "Content-Type": "application/json" },
    };
    if (body) {
      opts.body = JSON.stringify(body);
    }
    const res = await fetch(url, opts);
    return await res.json();
  } catch (err) {
    return {
      success: false,
      error: `Could not connect to AgenticBrowser at ${url}. Ensure the browser GUI is running (.\\gui.bat). Error: ${err.message}`,
    };
  }
}

const TOOLS = [
  {
    name: "browser_open_url",
    description: "Navigate directly to a website URL in the user's active browser window (e.g. 'https://www.amazon.in', 'https://www.google.com').",
    inputSchema: {
      type: "object",
      properties: {
        url: { type: "string", description: "The full URL to navigate to" },
      },
      required: ["url"],
    },
  },
  {
    name: "browser_get_dom",
    description: "Inspect the current web page DOM to find interactive elements (buttons, inputs, links) labeled with mmid numbers (e.g. '5' or '[mmid=\"5\"]').",
    inputSchema: {
      type: "object",
      properties: {
        contentType: {
          type: "string",
          enum: ["fields", "text_only"],
          description: "Use 'fields' to see interactive elements and semantic blocks, or 'text_only' for readable article text.",
          default: "fields",
        },
      },
    },
  },
  {
    name: "browser_click",
    description: "Click an interactive button, link, or tab using its mmid attribute (e.g. '5' or '[mmid=\"5\"]') or CSS selector.",
    inputSchema: {
      type: "object",
      properties: {
        selector: { type: "string", description: "The mmid number (e.g. '5' or '[mmid=\"5\"]') or CSS selector of the element to click" },
      },
      required: ["selector"],
    },
  },
  {
    name: "browser_type",
    description: "Type text into an input search bar, textarea, or form field identified by its mmid or selector.",
    inputSchema: {
      type: "object",
      properties: {
        selector: { type: "string", description: "The mmid number (e.g. '3') or CSS selector for the input field" },
        text: { type: "string", description: "The text to enter" },
        pressEnter: { type: "boolean", description: "Set to true to press Enter immediately after typing (ideal for search boxes)", default: false },
      },
      required: ["selector", "text"],
    },
  },
  {
    name: "browser_type_and_click",
    description: "Atomic typing into an input field and clicking a submit button in one action.",
    inputSchema: {
      type: "object",
      properties: {
        inputSelector: { type: "string", description: "The mmid or selector for the input field" },
        text: { type: "string", description: "Text to type" },
        clickSelector: { type: "string", description: "The mmid or selector for the submit/search button to click" },
      },
      required: ["inputSelector", "text", "clickSelector"],
    },
  },
  {
    name: "browser_press_key",
    description: "Press a keyboard key or combination (e.g. 'Enter', 'Tab', 'Escape', 'ArrowDown').",
    inputSchema: {
      type: "object",
      properties: {
        key: { type: "string", description: "Key name (e.g. 'Enter', 'Escape')" },
      },
      required: ["key"],
    },
  },
  {
    name: "browser_google_search",
    description: "Search Google directly when you don't know the direct URL.",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Search query" },
      },
      required: ["query"],
    },
  },
  {
    name: "browser_scroll",
    description: "Scroll the page viewport or a specific container to reveal content below/above the fold, explore feeds, or trigger infinite scroll.",
    inputSchema: {
      type: "object",
      properties: {
        direction: {
          type: "string",
          enum: ["down", "up", "top", "bottom", "left", "right"],
          description: "Scroll direction (default 'down')",
          default: "down",
        },
        amount: {
          type: "string",
          description: "Scroll distance in pixels (e.g. '600'), 'half_page', 'full_page', or 'auto'",
          default: "auto",
        },
        selector: {
          type: "string",
          description: "Optional mmid or CSS selector for a specific scrollable container or feed",
        },
      },
    },
  },
  {
    name: "browser_scroll_to_element",
    description: "Scroll specifically to bring a target element (button, link, heading, card) into the center of the viewport.",
    inputSchema: {
      type: "object",
      properties: {
        selector: {
          type: "string",
          description: "The mmid number (e.g. '12' or '[mmid=\"12\"]') or CSS selector of the element to scroll into view",
        },
      },
      required: ["selector"],
    },
  },
  {
    name: "browser_take_screenshot",
    description: "Capture a screenshot of the current page viewport for visual verification.",
    inputSchema: {
      type: "object",
      properties: {
        name: { type: "string", description: "Optional name prefix for the screenshot file" },
      },
    },
  },
  {
    name: "browser_final_response",
    description: "Call this when the user's objective is completed to present the final answer and summary.",
    inputSchema: {
      type: "object",
      properties: {
        answer: { type: "string", description: "Concise, conversational answer describing what was accomplished" },
        summary: { type: "string", description: "Optional summary of key findings" },
      },
      required: ["answer"],
    },
  },
];

let completedDownloadsCount = 0;

async function handleToolCall(name, args) {
  let skill = name.replace(/^browser_/, "");
  let skillParams = { ...args };

  if (skill === "open_url") skill = "open_url";
  if (skill === "get_dom") {
    skill = "get_dom_with_content_type";
    skillParams = { contentType: args.contentType || "fields" };
  }
  if (skill === "click") skill = "click_using_selector";
  if (skill === "type") skill = "enter_text_using_selector";
  if (skill === "type_and_click") skill = "enter_text_and_click";
  if (skill === "press_key") skill = "press_key_combination";
  if (skill === "take_screenshot" || skill === "screenshot") skill = "take_screenshot";
  if (skill === "scroll") skill = "scroll_page";
  if (skill === "scroll_to_element") skill = "scroll_to_element";

  if (skill === "final_response") {
    const answer = args.answer || "";
    // If agent claims it downloaded papers but never actually clicked any download link
    if (/\bdownload(ed)?\b.*\b(articles?|papers?|pdf)\b/i.test(answer) && completedDownloadsCount === 0) {
      return {
        content: [{
          type: "text",
          text: "ERROR: You claimed to have downloaded articles, but you have NOT clicked any download or [PDF] link! No files were downloaded to disk. You must call browser_get_dom to find the [PDF] or article download buttons (e.g. '[PDF] arxiv.org' on Google Scholar or 'View PDF' on arXiv) and click them with browser_click({ selector: '<mmid>' }). Do NOT finalize until browser_click has actually executed."
        }],
        isError: true,
      };
    }
  }

  const res = await callControlServer("/execute", "POST", {
    tool: skill,
    parameters: skillParams,
  });

  if (!res.success) {
    return {
      content: [{ type: "text", text: `Error: ${res.error}` }],
      isError: true,
    };
  }

  if (res.result && (res.result.downloaded || res.result.filePath)) {
    completedDownloadsCount++;
  }

  const outputText = typeof res.result === "object" ? JSON.stringify(res.result, null, 2) : String(res.result || "Action executed successfully.");

  return {
    content: [{ type: "text", text: outputText }],
    isError: false,
  };
}

function sendResponse(id, result, error = null) {
  const resp = { jsonrpc: "2.0", id };
  if (error) {
    resp.error = error;
  } else {
    resp.result = result;
  }
  process.stdout.write(JSON.stringify(resp) + "\n");
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false,
});

rl.on("line", async (line) => {
  const trimmed = line.trim();
  if (!trimmed) return;

  try {
    const msg = JSON.parse(trimmed);

    // 1. Initialize
    if (msg.method === "initialize") {
      sendResponse(msg.id, {
        protocolVersion: "2024-11-05",
        capabilities: {
          tools: {},
        },
        serverInfo: {
          name: "agentic-browser-mcp",
          version: "1.0.0",
        },
      });
      return;
    }

    // 2. Notification initialized
    if (msg.method === "notifications/initialized") {
      return;
    }

    // 3. Ping
    if (msg.method === "ping") {
      sendResponse(msg.id, {});
      return;
    }

    // 4. List tools
    if (msg.method === "tools/list") {
      sendResponse(msg.id, { tools: TOOLS });
      return;
    }

    // 5. Call tool
    if (msg.method === "tools/call") {
      const toolName = msg.params?.name;
      const toolArgs = msg.params?.arguments || {};
      const toolResult = await handleToolCall(toolName, toolArgs);
      sendResponse(msg.id, toolResult);
      return;
    }

    // Unhandled method
    if (msg.id !== undefined) {
      sendResponse(msg.id, null, {
        code: -32601,
        message: `Method not found: ${msg.method}`,
      });
    }
  } catch (err) {
    sendResponse(null, null, {
      code: -32700,
      message: `Parse error: ${err.message}`,
    });
  }
});
