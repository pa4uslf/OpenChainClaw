const state = {
  tasks: [],
  ledger: [],
  preferences: {},
  selectedTaskId: null
};

const elements = {
  form: document.querySelector("#task-form"),
  input: document.querySelector("#task-input"),
  taskCount: document.querySelector("#task-count"),
  ledgerCount: document.querySelector("#ledger-count"),
  workspaceDir: document.querySelector("#workspace-dir"),
  webWhitelist: document.querySelector("#web-whitelist"),
  taskList: document.querySelector("#task-list"),
  timeline: document.querySelector("#timeline"),
  report: document.querySelector("#report"),
  selectedTaskMeta: document.querySelector("#selected-task-meta"),
  selectedTaskStatus: document.querySelector("#selected-task-status"),
  approvalBox: document.querySelector("#approval-box")
};

function formatTime(value) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  }).format(new Date(value));
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

async function api(path, options = {}) {
  const response = await fetch(path, {
    headers: {
      "content-type": "application/json",
      ...(options.headers || {})
    },
    ...options
  });
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.error || "Request failed");
  }
  return payload;
}

function getSelectedTask() {
  return state.tasks.find((task) => task.task_id === state.selectedTaskId) || state.tasks[0] || null;
}

async function loadState() {
  const payload = await api("/api/state");
  state.tasks = payload.tasks;
  state.ledger = payload.ledger;
  state.preferences = payload.preferences;

  if (!state.tasks.some((task) => task.task_id === state.selectedTaskId)) {
    state.selectedTaskId = state.tasks[0]?.task_id || null;
  }

  render();
}

function render() {
  elements.taskCount.textContent = `${state.tasks.length} tasks`;
  elements.ledgerCount.textContent = `${state.ledger.length} proofs`;
  elements.workspaceDir.textContent = state.preferences.workspace_dir || "-";
  elements.webWhitelist.textContent = (state.preferences.web_whitelist || []).join(", ") || "-";

  renderTaskList();
  renderSelectedTask();
}

function renderTaskList() {
  if (state.tasks.length === 0) {
    elements.taskList.innerHTML = '<p class="empty">暂无任务</p>';
    return;
  }

  elements.taskList.innerHTML = state.tasks
    .map((task) => `
      <button class="task-item ${task.task_id === state.selectedTaskId ? "active" : ""}" data-task-id="${escapeHtml(task.task_id)}">
        <strong class="task-title">${escapeHtml(task.prompt)}</strong>
        <span class="muted">${escapeHtml(formatTime(task.created_at))}</span>
        <span class="chip">${escapeHtml(task.status)}</span>
      </button>
    `)
    .join("");

  elements.taskList.querySelectorAll("[data-task-id]").forEach((button) => {
    button.addEventListener("click", () => {
      state.selectedTaskId = button.dataset.taskId;
      render();
    });
  });
}

function renderSelectedTask() {
  const task = getSelectedTask();
  if (!task) {
    elements.selectedTaskMeta.textContent = "暂无任务";
    elements.selectedTaskStatus.textContent = "idle";
    elements.timeline.innerHTML = "暂无时间线";
    elements.timeline.classList.add("empty");
    elements.report.innerHTML = "任务完成后生成报告";
    elements.report.classList.add("empty");
    elements.approvalBox.classList.add("hidden");
    return;
  }

  elements.selectedTaskMeta.textContent = `${task.task_id} · ${formatTime(task.created_at)}`;
  elements.selectedTaskStatus.textContent = task.status;
  renderApproval(task);
  renderTimeline(task);
  renderReport(task);
}

function renderApproval(task) {
  if (!task.pending_operation) {
    elements.approvalBox.classList.add("hidden");
    elements.approvalBox.innerHTML = "";
    return;
  }

  const pending = task.pending_operation;
  elements.approvalBox.classList.remove("hidden");
  elements.approvalBox.innerHTML = `
    <strong>等待确认：${escapeHtml(pending.kind)}</strong>
    <p>${escapeHtml(pending.assessment.reason)}</p>
    <code class="event-target">${escapeHtml(pending.target)}</code>
    <div class="approval-actions">
      <button data-approval="approved">批准</button>
      <button class="danger" data-approval="rejected">拒绝</button>
    </div>
  `;

  elements.approvalBox.querySelectorAll("[data-approval]").forEach((button) => {
    button.addEventListener("click", async () => {
      await api(`/api/tasks/${task.task_id}/approval`, {
        method: "POST",
        body: JSON.stringify({ decision: button.dataset.approval })
      });
      await loadState();
    });
  });
}

function renderTimeline(task) {
  if (!task.timeline.length) {
    elements.timeline.innerHTML = "暂无时间线";
    elements.timeline.classList.add("empty");
    return;
  }

  elements.timeline.classList.remove("empty");
  elements.timeline.innerHTML = task.timeline
    .map((event) => `
      <article class="event">
        <time class="event-time">${escapeHtml(formatTime(event.timestamp))}</time>
        <div class="event-main">
          <div class="event-title">
            <strong>${escapeHtml(event.operation_type)}</strong>
            <span class="chip ${escapeHtml(event.risk_level)}">${escapeHtml(event.risk_level)}</span>
            <span class="chip">${escapeHtml(event.execution_status)}</span>
          </div>
          <div class="muted">${escapeHtml(event.purpose_summary)}</div>
          <code class="event-target">${escapeHtml(event.operation_target)}</code>
          ${event.risk_reason ? `<div class="muted">${escapeHtml(event.risk_reason)}</div>` : ""}
          ${event.diff ? `<pre class="diff">${escapeHtml(event.diff)}</pre>` : ""}
          ${event.operation_type === "file_modify" ? `<button class="secondary" data-rollback="${escapeHtml(event.operation_id)}">回滚</button>` : ""}
        </div>
      </article>
    `)
    .join("");

  elements.timeline.querySelectorAll("[data-rollback]").forEach((button) => {
    button.addEventListener("click", async () => {
      await api(`/api/tasks/${task.task_id}/rollback`, {
        method: "POST",
        body: JSON.stringify({ operation_id: button.dataset.rollback })
      });
      await loadState();
    });
  });
}

function renderReport(task) {
  if (!task.reports) {
    elements.report.innerHTML = "任务完成后生成报告";
    elements.report.classList.add("empty");
    return;
  }

  const report = task.reports;
  elements.report.classList.remove("empty");
  elements.report.innerHTML = `
    <div class="report-grid">
      <div class="metric"><strong>${report.operation_count}</strong><span class="muted">操作总数</span></div>
      <div class="metric"><strong>${report.file_modifications}</strong><span class="muted">文件修改</span></div>
      <div class="metric"><strong>${report.high_risk_operations.length}</strong><span class="muted">高风险事件</span></div>
      <div class="metric"><strong>${escapeHtml(report.verification.status)}</strong><span class="muted">本地账本校验</span></div>
      <div>
        <span class="label">local_log_hash</span>
        <code class="hash">${escapeHtml(report.local_log_hash)}</code>
      </div>
      <div>
        <span class="label">chain_record_hash</span>
        <code class="hash">${escapeHtml(report.chain_record.record_hash)}</code>
      </div>
    </div>
  `;
}

elements.form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const prompt = elements.input.value.trim();
  if (!prompt) return;

  const payload = await api("/api/tasks", {
    method: "POST",
    body: JSON.stringify({ prompt })
  });
  state.selectedTaskId = payload.task.task_id;
  await loadState();
});

loadState().catch((error) => {
  elements.timeline.innerHTML = `<p class="empty">${escapeHtml(error.message)}</p>`;
});
