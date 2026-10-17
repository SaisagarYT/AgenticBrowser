"use strict";

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("task-form");
  const input = document.getElementById("task-input");
  const submitBtn = document.getElementById("submit-btn");
  const historyList = document.getElementById("history-list");
  const refreshHistoryBtn = document.getElementById("refresh-history-btn");
  const taskIdBadge = document.getElementById("task-id-badge");

  const badgePlanner = document.getElementById("badge-planner");
  const badgeBrowser = document.getElementById("badge-browser");
  const badgeCritique = document.getElementById("badge-critique");

  const cardPlanner = document.getElementById("card-planner");
  const cardBrowser = document.getElementById("card-browser");
  const cardCritique = document.getElementById("card-critique");

  const plannerInstruction = document.getElementById("planner-instruction");
  const planItems = document.getElementById("plan-items");
  const browserActionText = document.getElementById("browser-action-text");
  const actionDetails = document.getElementById("action-details");
  const critiqueFeedback = document.getElementById("critique-feedback");
  const critiqueVerdictTag = document.getElementById("critique-verdict-tag");

  const liveScreenshot = document.getElementById("live-screenshot");
  const screenshotPlaceholder = document.getElementById("screenshot-placeholder");
  const screenshotName = document.getElementById("screenshot-name");
  const resultText = document.getElementById("result-text");
  const copyResultBtn = document.getElementById("copy-result-btn");

  let currentEventSource = null;

  // Suggestion chips
  document.querySelectorAll(".suggestion-chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      input.value = chip.getAttribute("data-query") || "";
      input.focus();
    });
  });

  // Load past tasks from SQLite
  async function loadHistory() {
    try {
      const res = await fetch("/api/tasks?limit=10");
      if (!res.ok) return;
      const data = await res.json();
      renderHistory(data.tasks || []);
    } catch (err) {
      console.warn("Failed to fetch task history:", err);
    }
  }

  function renderHistory(tasks) {
    if (tasks.length === 0) {
      historyList.innerHTML = `<div class="empty-state">No past tasks recorded yet.</div>`;
      return;
    }

    historyList.innerHTML = tasks
      .map(
        (t) => `
      <div class="history-item" data-id="${t.id}">
        <div class="history-item-header">
          <span>${new Date(t.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
          <span class="badge ${t.status === "COMPLETED" ? "badge-pulse" : "badge-ghost"}">${t.status}</span>
        </div>
        <div class="history-item-cmd">${escapeHtml(t.command)}</div>
      </div>
    `
      )
      .join("");

    historyList.querySelectorAll(".history-item").forEach((el) => {
      el.addEventListener("click", () => viewHistoricalTask(el.getAttribute("data-id")));
    });
  }

  async function viewHistoricalTask(id) {
    try {
      const res = await fetch(`/api/tasks/${id}`);
      if (!res.ok) return;
      const data = await res.json();
      displayCompletedTask(data);
    } catch (err) {
      console.error("Failed to load historical task:", err);
    }
  }

  function displayCompletedTask(data) {
    const { task, plan, steps, actions, critiques } = data;
    taskIdBadge.textContent = `ID: ${task.id.slice(0, 8)} (${task.status})`;

    if (plan && plan.plan_text) {
      const lines = plan.plan_text.split("\n");
      planItems.innerHTML = lines.map((l) => `<li>${escapeHtml(l)}</li>`).join("");
      plannerInstruction.textContent = lines[0] || "Completed Plan";
    }

    if (actions.length > 0) {
      const lastAction = actions[actions.length - 1];
      browserActionText.textContent = `Executed ${lastAction.tool_name}`;
      actionDetails.textContent = `${lastAction.tool_name} | status: ${lastAction.status}`;
      if (lastAction.screenshot_path) {
        const parts = lastAction.screenshot_path.split(/[\\/]/);
        const filename = parts[parts.length - 1];
        setScreenshot(filename);
      }
    }

    if (critiques.length > 0) {
      const lastCritique = critiques[critiques.length - 1];
      critiqueFeedback.textContent = lastCritique.feedback;
      setVerdictTag(lastCritique.terminate ? "TASK_COMPLETED" : "SUCCESS");
    }

    if (task.final_response) {
      resultText.textContent = task.final_response;
      copyResultBtn.style.display = "inline-block";
    } else if (task.error) {
      resultText.innerHTML = `<span style="color: var(--accent-error)">Error: ${escapeHtml(task.error)}</span>`;
    }
  }

  // Submit task
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const command = input.value.trim();
    if (!command) return;

    submitBtn.disabled = true;
    submitBtn.querySelector(".btn-text").textContent = "Running...";
    resetUI();

    try {
      // Trigger execution via API
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command, async: true }),
      });

      if (!res.ok) {
        throw new Error(`Server returned status ${res.status}`);
      }

      const task = await res.json();
      taskIdBadge.textContent = `Task: ${task.id.slice(0, 8)}`;

      // Connect to Server-Sent Events stream for live telemetry
      subscribeToStream(task.id);
    } catch (err) {
      alert(`Failed to start task: ${err.message}`);
      submitBtn.disabled = false;
      submitBtn.querySelector(".btn-text").textContent = "Execute Task";
    }
  });

  function subscribeToStream(taskId) {
    if (currentEventSource) {
      currentEventSource.close();
    }

    currentEventSource = new EventSource(`/api/tasks/${taskId}/stream`);

    currentEventSource.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        handleStreamEvent(payload);
      } catch (err) {
        console.error("Stream parse error:", err);
      }
    };

    currentEventSource.onerror = () => {
      currentEventSource.close();
      submitBtn.disabled = false;
      submitBtn.querySelector(".btn-text").textContent = "Execute Task";
      loadHistory();
    };
  }

  function handleStreamEvent(data) {
    switch (data.event) {
      case "planner_thinking":
        setActiveAgent("planner");
        plannerInstruction.textContent = `Formulating strategy for Step ${data.stepIndex}...`;
        break;

      case "plan_updated":
        setActiveAgent("planner");
        plannerInstruction.textContent = data.currentInstruction;
        if (data.plan && Array.isArray(data.plan)) {
          planItems.innerHTML = data.plan
            .map((step, i) => `<li>${i + 1}. ${escapeHtml(step)}</li>`)
            .join("");
        }
        break;

      case "browser_acting":
        setActiveAgent("browser");
        browserActionText.textContent = `Executing: "${data.instruction}"`;
        actionDetails.textContent = "Selecting and executing skill...";
        break;

      case "action_completed":
        setActiveAgent("browser");
        browserActionText.textContent = `Tool executed: ${data.toolName}`;
        actionDetails.textContent = `Result: ${JSON.stringify(data.result).slice(0, 100)}...`;
        if (data.screenshot) {
          setScreenshot(data.screenshot);
        }
        break;

      case "critique_evaluating":
        setActiveAgent("critique");
        critiqueFeedback.textContent = "Analyzing DOM changes & screenshot verification...";
        break;

      case "critique_completed":
        setActiveAgent("critique");
        critiqueFeedback.textContent = data.feedback;
        setVerdictTag(data.verdict);
        if (data.finalResponse) {
          resultText.textContent = data.finalResponse;
          copyResultBtn.style.display = "inline-block";
        }
        break;

      case "task_completed":
        setActiveAgent(null);
        resultText.textContent = data.finalResponse;
        copyResultBtn.style.display = "inline-block";
        submitBtn.disabled = false;
        submitBtn.querySelector(".btn-text").textContent = "Execute Task";
        loadHistory();
        break;

      case "task_failed":
        setActiveAgent(null);
        resultText.innerHTML = `<span style="color: var(--accent-error)">Task Failed: ${escapeHtml(data.error)}</span>`;
        submitBtn.disabled = false;
        submitBtn.querySelector(".btn-text").textContent = "Execute Task";
        loadHistory();
        break;
    }
  }

  function setActiveAgent(agent) {
    [badgePlanner, badgeBrowser, badgeCritique].forEach((b) => b.classList.remove("active"));
    [cardPlanner, cardBrowser, cardCritique].forEach((c) => c.classList.remove("active-card"));

    if (agent === "planner") {
      badgePlanner.classList.add("active");
      cardPlanner.classList.add("active-card");
    } else if (agent === "browser") {
      badgeBrowser.classList.add("active");
      cardBrowser.classList.add("active-card");
    } else if (agent === "critique") {
      badgeCritique.classList.add("active");
      cardCritique.classList.add("active-card");
    }
  }

  function setVerdictTag(verdict) {
    critiqueVerdictTag.textContent = verdict;
    critiqueVerdictTag.className = "verdict-tag";
    if (verdict === "SUCCESS") critiqueVerdictTag.classList.add("verdict-success");
    else if (verdict === "REPLAN" || verdict === "FAIL_RETRY") critiqueVerdictTag.classList.add("verdict-replan");
    else critiqueVerdictTag.classList.add("verdict-completed");
  }

  function setScreenshot(filename) {
    liveScreenshot.src = `/screenshots/${filename}`;
    liveScreenshot.style.display = "block";
    screenshotPlaceholder.style.display = "none";
    screenshotName.textContent = filename;
  }

  function resetUI() {
    planItems.innerHTML = "";
    plannerInstruction.textContent = "Formulating initial plan...";
    browserActionText.textContent = "Waiting for step...";
    actionDetails.textContent = "Idle";
    critiqueFeedback.textContent = "Waiting for action...";
    critiqueVerdictTag.textContent = "-";
    critiqueVerdictTag.className = "verdict-tag";
    resultText.innerHTML = `
      <div class="dash-skeleton-wrapper">
        <div class="dash-skeleton-thought-bar">
          <div class="dash-skeleton-bar dash-skeleton-pill" style="width: 130px; height: 16px;"></div>
          <div class="dash-skeleton-bar dash-skeleton-pill" style="width: 68px; height: 16px;"></div>
        </div>
        <div class="dash-skeleton-lines">
          <div class="dash-skeleton-bar" style="width: 82%; height: 11px;"></div>
          <div class="dash-skeleton-bar" style="width: 96%; height: 11px;"></div>
          <div class="dash-skeleton-bar" style="width: 88%; height: 11px;"></div>
          <div class="dash-skeleton-bar" style="width: 94%; height: 11px;"></div>
          <div class="dash-skeleton-bar" style="width: 72%; height: 11px;"></div>
          <div class="dash-skeleton-bar" style="width: 85%; height: 11px;"></div>
          <div class="dash-skeleton-bar" style="width: 44%; height: 11px;"></div>
        </div>
        <div class="dash-skeleton-toolbar">
          <div class="dash-skeleton-bar dash-skeleton-tool-btn"></div>
          <div class="dash-skeleton-bar dash-skeleton-tool-btn"></div>
          <div class="dash-skeleton-bar dash-skeleton-tool-btn"></div>
          <div class="dash-skeleton-bar dash-skeleton-tool-btn"></div>
          <div class="dash-skeleton-divider"></div>
          <div class="dash-skeleton-bar dash-skeleton-tool-pill"></div>
        </div>
      </div>
    `;
    copyResultBtn.style.display = "none";
  }

  copyResultBtn.addEventListener("click", () => {
    navigator.clipboard.writeText(resultText.textContent);
    copyResultBtn.textContent = "Copied!";
    setTimeout(() => (copyResultBtn.textContent = "Copy"), 2000);
  });

  refreshHistoryBtn.addEventListener("click", loadHistory);

  function escapeHtml(str) {
    if (!str) return "";
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  // Initial history load
  loadHistory();
});
