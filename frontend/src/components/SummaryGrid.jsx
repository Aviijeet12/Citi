import { normalizeDisplayValue } from "./tableUtils";

export function SummaryGrid({ summary }) {
  const entries = Object.entries(summary || {});

  if (!entries.length) {
    return <p className="empty-state">No report summary values returned.</p>;
  }

  return (
    <div className="summary-grid" role="list" aria-label="Report summary">
      {entries.map(([key, value]) => (
        <article className="summary-item" key={key} role="listitem">
          <p>{key.replaceAll("_", " ")}</p>
          <strong>{normalizeDisplayValue(value)}</strong>
        </article>
      ))}
    </div>
  );
}
