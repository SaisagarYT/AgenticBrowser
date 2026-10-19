"use strict";

import { browserManager } from "../core/browserManager.js";
import { logger } from "../utils/logger.js";
import { SkillError } from "../utils/errors.js";
import { highlightActionElement } from "../utils/domHelper.js";
import { config } from "../config.js";
import path from "node:path";
import fs from "node:fs";

function resolveSelector(selector) {
  if (!selector) return "";
  const clean = selector.trim();
  // If it's a numeric mmid
  if (/^\d+$/.test(clean)) {
    return `[mmid="${clean}"]`;
  }
  // If user passes mmid="1" or mmid=1
  if (/^mmid=["']?(\d+)["']?$/i.test(clean)) {
    const num = clean.replace(/[^0-9]/g, "");
    return `[mmid="${num}"]`;
  }
  return clean;
}

export async function clickSelector({ selector, timeout = 10000 }) {
  if (!selector) throw new SkillError("Selector parameter is required");

  const resolved = resolveSelector(selector);
  logger.info(`Clicking element: ${resolved}`);
  const page = await browserManager.getPage();

  try {
    const element = page.locator(resolved).first();
    await element.waitFor({ state: "visible", timeout });
    await element.scrollIntoViewIfNeeded();

    // Trigger visual action highlight & click ripple badge (Phase 2)
    await highlightActionElement(page, { selector: resolved, actionType: "click" }).catch(() => {});
    await new Promise((r) => setTimeout(r, 220));

    // Inspect if target element is a PDF / download link (e.g. arXiv [pdf] or Google Scholar link)
    const linkInfo = await element.evaluate((el) => {
      const href = el.href || el.getAttribute("href") || "";
      const text = (el.textContent || "").trim();
      const isPdfOrDownload =
        href.toLowerCase().endsWith(".pdf") ||
        href.includes("/pdf/") ||
        el.hasAttribute("download") ||
        /\b(pdf|download)\b/i.test(text);

      if (isPdfOrDownload && !el.hasAttribute("download")) {
        // Enforce browser file download without navigating away from the search page
        el.setAttribute("download", "");
      }

      // Try to find article title from surrounding card/row context or page header
      let cardTitle = "";
      const parentCard = el.closest(".arxiv-result, .gs_r, article, .search-result, li, tr");
      if (parentCard) {
        const titleEl = parentCard.querySelector("p.title, .title, .gs_rt, h2, h3, a.title");
        if (titleEl) {
          cardTitle = (titleEl.textContent || "").replace(/^Title:\s*/i, "").trim();
        }
      }

      if (!cardTitle) {
        const h1 = document.querySelector("h1.title, h1, .article-title, .title");
        if (h1) {
          cardTitle = (h1.textContent || "").replace(/^(title:|article:)\s*/i, "").trim();
        } else if (document.title) {
          cardTitle = document.title.replace(/\s*\|.*$/, "").replace(/\[[0-9.]+\]\s*/, "").trim();
        }
      }

      return {
        href,
        text,
        isPdfOrDownload,
        cardTitle,
      };
    }).catch(() => ({ isPdfOrDownload: false }));

    // If it's a PDF / download link, race the click with Playwright download event
    if (linkInfo.isPdfOrDownload) {
      const downloadPromise = page.waitForEvent("download", { timeout: 8000 }).catch(() => null);

      try {
        await element.click({ timeout: Math.min(timeout, 3500) });
      } catch (clickErr) {
        await element.click({ force: true, timeout: 3000 }).catch(async () => {
          await element.evaluate((el) => el.click());
        });
      }

      const download = await downloadPromise;
      if (download) {
        const filename = download.suggestedFilename() || `article_${Date.now()}.pdf`;
        const downloadDir = config.getDownloadsDir();
        if (!fs.existsSync(downloadDir)) {
          fs.mkdirSync(downloadDir, { recursive: true });
        }
        const savePath = path.join(downloadDir, filename);
        await download.saveAs(savePath);
        logger.info(`[clickSelector] Captured browser download saved to: ${savePath}`);

        let fileSizeMb = "0.0";
        try {
          const stats = fs.statSync(savePath);
          fileSizeMb = (stats.size / (1024 * 1024)).toFixed(2);
        } catch {}

        const artifact = {
          title: linkInfo.cardTitle || filename.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " "),
          filename,
          filePath: savePath,
          fileSize: `${fileSizeMb} MB`,
          downloadedAt: new Date().toISOString(),
          source: page.url(),
        };

        const sidecarPath = path.join(downloadDir, `${filename.replace(/\.[^/.]+$/, "")}.json`);
        try {
          fs.writeFileSync(sidecarPath, JSON.stringify(artifact, null, 2), "utf8");
        } catch {}

        try {
          const { uiManager } = await import("../utils/uiManager.js");
          await uiManager.addSystemMessage(page, JSON.stringify(artifact), "artifact");
        } catch {}

        return {
          success: true,
          downloaded: true,
          filename,
          filePath: savePath,
          fileSize: `${fileSizeMb} MB`,
          title: artifact.title,
          message: `Successfully clicked and downloaded "${artifact.title}" (${fileSizeMb} MB) to ${savePath}`,
        };
      }
    }

    // Standard click for normal buttons / links
    try {
      await element.click({ timeout: Math.min(timeout, 3500) });
    } catch (clickErr) {
      if (
        clickErr.message.includes("intercepts pointer events") ||
        clickErr.message.includes("Timeout") ||
        clickErr.message.includes("not visible")
      ) {
        logger.warn(`Click on "${resolved}" intercepted or obscured (${clickErr.message.split("\n")[0]}). Retrying with force click...`);
        try {
          await element.click({ force: true, timeout: 3000 });
        } catch (forceErr) {
          logger.warn(`Force click failed on "${resolved}". Dispatching direct DOM click event...`);
          await element.evaluate((el) => {
            el.scrollIntoView({ block: "center", inline: "center" });
            el.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, view: window }));
            if (typeof el.click === "function") el.click();
          });
        }
      } else {
        throw clickErr;
      }
    }

    return {
      success: true,
      selector: resolved,
      message: `Successfully clicked element matching "${resolved}"`,
    };
  } catch (err) {
    throw new SkillError(`Failed to click "${resolved}": ${err.message}`);
  }
}
