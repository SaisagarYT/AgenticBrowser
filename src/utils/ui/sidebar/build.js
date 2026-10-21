"use strict";

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { getSidebarStyles } from "./styles.js";
import { ICONS, VOXLE_CUBE_SVG } from "./icons.js";
import { getRailHtml, getSidebarHtml } from "./templates.js";
import { getMarkdownCode } from "./markdown.js";
import { getVisionManagerCode } from "./visionManager.js";
import { getPlanManagerCode } from "./planManager.js";
import { getSettingsManagerCode } from "./settingsManager.js";
import { getChatManagerCode } from "./chatManager.js";
import { getInputManagerCode } from "./inputManager.js";
import { getVoiceManagerCode } from "./voiceManager.js";
import { getClientManagerCode } from "./clientManager.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const TEMPLATE_PATH = path.resolve(__dirname, "controller.template.js");
const BUNDLE_PATH = path.resolve(__dirname, "..", "sidebar.bundle.js");

import vm from "node:vm";

export function buildSidebarScript() {
  const stylesText = getSidebarStyles();
  const railHtml = getRailHtml(ICONS);
  const sidebarHtml = getSidebarHtml(ICONS, VOXLE_CUBE_SVG);

  let template = fs.readFileSync(TEMPLATE_PATH, "utf8");

  const iconsBlock = "const ICONS = " + JSON.stringify(ICONS, null, 2) + ";\n  const VOXLE_CUBE_SVG = " + JSON.stringify(VOXLE_CUBE_SVG) + ";";

  template = template.replace("/* __SIDEBAR_STYLES__ */", () => stylesText);
  template = template.replace("/* __ICONS_AND_ASSETS__ */", () => iconsBlock);
  template = template.replace("/* __RAIL_HTML__ */", () => railHtml);
  template = template.replace("/* __SIDEBAR_HTML__ */", () => sidebarHtml);
  template = template.replace("/* __MARKDOWN_MODULE__ */", () => getMarkdownCode());
  template = template.replace("/* __VISION_MODULE__ */", () => getVisionManagerCode());
  template = template.replace("/* __PLAN_MODULE__ */", () => getPlanManagerCode());
  template = template.replace("/* __SETTINGS_MODULE__ */", () => getSettingsManagerCode());
  template = template.replace("/* __CHAT_MODULE__ */", () => getChatManagerCode());
  template = template.replace("/* __INPUT_MODULE__ */", () => getInputManagerCode());
  template = template.replace("/* __VOICE_MODULE__ */", () => getVoiceManagerCode());
  template = template.replace("/* __CLIENT_MODULE__ */", () => getClientManagerCode());

  // Strict JS syntax validation before returning
  new vm.Script(template);

  return template;
}

// When run directly: node build.js
if (process.argv[1] && process.argv[1].endsWith("build.js")) {
  const code = buildSidebarScript();
  fs.writeFileSync(BUNDLE_PATH, code, "utf8");
  console.log("Successfully built modular sidebar script. Bundle Bytes:", code.length);
}
