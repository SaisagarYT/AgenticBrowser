"use strict";

/**
 * Plan Manager
 * Inline Execution Plan Card with progress calculation, status indicators, and interior step action logs.
 */

export function getPlanManagerCode() {
  return `
  // --------------------------------------------------------------------------
  // Plan Card Manager (Inline Chat Component with Dropdown Interior Sections)
  // --------------------------------------------------------------------------
  let planItems = [];
  let currentInlinePlanCard = null;

  function resetPlan() {
    planItems = [];
    currentInlinePlanCard = null;
    if (planWrapper) planWrapper.style.display = "none";
  }

  function getOrCreateInlinePlanCard() {
    if (!currentInlinePlanCard || !contentEl.contains(currentInlinePlanCard)) {
      currentInlinePlanCard = document.createElement("div");
      currentInlinePlanCard.className = "as-inline-plan-card";
      if (currentSkeletonEl && contentEl.contains(currentSkeletonEl)) {
        contentEl.insertBefore(currentInlinePlanCard, currentSkeletonEl);
      } else {
        contentEl.appendChild(currentInlinePlanCard);
      }
    }
    return currentInlinePlanCard;
  }

  function renderInlinePlanCard() {
    if (planItems.length === 0) return;
    if (heroView) heroView.style.display = "none";

    const card = getOrCreateInlinePlanCard();
    const total = planItems.length;
    const completedCount = planItems.filter((i) => i.status === "completed").length;
    const pct = total > 0 ? Math.round((completedCount / total) * 100) : 0;

    const summaryText = \`You have \${total} task\${total === 1 ? "" : "s"} to complete for this workflow.\`;

    let itemsHtml = planItems
      .map((item, idx) => {
        let iconHtml = "";
        if (item.status === "completed") {
          iconHtml = \`
            <div class="as-plan-status-completed" title="Completed">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
          \`;
        } else if (item.status === "in-progress") {
          iconHtml = \`<div class="as-plan-status-in-progress" title="In progress"></div>\`;
        } else {
          iconHtml = \`<div class="as-plan-status-pending" title="Pending"></div>\`;
        }

        let logsHtml = "";
        if (item.logs && item.logs.length > 0) {
          logsHtml = item.logs
            .map(
              (log) => \`
              <div class="as-plan-step-interior-line">
                <span class="as-plan-step-interior-bullet">•</span>
                <span>\${escapeHtml(log)}</span>
              </div>
            \`
            )
            .join("");
        } else if (item.status === "in-progress") {
          logsHtml = \`
            <div class="as-plan-step-interior-line" style="color: inherit; opacity: 0.85;">
              <span class="as-plan-step-interior-bullet">•</span>
              <span>Executing step action in browser...</span>
            </div>
          \`;
        } else if (item.status === "completed") {
          logsHtml = \`
            <div class="as-plan-step-interior-line">
              <span class="as-plan-step-interior-bullet">•</span>
              <span>Step completed</span>
            </div>
          \`;
        } else {
          logsHtml = \`
            <div class="as-plan-step-interior-line" style="color: #71717a;">
              <span class="as-plan-step-interior-bullet">•</span>
              <span>Waiting to execute...</span>
            </div>
          \`;
        }

        const isOpen = Boolean(item.isOpen);

        return \`
          <div class="as-inline-plan-row \${item.status} \${isOpen ? "open" : ""}" data-idx="\${idx}">
            <div class="as-inline-plan-item" data-idx="\${idx}">
              <div class="as-inline-plan-item-left">
                <div class="as-plan-status-icon">\${iconHtml}</div>
                <span class="as-inline-plan-text">\${escapeHtml(item.text)}</span>
              </div>
              <div class="as-inline-plan-chevron">\${ICONS.chevronRight}</div>
            </div>
            <div class="as-plan-step-interior" style="display: \${isOpen ? "block" : "none"};">
              \${logsHtml}
            </div>
          </div>
        \`;
      })
      .join("");

    card.innerHTML = \`
      <div class="as-inline-plan-summary">\${escapeHtml(summaryText)}</div>
      <div class="as-inline-plan-header">
        <span class="as-inline-plan-title">Execution Plan</span>
        <span class="as-inline-plan-pct">\${pct}%</span>
      </div>
      <div class="as-inline-plan-list">
        \${itemsHtml}
      </div>
    \`;

    // Click handler to toggle interior dropdown section for each step
    card.querySelectorAll(".as-inline-plan-item").forEach((itemEl) => {
      itemEl.addEventListener("click", (e) => {
        e.stopPropagation();
        const idx = parseInt(itemEl.getAttribute("data-idx"), 10);
        if (planItems[idx]) {
          const willOpen = !planItems[idx].isOpen;
          planItems.forEach((p, i) => {
            p.isOpen = i === idx ? willOpen : false;
          });
          renderInlinePlanCard();
        }
      });
    });

    contentEl.scrollTop = contentEl.scrollHeight;
    requestAnimationFrame(() => {
      contentEl.scrollTop = contentEl.scrollHeight;
    });
  }

  function updatePlan(data) {
    let parsed = null;
    if (typeof data === "string" && data.trim().startsWith("{")) {
      try {
        parsed = JSON.parse(data);
      } catch { }
    } else if (typeof data === "object" && data !== null) {
      parsed = data;
    }

    if (parsed && Array.isArray(parsed.plan)) {
      if (parsed.stepIndex === 1) {
        planItems = [];
        currentInlinePlanCard = null;
      }
      const incomingPlan = parsed.plan;
      const activeIdx = typeof parsed.stepIndex === "number" ? parsed.stepIndex - 1 : 0;

      incomingPlan.forEach((stepStr, idx) => {
        const cleanText = stepStr.replace(/^\\d+[\\.\\)]\\s*/, "").trim();
        let existing = planItems[idx];
        if (!existing) {
          let status = "pending";
          if (idx < activeIdx) status = "completed";
          else if (idx === activeIdx) status = "in-progress";

          planItems.push({
            id: idx + 1,
            text: cleanText,
            status,
            logs: [],
            isOpen: idx === activeIdx,
          });
        } else {
          existing.text = cleanText;
          if (idx < activeIdx) {
            existing.status = "completed";
            existing.isOpen = false;
          } else if (idx === activeIdx) {
            if (existing.status !== "completed") {
              existing.status = "in-progress";
            }
            existing.isOpen = true;
          } else {
            existing.status = "pending";
            existing.isOpen = false;
          }
        }
      });

      planItems.forEach((item, idx) => {
        if (idx === activeIdx && item.status !== "completed") {
          item.status = "in-progress";
          item.isOpen = true;
        } else if (idx !== activeIdx) {
          item.isOpen = false;
        }
      });

      renderInlinePlanCard();
      return;
    }

    // String format handling
    const str = String(data || "").trim();
    if (!str) return;

    const clean = str.replace(/^[📋\\s*]+/, "").trim();
    const match = clean.match(/^Step\\s+(\\d+)\\s*[:\\-]\\s*(.*)$/i);

    if (match) {
      const stepIdx = parseInt(match[1], 10);
      const desc = match[2].trim();

      planItems.forEach((item) => {
        if (item.id < stepIdx) {
          item.status = "completed";
          item.isOpen = false;
        }
      });

      let existing = planItems.find((item) => item.id === stepIdx);
      if (existing) {
        existing.text = desc;
        existing.status = "in-progress";
        existing.isOpen = true;
      } else {
        planItems.push({
          id: stepIdx,
          text: desc,
          status: "in-progress",
          logs: [],
          isOpen: true,
        });
      }
    } else {
      const currentActive = planItems.find((item) => item.status === "in-progress");
      if (currentActive) {
        currentActive.status = "completed";
        currentActive.isOpen = false;
      }
      planItems.push({
        id: planItems.length + 1,
        text: clean,
        status: "in-progress",
        logs: [],
        isOpen: true,
      });
    }

    planItems.forEach((item) => {
      if (item.status !== "in-progress") {
        item.isOpen = false;
      }
    });

    renderInlinePlanCard();
  }

  function recordStepAction(actionDesc) {
    const parsed = typeof parseActionPayload === "function" ? parseActionPayload(actionDesc) : null;
    const cleanAction = parsed ? parsed.title : stripStartSymbols(actionDesc);
    let activeItem = planItems.find((item) => item.status === "in-progress");
    if (!activeItem) {
      activeItem = planItems.find((item) => item.status === "pending");
      if (activeItem) {
        activeItem.status = "in-progress";
      }
    }

    if (activeItem) {
      if (!activeItem.logs) activeItem.logs = [];
      activeItem.logs.push(cleanAction);
      activeItem.status = "completed";
      activeItem.isOpen = false;

      // Advance to next pending step and open it exclusively
      const nextPending = planItems.find((item) => item.status === "pending");
      if (nextPending) {
        nextPending.status = "in-progress";
        nextPending.isOpen = true;
      }
    } else if (planItems.length > 0) {
      const last = planItems[planItems.length - 1];
      if (!last.logs) last.logs = [];
      last.logs.push(cleanAction);
    }

    // Ensure strictly only the in-progress step is open
    planItems.forEach((item) => {
      if (item.status !== "in-progress") {
        item.isOpen = false;
      }
    });

    renderInlinePlanCard();
  }

  function completeAllPlanSteps() {
    planItems.forEach((item) => {
      item.status = "completed";
      item.isOpen = false;
    });
    renderInlinePlanCard();
  }
  `;
}
