"use strict";

/**
 * Markdown & text formatting utilities for AI chat messages.
 */

export function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function stripStartSymbols(str) {
  if (!str) return "";
  let s = String(str).trim();
  // Strip leading emojis, symbols, asterisks, bullet points, numbers with stars, etc.
  s = s.replace(/^[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}*•#⚡✨⭐🌟💡🤖🎉📋✅🔥🎯🏷️✦✧★\s\-_:\.]+/u, "").trim();
  return s;
}

export function formatAiMarkdown(raw) {
  if (!raw) return "";
  let text = stripStartSymbols(raw);

  const lines = text.split("\n");
  const output = [];
  let inCodeBlock = false;
  let codeBuffer = [];

  function formatInline(str) {
    if (!str) return "";
    let s = escapeHtml(str);
    // Bold: **text** or __text__
    s = s.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
    s = s.replace(/__(.*?)__/g, "<strong>$1</strong>");
    // Inline code: `code`
    s = s.replace(/`([^`]+)`/g, '<span class="as-inline-code">$1</span>');
    // Links: [text](url)
    s = s.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" style="color:#facc15;text-decoration:underline;">$1</a>');
    return s;
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Code block toggle
    if (trimmed.startsWith("```")) {
      if (inCodeBlock) {
        output.push(`<pre class="as-code-block"><code>${escapeHtml(codeBuffer.join("\n"))}</code></pre>`);
        codeBuffer = [];
        inCodeBlock = false;
      } else {
        inCodeBlock = true;
        codeBuffer = [];
      }
      continue;
    }

    if (inCodeBlock) {
      codeBuffer.push(line);
      continue;
    }

    if (!trimmed) {
      continue;
    }

    // Check for numbered section headers like "1. Agent Creation & Configuration" or "### 1. Title"
    const numberedHeaderMatch = trimmed.match(/^#{0,3}\s*(\d+\.\s+[\w\s&/\\-]+(?:\*\*|:)?)$/);
    if (numberedHeaderMatch) {
      let title = numberedHeaderMatch[1].replace(/\*\*/g, "").replace(/:$/, "").trim();
      output.push(`<div class="as-ai-heading">${escapeHtml(title)}</div>`);
      continue;
    }

    // Markdown Headings: #, ##, ###
    if (/^#{1,4}\s+/.test(trimmed)) {
      const title = trimmed.replace(/^#{1,4}\s+/, "").trim();
      output.push(`<div class="as-ai-heading">${escapeHtml(title)}</div>`);
      continue;
    }

    // Bullet items (- or * or •)
    if (/^[\-\*•]\s+/.test(trimmed)) {
      const bulletText = trimmed.replace(/^[\-\*•]\s+/, "");
      output.push(`
        <div class="as-ai-bullet">
          <span class="as-bullet-dot"></span>
          <div>${formatInline(bulletText)}</div>
        </div>
      `);
      continue;
    }

    // Numbered list items
    const numListMatch = trimmed.match(/^(\d+[\.\)])\s+(.*)$/);
    if (numListMatch) {
      const num = numListMatch[1];
      const rest = numListMatch[2];
      if (rest.startsWith("**") && rest.includes("**")) {
        output.push(`<div class="as-ai-heading">${formatInline(num + " " + rest)}</div>`);
      } else {
        output.push(`
          <div class="as-ai-bullet">
            <span style="font-weight: 600; color: #facc15; font-size: 11.5px; min-width: 16px;">${num}</span>
            <div>${formatInline(rest)}</div>
          </div>
        `);
      }
      continue;
    }

    // Regular paragraph
    output.push(`<p class="as-ai-p">${formatInline(trimmed)}</p>`);
  }

  if (inCodeBlock && codeBuffer.length > 0) {
    output.push(`<pre class="as-code-block"><code>${escapeHtml(codeBuffer.join("\n"))}</code></pre>`);
  }

  return output.join("");
}

export function getMarkdownCode() {
  return `
  function escapeHtml(str) {
    if (!str) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function stripStartSymbols(str) {
    if (!str) return "";
    let s = String(str).trim();
    s = s.replace(/^[\\u{1F300}-\\u{1F9FF}\\u{2600}-\\u{26FF}\\u{2700}-\\u{27BF}\\u{1F600}-\\u{1F64F}\\u{1F680}-\\u{1F6FF}\\u{1F1E0}-\\u{1F1FF}*•#⚡✨⭐🌟💡🤖🎉📋✅🔥🎯🏷️✦✧★\\s\\-_:\\.]+/u, "").trim();
    return s;
  }

  function formatAiMarkdown(raw) {
    if (!raw) return "";
    let text = stripStartSymbols(raw);

    const lines = text.split("\\n");
    const output = [];
    let inCodeBlock = false;
    let codeBuffer = [];

    function formatInline(str) {
      if (!str) return "";
      let s = escapeHtml(str);
      s = s.replace(/\\*\\*(.*?)\\*\\*/g, "<strong>$1</strong>");
      s = s.replace(/__(.*?)__/g, "<strong>$1</strong>");
      s = s.replace(/\`([^\`]+)\`/g, '<span class="as-inline-code">$1</span>');
      s = s.replace(/\\[([^\\]]+)\\]\\(([^)]+)\\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" style="color:#facc15;text-decoration:underline;">$1</a>');
      return s;
    }

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      if (trimmed.startsWith("\`\`\`")) {
        if (inCodeBlock) {
          output.push(\`<pre class="as-code-block"><code>\${escapeHtml(codeBuffer.join("\\n"))}</code></pre>\`);
          codeBuffer = [];
          inCodeBlock = false;
        } else {
          inCodeBlock = true;
          codeBuffer = [];
        }
        continue;
      }

      if (inCodeBlock) {
        codeBuffer.push(line);
        continue;
      }

      if (!trimmed) {
        continue;
      }

      const numberedHeaderMatch = trimmed.match(/^#{0,3}\\s*(\\d+\\.\\s+[\\w\\s&/\\\\-]+(?:\\*\\*|:)?)$/);
      if (numberedHeaderMatch) {
        let title = numberedHeaderMatch[1].replace(/\\*\\*/g, "").replace(/:$/, "").trim();
        output.push(\`<div class="as-ai-heading">\${escapeHtml(title)}</div>\`);
        continue;
      }

      if (/^#{1,4}\\s+/.test(trimmed)) {
        const title = trimmed.replace(/^#{1,4}\\s+/, "").trim();
        output.push(\`<div class="as-ai-heading">\${escapeHtml(title)}</div>\`);
        continue;
      }

      if (/^[\\-\\-\\*•]\\s+/.test(trimmed)) {
        const bulletText = trimmed.replace(/^[\\-\\-\\*•]\\s+/, "");
        output.push(\`
          <div class="as-ai-bullet">
            <span class="as-bullet-dot"></span>
            <div>\${formatInline(bulletText)}</div>
          </div>
        \`);
        continue;
      }

      const numListMatch = trimmed.match(/^(\\d+[\\.\\)])\\s+(.*)$/);
      if (numListMatch) {
        const num = numListMatch[1];
        const rest = numListMatch[2];
        if (rest.startsWith("**") && rest.includes("**")) {
          output.push(\`<div class="as-ai-heading">\${formatInline(num + " " + rest)}</div>\`);
        } else {
          output.push(\`
            <div class="as-ai-bullet">
              <span style="font-weight: 600; color: #facc15; font-size: 11.5px; min-width: 16px;">\${num}</span>
              <div>\${formatInline(rest)}</div>
            </div>
          \`);
        }
        continue;
      }

      output.push(\`<p class="as-ai-p">\${formatInline(trimmed)}</p>\`);
    }

    if (inCodeBlock && codeBuffer.length > 0) {
      output.push(\`<pre class="as-code-block"><code>\${escapeHtml(codeBuffer.join("\\n"))}</code></pre>\`);
    }

    return output.join("");
  }
  `;
}
