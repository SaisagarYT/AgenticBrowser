"use strict";

export const DOM_INJECTION_SCRIPT = `
(() => {
  let counter = 1;
  const elements = document.querySelectorAll('a, button, input, textarea, select, [role="button"], [role="link"], [role="checkbox"], [tabindex], [contenteditable="true"]');
  
  elements.forEach((el) => {
    if (!el.getAttribute('mmid')) {
      el.setAttribute('mmid', String(counter++));
    }
  });

  return {
    taggedCount: counter - 1,
    url: window.location.href,
    title: document.title,
  };
})();
`;

export async function tagInteractiveElements(page) {
  try {
    return await page.evaluate(DOM_INJECTION_SCRIPT);
  } catch {
    return { taggedCount: 0, url: page.url(), title: "" };
  }
}

export async function extractDomRepresentation(page, contentType = "fields") {
  await tagInteractiveElements(page);

  if (contentType === "text_only") {
    return await page.evaluate(() => {
      const clone = document.body.cloneNode(true);
      const scripts = clone.querySelectorAll("script, style, noscript, svg");
      scripts.forEach((s) => s.remove());
      return clone.innerText.replace(/\\n{3,}/g, "\\n\\n").trim();
    });
  }

  // "fields" or full representation
  return await page.evaluate(() => {
    const interactive = Array.from(
      document.querySelectorAll('[mmid]')
    );

    const items = interactive.map((el) => {
      const tag = el.tagName.toLowerCase();
      const mmid = el.getAttribute("mmid");
      const text = (el.innerText || el.textContent || el.value || el.placeholder || "").trim().slice(0, 80);
      const type = el.getAttribute("type") || "";
      const ariaLabel = el.getAttribute("aria-label") || "";
      const href = el.getAttribute("href") || "";

      let desc = `<${tag} mmid="${mmid}"`;
      if (type) desc += ` type="${type}"`;
      if (ariaLabel) desc += ` aria-label="${ariaLabel}"`;
      if (text) desc += ` text="${text}"`;
      if (href && href.startsWith("http")) desc += ` href="${href.slice(0, 60)}"`;
      desc += " />";

      return desc;
    });

    return {
      title: document.title,
      url: window.location.href,
      interactiveElements: items.slice(0, 150),
    };
  });
}
