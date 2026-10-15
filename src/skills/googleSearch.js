"use strict";

import { config } from "../config.js";
import { browserManager } from "../core/browserManager.js";
import { logger } from "../utils/logger.js";

export async function googleSearch({ query, num = 10 }) {
  if (!query) throw new Error("Query parameter is required");

  logger.info(`Searching web for: "${query}"`);

  // Option 1: Official Google Custom Search API if keys are provided
  if (config.googleSearch.apiKey && config.googleSearch.cx) {
    try {
      const url = new URL("https://www.googleapis.com/customsearch/v1");
      url.searchParams.set("key", config.googleSearch.apiKey);
      url.searchParams.set("cx", config.googleSearch.cx);
      url.searchParams.set("q", query);
      url.searchParams.set("num", String(Math.min(num, 10)));

      const res = await fetch(url.toString());
      if (!res.ok) {
        throw new Error(`Google API returned status ${res.status}`);
      }

      const data = await res.json();
      const results = (data.items || []).map((item) => ({
        title: item.title,
        link: item.link,
        snippet: item.snippet,
      }));

      return {
        mode: "api",
        query,
        count: results.length,
        results,
      };
    } catch (err) {
      logger.warn(`Google Search API failed (${err.message}). Falling back to browser navigation.`);
    }
  }

  // Option 2: Browser navigation fallback
  const page = await browserManager.getPage();
  const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
  await page.goto(searchUrl, { waitUntil: "domcontentloaded" });

  const organicResults = await page.evaluate(() => {
    const list = [];
    const elements = document.querySelectorAll("h3");
    elements.forEach((h3) => {
      const a = h3.closest("a");
      if (a && a.href && !a.href.includes("google.com")) {
        list.push({
          title: h3.innerText.trim(),
          link: a.href,
        });
      }
    });
    return list.slice(0, 8);
  });

  return {
    mode: "browser",
    query,
    count: organicResults.length,
    results: organicResults,
    currentUrl: page.url(),
  };
}
