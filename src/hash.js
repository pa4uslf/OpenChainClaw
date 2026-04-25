const crypto = require("node:crypto");

function stableStringify(value) {
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(",")}]`;
  }

  if (value && typeof value === "object") {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`)
      .join(",")}}`;
  }

  return JSON.stringify(value);
}

function sha256(value) {
  const input = typeof value === "string" || Buffer.isBuffer(value)
    ? value
    : stableStringify(value);
  return crypto.createHash("sha256").update(input).digest("hex");
}

module.exports = {
  sha256,
  stableStringify
};
