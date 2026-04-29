import crypto from "node:crypto";

export function stableStringify(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(",")}]`;
  }

  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    return `{${Object.keys(record)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableStringify(record[key])}`)
      .join(",")}}`;
  }

  return JSON.stringify(value);
}

export function sha256(value: unknown): string {
  const input = typeof value === "string" || Buffer.isBuffer(value)
    ? value
    : stableStringify(value);
  return crypto.createHash("sha256").update(input).digest("hex");
}
