const http = require("node:http");
const fs = require("node:fs/promises");
const path = require("node:path");
const { OpenChainClawRuntime } = require("./runtime");

const PORT = Number(process.env.PORT || 4173);
const HOST = process.env.HOST || "127.0.0.1";
const PUBLIC_DIR = path.resolve(__dirname, "..", "public");

const runtimeOptions = {
  dataDir: process.env.OPENCHAINCLAW_DATA_DIR,
  workspaceDir: process.env.OPENCHAINCLAW_WORKSPACE_DIR
};

if (process.env.OPENCHAINCLAW_ALLOWED_DIRS) {
  runtimeOptions.allowedDirectories = process.env.OPENCHAINCLAW_ALLOWED_DIRS
    .split(path.delimiter)
    .filter(Boolean);
}

const runtime = new OpenChainClawRuntime(runtimeOptions);

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml"
};

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store"
  });
  response.end(JSON.stringify(payload));
}

function sendError(response, error) {
  const statusCode = error.statusCode || 500;
  sendJson(response, statusCode, {
    error: error.message || "Internal server error"
  });
}

async function readRequestBody(request) {
  const chunks = [];
  for await (const chunk of request) {
    chunks.push(chunk);
  }

  if (chunks.length === 0) {
    return {};
  }

  const raw = Buffer.concat(chunks).toString("utf8");
  return raw ? JSON.parse(raw) : {};
}

async function serveStatic(request, response) {
  const url = new URL(request.url, `http://${request.headers.host}`);
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
    if (error.code === "ENOENT") {
      response.writeHead(404);
      response.end("Not found");
      return;
    }
    throw error;
  }
}

async function handleApi(request, response) {
  const url = new URL(request.url, `http://${request.headers.host}`);
  const segments = url.pathname.split("/").filter(Boolean);

  if (request.method === "GET" && url.pathname === "/api/state") {
    const [tasks, ledger] = await Promise.all([runtime.listTasks(), runtime.readLedger()]);
    sendJson(response, 200, {
      tasks,
      ledger,
      preferences: {
        allowed_directories: runtime.allowedDirectories,
        web_whitelist: runtime.webWhitelist,
        workspace_dir: runtime.workspaceDir
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
    const startedTask = await runtime.startDemoTask(task.task_id);
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
      sendJson(response, 200, { task: await runtime.resolvePendingOperation(taskId, decision) });
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
      sendJson(response, 200, { task: await runtime.loadTask(taskId) });
      return;
    }
  }

  sendJson(response, 404, { error: "API route not found" });
}

async function handleRequest(request, response) {
  try {
    if (request.url.startsWith("/api/")) {
      await handleApi(request, response);
      return;
    }

    await serveStatic(request, response);
  } catch (error) {
    sendError(response, error);
  }
}

async function main() {
  await runtime.init();
  const server = http.createServer(handleRequest);
  server.listen(PORT, HOST, () => {
    console.log(`OpenChainClaw local console: http://${HOST}:${PORT}`);
  });
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}

module.exports = {
  handleRequest,
  runtime
};
