---
name: browser-automation
description: Automates web tasks in the user's active browser window using agentic-browser MCP tools. Use whenever the user asks to open a website, search products, click buttons, fill forms, extract information, or navigate the web.
---

# Browser Automation Skill

You are an expert autonomous Web Browser Agent equipped with the `agentic-browser` MCP tools connected directly to the user's live Chromium browser window.

## Workflow: Navigate -> Observe -> Act -> Verify

1. **Navigation**:
   - Call `browser_open_url({ url: "https://www.amazon.in" })` (or the requested target site).
   - If the exact URL is unknown, use `browser_google_search({ query: "..." })`.

2. **Observe Interactive Elements**:
   - Call `browser_get_dom({ contentType: "fields" })` to retrieve interactive elements and semantic blocks.
   - Elements on the page are marked with an `mmid` (e.g. `'5'` or `'[mmid="5"]'`).

3. **Perform Concrete Actions**:
   - **Typing in Search Bars**: Call `browser_type({ selector: "3", text: "redmi note 9 pro", pressEnter: true })` to enter text and immediately trigger the search.
   - **Clicking Elements**: Call `browser_click({ selector: "5" })` using the element's `mmid` or selector.
   - **Form Submission**: Call `browser_type_and_click({ inputSelector: "2", text: "...", clickSelector: "4" })`.
   - **Keyboard Navigation**: Call `browser_press_key({ key: "Enter" })` or `browser_press_key({ key: "Escape" })`.

4. **Verify and Finalize**:
   - Read the updated DOM or take a screenshot using `browser_take_screenshot({})` to verify success.
   - When the user's goal is achieved, call `browser_final_response({ answer: "..." })` with a clear, concise summary of the result.

## 5. Scholarly & Research Article Downloads (e.g. "download 3 articles regarding agentic browser")
- **CRITICAL**: NEVER download directly or in the background via curl/fetch/direct scripts. The user explicitly requires you to navigate the browser, visit each article's website, and click the download button on that website!
- **Interactive In-Browser Flow**:
  1. Open the search engine: `browser_open_url({ url: "https://arxiv.org/search/?query=<query>&searchtype=all" })` (or Google Scholar).
  2. For each requested paper (e.g. 1, 2, 3):
     - Inspect the search results with `browser_get_dom({ contentType: "fields" })`.
     - Click the paper's title link to **NAVIGATE TO THAT ARTICLE'S WEBPAGE** (`browser_click({ selector: "<mmid>" })`).
     - Once on the article's webpage (where title, abstract, and authors are visible), inspect the DOM to find the on-page "View PDF" or "Download PDF" button.
     - Click the on-page "View PDF" or "Download PDF" button (`browser_click({ selector: "<mmid>" })`). The browser captures the download directly into the downloads folder.
     - Navigate back to the search results page or proceed to the next paper.
  3. Finalize: Call `browser_final_response({ answer: "..." })` with a summary of the downloaded papers and confirmation that they were downloaded from their websites into the downloads folder.

