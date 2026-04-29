import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { OpenChainClawRuntime } from "../src/runtime.js";

async function createRuntime(): Promise<{
  root: string;
  workspace: string;
  runtime: OpenChainClawRuntime;
}> {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "openchainclaw-"));
  const workspace = path.join(root, "workspace");
  const runtime = new OpenChainClawRuntime({
    dataDir: path.join(root, "data"),
    workspaceDir: workspace,
    allowedDirectories: [workspace],
    webWhitelist: ["example.com"]
  });
  await runtime.init();
  return { root, workspace, runtime };
}

test("blocked file read is recorded and never executed", async () => {
  const { workspace, runtime } = await createRuntime();
  const hiddenFile = path.join(workspace, ".env");
  await fs.writeFile(hiddenFile, "TOKEN=secret", "utf8");

  const task = await runtime.createTask({ prompt: "try hidden file" });
  const operation = await runtime.performFileRead(task.task_id, hiddenFile, "读取隐藏配置文件");

  assert.equal(operation.risk_level, "Blocked");
  assert.equal(operation.execution_status, "blocked");
  assert.equal(operation.user_approval_status, "blocked");
});

test("high-risk web visit waits for approval before execution", async () => {
  const { runtime } = await createRuntime();
  const task = await runtime.createTask({ prompt: "browse non whitelist site" });

  const isPending = await runtime.requestWebVisit(
    task.task_id,
    "https://not-approved.example/research",
    "访问非白名单网站"
  );
  const waitingTask = await runtime.loadTask(task.task_id);

  assert.equal(isPending, true);
  assert.equal(waitingTask.status, "waiting_confirmation");
  assert.equal(waitingTask.pending_operation?.kind, "web_visit");
  assert.equal(waitingTask.timeline.at(-1)?.execution_status, "waiting_confirmation");

  const completed = await runtime.resolvePendingOperation(task.task_id, "approved");

  assert.equal(completed.status, "completed");
  assert.ok(completed.timeline.some((entry) => entry.operation_type === "web_visit" && entry.execution_status === "executed"));
});

test("file modification creates snapshot, diff, and rollback restores original content", async () => {
  const { workspace, runtime } = await createRuntime();
  const target = path.join(workspace, "note.md");
  await fs.writeFile(target, "alpha\n", "utf8");

  const task = await runtime.createTask({ prompt: "modify file" });
  const operation = await runtime.performFileModify(task.task_id, target, "alpha\nbeta\n", "追加一行文本");

  assert.equal(operation.risk_level, "Medium");
  assert.match(operation.diff || "", /\+beta/);
  assert.ok(operation.snapshot_path);

  await runtime.rollbackFile(task.task_id, operation.operation_id);
  const restored = await fs.readFile(target, "utf8");

  assert.equal(restored, "alpha\n");
});

test("finalized task creates matching local log hash and local ledger record", async () => {
  const { runtime } = await createRuntime();
  const task = await runtime.createTask({ prompt: "demo task" });
  await runtime.startDemoTask(task.task_id);
  const completed = await runtime.resolvePendingOperation(task.task_id, "approved");
  const ledger = await runtime.readLedger();
  const record = ledger.find((entry) => entry.task_id === task.task_id);

  assert.equal(completed.status, "completed");
  assert.ok(completed.reports?.local_log_hash);
  assert.equal(completed.reports?.verification.status, "matched");
  assert.equal(record?.local_log_hash, completed.reports?.local_log_hash);
  assert.equal(record?.submission_status, "local_ledger");
});

test("rollback after completion refreshes report hash and appends a ledger proof", async () => {
  const { runtime } = await createRuntime();
  const task = await runtime.createTask({ prompt: "demo task with rollback" });
  await runtime.startDemoTask(task.task_id);
  const completed = await runtime.resolvePendingOperation(task.task_id, "approved");
  const fileModify = completed.timeline.find((entry) => entry.operation_type === "file_modify");

  assert.ok(fileModify);
  await runtime.rollbackFile(task.task_id, fileModify.operation_id);

  const refreshed = await runtime.loadTask(task.task_id);
  const ledger = await runtime.readLedger();
  const taskRecords = ledger.filter((entry) => entry.task_id === task.task_id);

  assert.equal(refreshed.reports?.operation_count, refreshed.timeline.length);
  assert.equal(refreshed.reports?.rollback_records.length, 1);
  assert.equal(taskRecords.length, 2);
  assert.equal(taskRecords.at(-1)?.local_log_hash, refreshed.reports?.local_log_hash);
});
