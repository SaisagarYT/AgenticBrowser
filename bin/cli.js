#!/usr/bin/env node
"use strict";

import readline from "node:readline";
import { orchestrator } from "../src/core/orchestrator.js";
import { browserManager } from "../src/core/browserManager.js";
import { AntigravityCliClient } from "../src/core/antigravityCliClient.js";
import { getDatabase } from "../src/db/database.js";

// Initialize SQLite database
getDatabase();
AntigravityCliClient.warmup();

async function main() {
  const args = process.argv.slice(2);
  let command = args.join(" ").trim();

  console.log("\n==========================================================");
  console.log("🤖 Agentic Browser (Node.js + Playwright + SQLite)");
  console.log("   3-Agent Collaborative Triad: Planner -> Browser -> Critique");
  console.log("==========================================================\n");

  if (args.includes("--help") || args.includes("-h")) {
    console.log("Usage: node bin/cli.js [task description] [--gui]");
    console.log("\nExamples:");
    console.log('  node bin/cli.js --gui                                            (Open browser to Google with in-page chat overlay)');
    console.log('  node bin/cli.js "Search google for latest Node.js release"');
    console.log('  node bin/cli.js "Open https://news.ycombinator.com"');
    console.log("\nOptions:");
    console.log("  --gui         Launch browser directly with floating in-page chat interface");
    console.log("  -h, --help    Show this help message\n");
    process.exit(0);
  }

  // Interactive In-Browser GUI mode (Exact match of TheAgenticBrowser Python GUI mode)
  if (args.includes("--gui") || !command) {
    console.log("🌐 Launching Chromium GUI Mode on https://www.google.com with in-page chat overlay...");
    console.log("👉 You can now chat and send tasks directly inside the floating chat box on the web page!");
    console.log("   (Press Ctrl+C in this terminal when finished)\n");

    orchestrator.on("plan_updated", (data) => {
      console.log(`📋 [PLANNER - Step ${data.stepIndex}]: ${data.currentInstruction}`);
    });
    orchestrator.on("browser_acting", (data) => {
      console.log(`⚡ [BROWSER]: ${data.instruction}`);
    });
    orchestrator.on("critique_completed", (data) => {
      console.log(`🔍 [CRITIQUE]: ${data.verdict} - ${data.feedback}`);
    });

    await browserManager.initialize();
    // Keep alive until terminal interruption
    await new Promise(() => {});
    return;
  }

  console.log(`\nStarting Task: "${command}"\n`);

  orchestrator.on("plan_updated", (data) => {
    console.log(`\n📋 [PLANNER - Step ${data.stepIndex}]`);
    console.log(`Target Action: ${data.currentInstruction}`);
    if (data.reasoning) console.log(`Reasoning: ${data.reasoning}`);
  });

  orchestrator.on("browser_acting", (data) => {
    console.log(`⚡ [BROWSER AGENT] Executing: ${data.instruction}`);
  });

  orchestrator.on("action_completed", (data) => {
    console.log(`   Tool: ${data.toolName} | Status: ${data.result?.error ? "FAILED" : "OK"}`);
    if (data.screenshot) console.log(`   Screenshot: ${data.screenshot}`);
  });

  orchestrator.on("critique_completed", (data) => {
    console.log(`🔍 [CRITIQUE AGENT] Verdict: ${data.verdict}`);
    console.log(`   Feedback: ${data.feedback}`);
  });

  try {
    const result = await orchestrator.runTask(command);
    console.log("\n==========================================================");
    console.log("🎉 TASK COMPLETED");
    console.log("==========================================================");
    console.log(result.finalResponse);
    console.log(`\nTotal Steps: ${result.totalSteps} | Duration: ${(result.durationMs / 1000).toFixed(1)}s\n`);
  } catch (err) {
    console.error(`\n❌ TASK FAILED: ${err.message}\n`);
  } finally {
    await browserManager.close();
    process.exit(0);
  }
}

main();
