import path from "node:path";

export type RiskLevel = "Low" | "Medium" | "High" | "Blocked";

export interface RiskAssessment {
  level: RiskLevel;
  reason: string;
}

export interface ApiCallRiskInput {
  paid?: boolean;
  sensitiveTransfer?: boolean;
}

const SENSITIVE_NAME_PATTERN = /(^|[-_.])(private|secret|token|cookie|credential|mnemonic|id_rsa|id_ed25519|wallet|seed)([-_.]|$)/i;

export function normalizeUrlHost(url: string): string {
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return "";
  }
}

function hasHiddenSegment(filePath: string): boolean {
  return path
    .normalize(filePath)
    .split(path.sep)
    .some((segment) => segment.length > 1 && segment.startsWith("."));
}

function isSensitiveFile(filePath: string): boolean {
  const baseName = path.basename(filePath);
  return SENSITIVE_NAME_PATTERN.test(baseName);
}

function isInsideDirectory(targetPath: string, directoryPath: string): boolean {
  const target = path.resolve(targetPath);
  const directory = path.resolve(directoryPath);
  const relative = path.relative(directory, target);
  return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative));
}

export function isAuthorizedPath(targetPath: string, allowedDirectories: string[]): boolean {
  return allowedDirectories.some((directory) => isInsideDirectory(targetPath, directory));
}

export function assessFileRead(targetPath: string, allowedDirectories: string[]): RiskAssessment {
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

export function assessFileModify(targetPath: string, allowedDirectories: string[]): RiskAssessment {
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

export function assessWebVisit(url: string, whitelist: string[]): RiskAssessment {
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

export function assessApiCall({ paid = false, sensitiveTransfer = false }: ApiCallRiskInput = {}): RiskAssessment {
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
