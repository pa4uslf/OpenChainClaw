function lineDiff(beforeText, afterText) {
  const beforeLines = beforeText.split("\n");
  const afterLines = afterText.split("\n");
  const maxLength = Math.max(beforeLines.length, afterLines.length);
  const lines = [];

  for (let index = 0; index < maxLength; index += 1) {
    const before = beforeLines[index];
    const after = afterLines[index];

    if (before === after) {
      if (before !== undefined) {
        lines.push(` ${before}`);
      }
      continue;
    }

    if (before !== undefined) {
      lines.push(`-${before}`);
    }

    if (after !== undefined) {
      lines.push(`+${after}`);
    }
  }

  return lines.join("\n");
}

module.exports = {
  lineDiff
};
