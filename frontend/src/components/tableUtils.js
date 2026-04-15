export function normalizeDisplayValue(value) {
  if (value === null || value === undefined || value === "") {
    return "--";
  }

  if (typeof value === "number") {
    if (Number.isFinite(value)) {
      return value.toLocaleString();
    }
    return String(value);
  }

  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return "[]";
    }
    if (typeof value[0] === "object") {
      return `${value.length} entries`;
    }
    return value.join(", ");
  }

  if (typeof value === "object") {
    return JSON.stringify(value);
  }

  return String(value);
}
