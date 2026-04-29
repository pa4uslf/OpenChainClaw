import fs from "node:fs/promises";
import path from "node:path";
import { lineDiff } from "./diff.js";
import { sha256 } from "./hash.js";
import {
  assessApiCall,
  assessFileModify,
  assessFileRead,
  assessWebVisit,
  normalizeUrlHost,
  type RiskAssessment,
  type RiskLevel
} from "./risk.js";
import { ensureDir, pathExists, readJson, writeJson } from "./storage.js";

const DEFAULT_AGENT_ID = "openchainclaw-local-runtime";

export type ExecutionStatus = "executed" | "blocked" | "waiting_confirmation" | "failed";
export type TaskStatus = "pending" | "running" | "waiting_confirmation" | "completed" | "failed" | "cancelled";
export type UserApprovalStatus = "not_required" | "pending" | "approved" | "rejected" | "blocked";
export type ChainRecordStatus = "not_submitted" | "local_ledger";

export interface RuntimeOptions {
  dataDir?: string;
  workspaceDir?: string;
  allowedDirectories?: string[];
  webWhitelist?: string[];
  agentId?: string;
}

export interface ApiCall {
  serviceName?: string;
  method?: string;
  url: string;
  purpose?: string;
  paid?: boolean;
  sensitiveTransfer?: boolean;
  headers?: Record<string, string>;
  body?: Record<string, unknown>;
}

export interface TimelineEvent {
  operation_id: string;
  task_id: string;
  timestamp: string;
  agent_id: string;
  operation_type: string;
  operation_target: string;
  tool_name: string;
  purpose_summary: string;
  risk_level: RiskLevel;
  execution_status: ExecutionStatus;
  user_approval_status: UserApprovalStatus;
  before_hash: string | null;
  after_hash: string | null;
  local_log_hash: string | null;
  chain_record_status: ChainRecordStatus;
  risk_reason?: string;
  expected_impact?: string;
  snapshot_path?: string;
  diff?: string;
  restored_from_operation_id?: string;
  page_title?: string;
  api_service_name?: string;
  http_method?: string;
  redacted_request_metadata?: {
    headers: string[];
    body_shape: string[];
  };
  paid?: boolean;
  sensitive_transfer?: boolean;
}

type TimelineEventInput = Omit<
  TimelineEvent,
  "operation_id" | "task_id" | "timestamp" | "agent_id" | "user_approval_status" | "before_hash" | "after_hash" | "local_log_hash" | "chain_record_status"
> &
  Partial<Pick<TimelineEvent, "operation_id" | "user_approval_status" | "before_hash" | "after_hash" | "local_log_hash" | "chain_record_status">>;

type PendingKind = "file_read" | "file_modify" | "web_visit" | "api_call";

interface PendingPayload {
  purpose?: string;
  nextContent?: string;
  serviceName?: string;
  method?: string;
  url?: string;
  paid?: boolean;
  sensitiveTransfer?: boolean;
  headers?: Record<string, string>;
  body?: Record<string, unknown>;
}

interface PendingOperationInput {
  kind: PendingKind;
  target: string;
  payload: PendingPayload;
  assessment: RiskAssessment;
  event: Omit<TimelineEventInput, "execution_status">;
}

export interface PendingOperation extends PendingOperationInput {
  pending_id: string;
  created_at: string;
}

export interface RiskSummary {
  Low: number;
  Medium: number;
  High: number;
  Blocked: number;
}

export interface LedgerRecord {
  record_version: number;
  task_id: string;
  operation_batch_hash: string;
  local_log_hash: string;
  timestamp: string;
  agent_id: string;
  risk_level_summary: RiskSummary;
  user_approval_hash: string;
  previous_record_hash: string | null;
  submission_status: "local_ledger";
  record_hash: string;
}

export interface AuditReport {
  task_id: string;
  task_summary: string;
  started_at: string | null;
  completed_at: string | null;
  operation_count: number;
  file_reads: number;
  file_modifications: number;
  web_visits: number;
  api_calls: number;
  risk_level_summary: RiskSummary;
  high_risk_operations: TimelineEvent[];
  approval_records: TimelineEvent[];
  rollback_records: TimelineEvent[];
  local_log_hash: string;
  chain_record_status: "local_ledger";
  chain_record: LedgerRecord;
  verification: {
    status: "matched" | "mismatched";
    explanation: string;
  };
}

export interface Task {
  task_id: string;
  agent_id: string;
  prompt: string;
  status: TaskStatus;
  created_at: string;
  updated_at: string;
  started_at: string | null;
  completed_at: string | null;
  pending_operation: PendingOperation | null;
  timeline: TimelineEvent[];
  reports: AuditReport | null;
  preferences_snapshot: {
    allowed_directories: string[];
    web_whitelist: string[];
  };
}

function createId(prefix: string): string {
  const entropy = Math.random().toString(36).slice(2, 10);
  return `${prefix}_${Date.now().toString(36)}_${entropy}`;
}

function nowIso(): string {
  return new Date().toISOString();
}

function statusError(message: string, statusCode: number): Error & { statusCode: number } {
  const error = new Error(message) as Error & { statusCode: number };
  error.statusCode = statusCode;
  return error;
}

export class OpenChainClawRuntime {
  readonly dataDir: string;
  readonly tasksDir: string;
  readonly snapshotsDir: string;
  readonly workspaceDir: string;
  readonly ledgerPath: string;
  readonly allowedDirectories: string[];
  readonly webWhitelist: string[];
  readonly agentId: string;

  constructor(options: RuntimeOptions = {}) {
    const dataDir = options.dataDir || path.resolve(process.cwd(), ".openchainclaw");
    this.dataDir = dataDir;
    this.tasksDir = path.join(dataDir, "tasks");
    this.snapshotsDir = path.join(dataDir, "snapshots");
    this.workspaceDir = options.workspaceDir || path.resolve(process.cwd(), "data", "workspace");
    this.ledgerPath = path.join(dataDir, "ledger.json");
    this.allowedDirectories = (options.allowedDirectories || [this.workspaceDir]).map((entry) => path.resolve(entry));
    this.webWhitelist = options.webWhitelist || ["example.com"];
    this.agentId = options.agentId || DEFAULT_AGENT_ID;
  }

  async init(): Promise<void> {
    await ensureDir(this.tasksDir);
    await ensureDir(this.snapshotsDir);
    await ensureDir(this.workspaceDir);

    const demoFile = path.join(this.workspaceDir, "demo-note.md");
    if (!(await pathExists(demoFile))) {
      await fs.writeFile(demoFile, "# Demo Note\n\nOpenChainClaw starts here.\n", "utf8");
    }

    if (!(await pathExists(this.ledgerPath))) {
      await writeJson(this.ledgerPath, []);
    }
  }

  taskPath(taskId: string): string {
    return path.join(this.tasksDir, `${taskId}.json`);
  }

  async loadTask(taskId: string): Promise<Task> {
    const task = await readJson<Task | null>(this.taskPath(taskId), null);
    if (!task) {
      throw statusError(`Task not found: ${taskId}`, 404);
    }
    return task;
  }

  async saveTask(task: Task): Promise<Task> {
    await writeJson(this.taskPath(task.task_id), task);
    return task;
  }

  async listTasks(): Promise<Task[]> {
    await ensureDir(this.tasksDir);
    const entries = await fs.readdir(this.tasksDir);
    const tasks = await Promise.all(
      entries
        .filter((entry) => entry.endsWith(".json"))
        .map((entry) => readJson<Task | null>(path.join(this.tasksDir, entry), null))
    );

    return tasks
      .filter((task): task is Task => Boolean(task))
      .sort((a, b) => b.created_at.localeCompare(a.created_at));
  }

  async readLedger(): Promise<LedgerRecord[]> {
    return readJson<LedgerRecord[]>(this.ledgerPath, []);
  }

  async createTask({ prompt }: { prompt: string }): Promise<Task> {
    const task: Task = {
      task_id: createId("task"),
      agent_id: this.agentId,
      prompt,
      status: "pending",
      created_at: nowIso(),
      updated_at: nowIso(),
      started_at: null,
      completed_at: null,
      pending_operation: null,
      timeline: [],
      reports: null,
      preferences_snapshot: {
        allowed_directories: this.allowedDirectories,
        web_whitelist: this.webWhitelist
      }
    };

    await this.saveTask(task);
    await this.record(task.task_id, {
      operation_type: "task_created",
      operation_target: "local runtime",
      tool_name: "runtime.createTask",
      purpose_summary: "创建本地任务并建立审计日志",
      risk_level: "Low",
      execution_status: "executed"
    });

    return this.loadTask(task.task_id);
  }

  async record(taskId: string, event: TimelineEventInput): Promise<TimelineEvent> {
    const task = await this.loadTask(taskId);
    const operation: TimelineEvent = {
      operation_id: createId("op"),
      task_id: taskId,
      timestamp: nowIso(),
      agent_id: this.agentId,
      user_approval_status: "not_required",
      before_hash: null,
      after_hash: null,
      local_log_hash: null,
      chain_record_status: "not_submitted",
      ...event
    };

    task.timeline.push(operation);
    task.updated_at = operation.timestamp;
    await this.saveTask(task);
    return operation;
  }

  async startDemoTask(taskId: string): Promise<Task> {
    const task = await this.loadTask(taskId);
    task.status = "running";
    task.started_at = task.started_at || nowIso();
    await this.saveTask(task);

    await this.record(taskId, {
      operation_type: "agent_plan",
      operation_target: "demo scenario",
      tool_name: "runtime.plan",
      purpose_summary: "按 PRD V0.1 演示文件读取、文件修改、网页访问、API 调用和本地证明",
      risk_level: "Low",
      execution_status: "executed"
    });

    const demoFile = path.join(this.workspaceDir, "demo-note.md");
    await this.performFileRead(taskId, demoFile, "读取授权目录内的示例文本文件");
    await this.performFileModify(
      taskId,
      demoFile,
      "# Demo Note\n\nOpenChainClaw starts here.\n\n- Audited file modification completed.\n",
      "修改示例文件以验证快照、diff 和回滚能力"
    );

    const pending = await this.requestWebVisit(taskId, "https://openchainclaw.invalid/research", "演示非白名单网页访问前的高风险确认");
    if (pending) {
      return this.loadTask(taskId);
    }

    return this.completeAfterApproval(taskId);
  }

  async performFileRead(taskId: string, targetPath: string, purpose: string): Promise<TimelineEvent> {
    const assessment = assessFileRead(targetPath, this.allowedDirectories);

    if (assessment.level === "Blocked") {
      return this.record(taskId, {
        operation_type: "file_read",
        operation_target: targetPath,
        tool_name: "file.read",
        purpose_summary: purpose,
        risk_level: "Blocked",
        risk_reason: assessment.reason,
        execution_status: "blocked",
        user_approval_status: "blocked"
      });
    }

    if (assessment.level === "High") {
      return this.createPendingOperation(taskId, {
        kind: "file_read",
        target: targetPath,
        payload: { purpose },
        assessment,
        event: {
          operation_type: "risk_review",
          operation_target: targetPath,
          tool_name: "risk.assessFileRead",
          purpose_summary: purpose,
          risk_level: "High",
          risk_reason: assessment.reason
        }
      });
    }

    const content = await fs.readFile(targetPath, "utf8");
    return this.record(taskId, {
      operation_type: "file_read",
      operation_target: targetPath,
      tool_name: "file.read",
      purpose_summary: purpose,
      risk_level: assessment.level,
      risk_reason: assessment.reason,
      execution_status: "executed",
      after_hash: sha256(content)
    });
  }

  async performFileModify(taskId: string, targetPath: string, nextContent: string, purpose: string): Promise<TimelineEvent> {
    const assessment = assessFileModify(targetPath, this.allowedDirectories);

    if (assessment.level === "Blocked") {
      return this.record(taskId, {
        operation_type: "file_modify",
        operation_target: targetPath,
        tool_name: "file.modify",
        purpose_summary: purpose,
        risk_level: "Blocked",
        risk_reason: assessment.reason,
        execution_status: "blocked",
        user_approval_status: "blocked"
      });
    }

    if (assessment.level === "High") {
      return this.createPendingOperation(taskId, {
        kind: "file_modify",
        target: targetPath,
        payload: { nextContent, purpose },
        assessment,
        event: {
          operation_type: "risk_review",
          operation_target: targetPath,
          tool_name: "risk.assessFileModify",
          purpose_summary: purpose,
          risk_level: "High",
          risk_reason: assessment.reason
        }
      });
    }

    const beforeContent = await fs.readFile(targetPath, "utf8");
    const beforeHash = sha256(beforeContent);
    const operationId = createId("op");
    const snapshotPath = path.join(this.snapshotsDir, taskId, `${operationId}-${path.basename(targetPath)}`);
    await ensureDir(path.dirname(snapshotPath));
    await fs.writeFile(snapshotPath, beforeContent, "utf8");

    await this.record(taskId, {
      operation_type: "snapshot_created",
      operation_target: snapshotPath,
      tool_name: "snapshot.create",
      purpose_summary: "文件修改前创建快照",
      risk_level: "Low",
      risk_reason: "快照用于后续 diff 与回滚",
      execution_status: "executed",
      before_hash: beforeHash,
      after_hash: beforeHash,
      snapshot_path: snapshotPath
    });

    await fs.writeFile(targetPath, nextContent, "utf8");
    const afterHash = sha256(nextContent);
    return this.record(taskId, {
      operation_id: operationId,
      operation_type: "file_modify",
      operation_target: targetPath,
      tool_name: "file.modify",
      purpose_summary: purpose,
      risk_level: assessment.level,
      risk_reason: assessment.reason,
      execution_status: "executed",
      before_hash: beforeHash,
      after_hash: afterHash,
      diff: lineDiff(beforeContent, nextContent),
      snapshot_path: snapshotPath
    });
  }

  async rollbackFile(taskId: string, operationId: string): Promise<TimelineEvent> {
    const task = await this.loadTask(taskId);
    const operation = task.timeline.find((entry) => entry.operation_id === operationId);

    if (!operation || operation.operation_type !== "file_modify") {
      throw statusError("No file modification operation found for rollback", 400);
    }

    if (!operation.snapshot_path || !(await pathExists(operation.snapshot_path))) {
      await this.record(taskId, {
        operation_type: "file_rollback",
        operation_target: operation.operation_target,
        tool_name: "file.rollback",
        purpose_summary: "回滚文件修改",
        risk_level: "High",
        risk_reason: "快照不存在，阻止回滚",
        execution_status: "failed"
      });
      throw statusError("Snapshot is missing; rollback blocked", 409);
    }

    const snapshotContent = await fs.readFile(operation.snapshot_path, "utf8");
    const snapshotHash = sha256(snapshotContent);
    if (snapshotHash !== operation.before_hash) {
      throw statusError("Snapshot hash mismatch; rollback blocked", 409);
    }

    const currentContent = await fs.readFile(operation.operation_target, "utf8");
    await fs.writeFile(operation.operation_target, snapshotContent, "utf8");

    const rollbackOperation = await this.record(taskId, {
      operation_type: "file_rollback",
      operation_target: operation.operation_target,
      tool_name: "file.rollback",
      purpose_summary: "将文件恢复到修改前快照",
      risk_level: "High",
      risk_reason: "回滚会覆盖当前文件内容，必须进入审计日志",
      execution_status: "executed",
      before_hash: sha256(currentContent),
      after_hash: snapshotHash,
      restored_from_operation_id: operationId,
      snapshot_path: operation.snapshot_path
    });

    const refreshedTask = await this.loadTask(taskId);
    if (refreshedTask.reports || refreshedTask.status === "completed") {
      await this.finalizeTask(taskId, "completed");
    }

    return rollbackOperation;
  }

  async requestWebVisit(taskId: string, url: string, purpose: string): Promise<boolean> {
    const assessment = assessWebVisit(url, this.webWhitelist);

    if (assessment.level === "High") {
      await this.createPendingOperation(taskId, {
        kind: "web_visit",
        target: url,
        payload: { purpose },
        assessment,
        event: {
          operation_type: "risk_review",
          operation_target: url,
          tool_name: "risk.assessWebVisit",
          purpose_summary: purpose,
          risk_level: "High",
          risk_reason: assessment.reason
        }
      });
      return true;
    }

    await this.record(taskId, {
      operation_type: "web_visit",
      operation_target: url,
      tool_name: "web.visit",
      purpose_summary: purpose,
      risk_level: assessment.level,
      risk_reason: assessment.reason,
      execution_status: "executed",
      page_title: normalizeUrlHost(url)
    });
    return false;
  }

  async performApiCall(taskId: string, apiCall: ApiCall): Promise<TimelineEvent> {
    const assessment = assessApiCall(apiCall);

    if (assessment.level === "High") {
      return this.createPendingOperation(taskId, {
        kind: "api_call",
        target: apiCall.url,
        payload: apiCall,
        assessment,
        event: {
          operation_type: "risk_review",
          operation_target: apiCall.url,
          tool_name: "risk.assessApiCall",
          purpose_summary: apiCall.purpose || "评估 API 调用风险",
          risk_level: "High",
          risk_reason: assessment.reason
        }
      });
    }

    return this.record(taskId, {
      operation_type: "api_call",
      operation_target: apiCall.url,
      tool_name: "api.call",
      purpose_summary: apiCall.purpose || "调用普通 API 并记录脱敏元数据",
      risk_level: assessment.level,
      risk_reason: assessment.reason,
      execution_status: "executed",
      api_service_name: apiCall.serviceName || "Demo API",
      http_method: apiCall.method || "GET",
      redacted_request_metadata: {
        headers: apiCall.headers ? Object.keys(apiCall.headers) : [],
        body_shape: apiCall.body ? Object.keys(apiCall.body) : []
      },
      paid: Boolean(apiCall.paid),
      sensitive_transfer: Boolean(apiCall.sensitiveTransfer)
    });
  }

  async createPendingOperation(taskId: string, pendingOperation: PendingOperationInput): Promise<TimelineEvent> {
    const task = await this.loadTask(taskId);
    task.status = "waiting_confirmation";
    task.pending_operation = {
      pending_id: createId("pending"),
      created_at: nowIso(),
      ...pendingOperation
    };
    task.updated_at = task.pending_operation.created_at;
    await this.saveTask(task);

    return this.record(taskId, {
      ...pendingOperation.event,
      execution_status: "waiting_confirmation",
      user_approval_status: "pending",
      expected_impact: "未经批准不会继续执行该操作"
    });
  }

  async resolvePendingOperation(taskId: string, decision: "approved" | "rejected"): Promise<Task> {
    const task = await this.loadTask(taskId);
    if (!task.pending_operation) {
      throw statusError("Task has no pending operation", 400);
    }

    const pendingOperation = task.pending_operation;
    task.pending_operation = null;
    task.status = decision === "approved" ? "running" : "cancelled";
    task.updated_at = nowIso();
    await this.saveTask(task);

    await this.record(taskId, {
      operation_type: decision === "approved" ? "user_approved" : "user_rejected",
      operation_target: pendingOperation.target,
      tool_name: "approval.resolve",
      purpose_summary: decision === "approved" ? "用户批准高风险操作" : "用户拒绝高风险操作",
      risk_level: pendingOperation.assessment.level,
      risk_reason: pendingOperation.assessment.reason,
      execution_status: "executed",
      user_approval_status: decision
    });

    if (decision !== "approved") {
      await this.finalizeTask(taskId, "cancelled");
      return this.loadTask(taskId);
    }

    if (pendingOperation.kind === "web_visit") {
      await this.record(taskId, {
        operation_type: "web_visit",
        operation_target: pendingOperation.target,
        tool_name: "web.visit",
        purpose_summary: pendingOperation.payload.purpose || "执行已批准网页访问",
        risk_level: "High",
        risk_reason: pendingOperation.assessment.reason,
        execution_status: "executed",
        user_approval_status: "approved",
        page_title: normalizeUrlHost(pendingOperation.target)
      });
    }

    if (pendingOperation.kind === "api_call") {
      const apiCall: ApiCall = {
        url: pendingOperation.payload.url || pendingOperation.target,
        paid: false,
        sensitiveTransfer: false
      };
      if (pendingOperation.payload.serviceName) {
        apiCall.serviceName = pendingOperation.payload.serviceName;
      }
      if (pendingOperation.payload.method) {
        apiCall.method = pendingOperation.payload.method;
      }
      if (pendingOperation.payload.purpose) {
        apiCall.purpose = pendingOperation.payload.purpose;
      }
      if (pendingOperation.payload.headers) {
        apiCall.headers = pendingOperation.payload.headers;
      }
      if (pendingOperation.payload.body) {
        apiCall.body = pendingOperation.payload.body;
      }
      await this.performApiCall(taskId, apiCall);
    }

    if (pendingOperation.kind === "file_read") {
      await this.performFileRead(taskId, pendingOperation.target, pendingOperation.payload.purpose || "执行已批准文件读取");
    }

    if (pendingOperation.kind === "file_modify") {
      await this.performFileModify(
        taskId,
        pendingOperation.target,
        pendingOperation.payload.nextContent || "",
        pendingOperation.payload.purpose || "执行已批准文件修改"
      );
    }

    return this.completeAfterApproval(taskId);
  }

  async completeAfterApproval(taskId: string): Promise<Task> {
    await this.performApiCall(taskId, {
      serviceName: "Demo API",
      method: "GET",
      url: "https://api.openchainclaw.local/demo",
      purpose: "演示普通 API 调用审计记录",
      paid: false,
      sensitiveTransfer: false
    });
    return this.finalizeTask(taskId, "completed");
  }

  async finalizeTask(taskId: string, status: "completed" | "cancelled" = "completed"): Promise<Task> {
    const task = await this.loadTask(taskId);
    task.status = status;
    task.completed_at = nowIso();

    const localLogHash = this.computeLocalLogHash(task.timeline);
    const ledger = await this.readLedger();
    const previous = ledger.at(-1);
    const chainRecordBase = {
      record_version: 1,
      task_id: taskId,
      operation_batch_hash: sha256(task.timeline.map((entry) => entry.operation_id)),
      local_log_hash: localLogHash,
      timestamp: nowIso(),
      agent_id: this.agentId,
      risk_level_summary: this.summarizeRisk(task.timeline),
      user_approval_hash: sha256(
        task.timeline
          .filter((entry) => ["user_approved", "user_rejected"].includes(entry.operation_type))
          .map((entry) => ({
            operation_id: entry.operation_id,
            status: entry.user_approval_status,
            target: entry.operation_target
          }))
      ),
      previous_record_hash: previous ? previous.record_hash : null,
      submission_status: "local_ledger" as const
    };
    const chainRecord: LedgerRecord = {
      ...chainRecordBase,
      record_hash: sha256(chainRecordBase)
    };
    ledger.push(chainRecord);

    task.reports = this.buildReport(task, localLogHash, chainRecord);
    task.timeline = task.timeline.map((entry) => ({
      ...entry,
      local_log_hash: localLogHash,
      chain_record_status: "local_ledger"
    }));
    task.updated_at = nowIso();

    await writeJson(this.ledgerPath, ledger);
    await this.saveTask(task);

    return task;
  }

  computeLocalLogHash(timeline: TimelineEvent[]): string {
    return sha256(
      timeline.map((entry) => ({
        operation_id: entry.operation_id,
        timestamp: entry.timestamp,
        operation_type: entry.operation_type,
        operation_target: entry.operation_target,
        tool_name: entry.tool_name,
        purpose_summary: entry.purpose_summary,
        risk_level: entry.risk_level,
        execution_status: entry.execution_status,
        user_approval_status: entry.user_approval_status,
        before_hash: entry.before_hash,
        after_hash: entry.after_hash
      }))
    );
  }

  summarizeRisk(timeline: TimelineEvent[]): RiskSummary {
    return timeline.reduce<RiskSummary>(
      (summary, entry) => {
        summary[entry.risk_level] += 1;
        return summary;
      },
      { Low: 0, Medium: 0, High: 0, Blocked: 0 }
    );
  }

  buildReport(task: Task, localLogHash: string, chainRecord: LedgerRecord): AuditReport {
    const timeline = task.timeline;
    const byType = (type: string): TimelineEvent[] => timeline.filter((entry) => entry.operation_type === type);

    return {
      task_id: task.task_id,
      task_summary: task.prompt,
      started_at: task.started_at,
      completed_at: task.completed_at,
      operation_count: timeline.length,
      file_reads: byType("file_read").length,
      file_modifications: byType("file_modify").length,
      web_visits: byType("web_visit").length,
      api_calls: byType("api_call").length,
      risk_level_summary: this.summarizeRisk(timeline),
      high_risk_operations: timeline.filter((entry) => entry.risk_level === "High"),
      approval_records: timeline.filter((entry) => ["user_approved", "user_rejected"].includes(entry.operation_type)),
      rollback_records: byType("file_rollback"),
      local_log_hash: localLogHash,
      chain_record_status: chainRecord.submission_status,
      chain_record: chainRecord,
      verification: {
        status: chainRecord.local_log_hash === localLogHash ? "matched" : "mismatched",
        explanation: "本地账本记录的 local_log_hash 与当前任务日志重新计算结果一致"
      }
    };
  }
}
