const path = require("node:path");

const SENSITIVE_NAME_PATTERN = /(^|[-_.])(private|secret|token|cookie|credential|mnemonic|id_rsa|id_ed25519|wallet|seed)([-_.]|$)/i;

function normalizeUrlHost(url) {
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return "";
  }
}

function hasHiddenSegment(filePath) {
  return path
    .normalize(filePath)
    .split(path.sep)
    .some((segment) => segment.length > 1 && segment.startsWith("."));
}

function isSensitiveFile(filePath) {
  const baseName = path.basename(filePath);
  return SENSITIVE_NAME_PATTERN.test(baseName);
}

function isInsideDirectory(targetPath, directoryPath) {
  const target = path.resolve(targetPath);
  const directory = path.resolve(directoryPath);
  const relative = path.relative(directory, target);
  return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative));
}

function isAuthorizedPath(targetPath, allowedDirectories) {
  return allowedDirectories.some((directory) => isInsideDirectory(targetPath, directory));
}

function assessFileRead(targetPath, allowedDirectories) {
  if (hasHiddenSegment(targetPath)) {
    return {
      level: "Blocked",
      reason: "隐藏文件或隐藏目录默认禁止读取"
    };
  }

  if (isSensitiveFile(targetPath)) {
    return {
      level: "Blocked",
      reason: "疑似私钥、token、cookie 或敏感凭证文件默认禁止读取"
    };
  }

  if (!isAuthorizedPath(targetPath, allowedDirectories)) {
    return {
      level: "High",
      reason: "目标文件不在用户授权目录内"
    };
  }

  return {
    level: "Low",
    reason: "授权目录内普通文件读取"
  };
}

function assessFileModify(targetPath, allowedDirectories) {
  const readAssessment = assessFileRead(targetPath, allowedDirectories);

  if (readAssessment.level === "Blocked") {
    return readAssessment;
  }

  if (readAssessment.level === "High") {
    return readAssessment;
  }

  return {
    level: "Medium",
    reason: "授权目录内文件修改，需创建快照并记录 diff"
  };
}

function assessWebVisit(url, whitelist) {
  const host = normalizeUrlHost(url);
  const matched = whitelist.some((entry) => entry.toLowerCase() === host);

  if (matched) {
    return {
      level: "Low",
      reason: "目标网站在用户确认过的白名单内"
    };
  }

  return {
    level: "High",
    reason: "目标网站不在白名单内，访问前需要用户确认"
  };
}

function assessApiCall({ paid = false, sensitiveTransfer = false } = {}) {
  if (paid) {
    return {
      level: "High",
      reason: "付费 API 调用前必须请求用户确认"
    };
  }

  if (sensitiveTransfer) {
    return {
      level: "High",
      reason: "疑似敏感数据外发前必须请求用户确认"
    };
  }

  return {
    level: "Medium",
    reason: "普通 API 调用，可执行但必须记录脱敏元数据"
  };
}

module.exports = {
  assessApiCall,
  assessFileModify,
  assessFileRead,
  assessWebVisit,
  isAuthorizedPath,
  normalizeUrlHost
};
