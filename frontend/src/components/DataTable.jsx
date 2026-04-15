import { normalizeDisplayValue } from "./tableUtils";

const TABLE_ROW_LIMIT = 6;
const TABLE_COLUMN_LIMIT = 8;

const PRIORITY_COLUMNS = [
  "id",
  "name",
  "title",
  "display_name",
  "employee_name",
  "team_name",
  "status",
  "department",
  "category",
  "created_at",
  "updated_at",
];

function buildColumns(items) {
  const allColumns = new Set();
  for (const item of items) {
    for (const key of Object.keys(item)) {
      allColumns.add(key);
    }
  }

  const orderedColumns = [
    ...PRIORITY_COLUMNS.filter((key) => allColumns.has(key)),
    ...[...allColumns].filter((key) => !PRIORITY_COLUMNS.includes(key)),
  ];

  return orderedColumns.slice(0, TABLE_COLUMN_LIMIT);
}

export function DataTable({ items, title = "Dataset" }) {
  if (!items?.length) {
    return <p className="empty-state">No records available.</p>;
  }

  const columns = buildColumns(items);
  const rows = items.slice(0, TABLE_ROW_LIMIT);

  return (
    <div className="table-container">
      <table aria-label={`${title} table`}>
        <caption className="visually-hidden">{title}</caption>
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column}>{column.replaceAll("_", " ")}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((item, index) => (
            <tr key={item.id || `${index}-${columns[0] || "row"}`}>
              {columns.map((column) => (
                <td key={`${item.id || index}-${column}`}>{normalizeDisplayValue(item[column])}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
