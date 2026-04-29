import http, { type IncomingMessage, type ServerResponse } from "node:http";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createAnalytics, type Analytics } from "./analytics.js";
import { OpenChainClawRuntime, type RuntimeOptions } from "./runtime.js";

const PORT = Number(process.env.PORT || 4173);
const HOST = process.env.HOST || "127.0.0.1";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PUBLIC_DIR = path.resolve(__dirname, "..", "..", "public");

const runtimeOptions: RuntimeOptions = {};
if (process.env.OPENCHAINCLAW_DATA_DIR) {
  runtimeOptions.dataDir = process.env.OPENCHAINCLAW_DATA_DIR;
}
if (process.env.OPENCHAINCLAW_WORKSPACE_DIR) {
  runtimeOptions.workspaceDir = process.env.OPENCHAINCLAW_WORKSPACE_DIR;
}
if (process.env.OPENCHAINCLAW_ALLOWED_DIRS) {
  runtimeOptions.allowedDirectories = process.env.OPENCHAINCLAW_ALLOWED_DIRS
    .split(path.delimiter)
    .filter(Boolean);
}

export const runtime = new OpenChainClawRuntime(runtimeOptions);
export const analytics = createAnalytics();

const MIME_TYPES: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml"
};

interface ErrorWithStatus extends Error {
  statusCode?: number;
}

function sendJson(response: ServerResponse, statusCode: number, payload: unknown): void {
  response.writeHead(statusCode, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store"
  });
  response.end(JSON.stringify(payload));
}

function sendError(response: ServerResponse, error: unknown, analyticsClient: Analytics): void {
  const statusCode = error instanceof Error && "statusCode" in error
    ? (error as ErrorWithStatus).statusCode || 500
    : 500;

  if (statusCode >= 500) {
    analyticsClient.captureException(error, { status_code: statusCode });
  }

  sendJson(response, statusCode, {
    error: error instanceof Error ? error.message : "Internal server error"
  });
}

async function readRequestBody(request: IncomingMessage): Promise<Record<string, unknown>> {
  const chunks: Buffer[] = [];
  for await (const chunk of request) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  if (chunks.length === 0) {
    return {};
  }

  const raw = Buffer.concat(chunks).toString("utf8");
  const parsed = raw ? JSON.parse(raw) : {};
  return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed as Record<string, unknown> : {};
}

async function serveStatic(request: IncomingMessage, response: ServerResponse): Promise<void> {
  const url = new URL(request.url || "/", `http://${request.headers.host || HOST}`);
  const requestedPath = url.pathname === "/" ? "/index.html" : url.pathname;
  const filePath = path.resolve(PUBLIC_DIR, `.${requestedPath}`);

  if (!filePath.startsWith(PUBLIC_DIR)) {
    response.writeHead(403);
    response.end("Forbidden");
    return;
  }

  try {
    const content = await fs.readFile(filePath);
    const contentType = MIME_TYPES[path.extname(filePath)] || "application/octet-stream";
    response.writeHead(200, {
      "content-type": contentType,
      "cache-control": "no-store"
    });
    response.end(content);
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") {
      response.writeHead(404);
      response.end("Not found");
      return;
    }
    throw error;
  }
}

async function handleApi(request: IncomingMessage, response: ServerResponse, analyticsClient: Analytics = analytics): Promise<void> {
  const url = new URL(request.url || "/", `http://${request.headers.host || HOST}`);
  const segments = url.pathname.split("/").filter(Boolean);

  if (request.method === "GET" && url.pathname === "/api/state") {
    const [tasks, ledger] = await Promise.all([runtime.listTasks(), runtime.readLedger()]);
    sendJson(response, 200, {
      tasks,
      ledger,
      preferences: {
        allowed_directories: runtime.allowedDirectories,
        web_whitelist: runtime.webWhitelist,
        workspace_dir: runtime.workspaceDir,
        analytics_enabled: analyticsClient.config.enabled
      }
    });
    return;
  }

  if (request.method === "POST" && url.pathname === "/api/tasks") {
    const body = await readRequestBody(request);
    const prompt = String(body.prompt || "").trim();
    if (!prompt) {
      sendJson(response, 400, { error: "Task prompt is required" });
      return;
    }

    const task = await runtime.createTask({ prompt });
    analyticsClient.capture({
      event: "task created",
      properties: {
        task_id: task.task_id,
        prompt_length: prompt.length
      }
    });

    const startedTask = await runtime.startDemoTask(task.task_id);
    analyticsClient.capture({
      event: "task demo started",
      properties: {
        task_id: startedTask.task_id,
        status: startedTask.status,
        operation_count: startedTask.timeline.length
      }
    });

    sendJson(response, 201, { task: startedTask });
    return;
  }

  if (segments[0] === "api" && segments[1] === "tasks" && segments[2]) {
    const taskId = segments[2];

    if (request.method === "GET" && segments.length === 3) {
      sendJson(response, 200, { task: await runtime.loadTask(taskId) });
      return;
    }

    if (request.method === "POST" && segments[3] === "approval") {
      const body = await readRequestBody(request);
      const decision = body.decision === "rejected" ? "rejected" : "approved";
      const task = await runtime.resolvePendingOperation(taskId, decision);
      analyticsClient.capture({
        event: decision === "approved" ? "high risk operation approved" : "high risk operation rejected",
        properties: {
          task_id: taskId,
          status: task.status,
          operation_count: task.timeline.length
        }
      });
      sendJson(response, 200, { task });
      return;
    }

    if (request.method === "POST" && segments[3] === "rollback") {
      const body = await readRequestBody(request);
      const operationId = String(body.operation_id || "");
      if (!operationId) {
        sendJson(response, 400, { error: "operation_id is required" });
        return;
      }
      await runtime.rollbackFile(taskId, operationId);
      const task = await runtime.loadTask(taskId);
      analyticsClient.capture({
        event: "file rollback completed",
        properties: {
          task_id: taskId,
          operation_id: operationId,
          status: task.status,
          operation_count: task.timeline.length
        }
      });
      sendJson(response, 200, { task });
      return;
    }
  }

  sendJson(response, 404, { error: "API route not found" });
}

export async function handleRequest(
  request: IncomingMessage,
  response: ServerResponse,
  analyticsClient: Analytics = analytics
): Promise<void> {
  try {
    if ((request.url || "").startsWith("/api/")) {
      await handleApi(request, response, analyticsClient);
      return;
    }

    await serveStatic(request, response);
  } catch (error) {
    sendError(response, error, analyticsClient);
  }
}

async function main(): Promise<void> {
  await runtime.init();
  const server = http.createServer((request, response) => {
    void handleRequest(request, response);
  });
  server.listen(PORT, HOST, () => {
    console.log(`OpenChainClaw local console: http://${HOST}:${PORT}`);
    console.log(`PostHog analytics: ${analytics.config.enabled ? "enabled" : "disabled"}`);
  });

  const shutdown = async (): Promise<void> => {
    server.close();
    await analytics.shutdown();
  };

  process.once("SIGINT", () => {
    void shutdown().finally(() => process.exit(0));
  });
  process.once("SIGTERM", () => {
    void shutdown().finally(() => process.exit(0));
  });
}

const entrypointUrl = process.argv[1] ? pathToFileURL(process.argv[1]).href : "";

if (import.meta.url === entrypointUrl) {
  main().catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  });
}
