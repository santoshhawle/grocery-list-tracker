/**
 * Serialises an array of row objects into an RFC 4180 CSV string.
 *
 * Behaviour:
 * - Prepends a UTF-8 BOM (U+FEFF) for Excel on Windows compatibility.
 * - Wraps fields that contain commas, double-quotes, or newlines in double-quotes.
 * - Escapes embedded double-quotes by doubling them ("").
 * - Neutralises CSV injection: fields whose first character is =, +, -, or @
 *   are prefixed with a tab character.
 * - When `rows` is empty, returns BOM + header row only.
 */

const INJECTION_CHARS = new Set(['=', '+', '-', '@']);
const BOM = '\uFEFF';

function encodeField(value: string): string {
  let v = value;

  // Neutralise CSV injection
  if (v.length > 0 && INJECTION_CHARS.has(v[0])) {
    v = '\t' + v;
  }

  // Wrap in quotes if the value contains commas, double-quotes, or newlines
  if (v.includes('"') || v.includes(',') || v.includes('\n') || v.includes('\r')) {
    v = '"' + v.replace(/"/g, '""') + '"';
  }

  return v;
}

function rowToLine(row: Record<string, unknown>, headers: string[]): string {
  return headers
    .map((h) => {
      const raw = row[h];
      if (raw === null || raw === undefined) return '';
      return encodeField(String(raw));
    })
    .join(',');
}

export function csvSerialize(
  rows: Record<string, unknown>[],
  headers: string[]
): string {
  const lines: string[] = [headers.join(',')];
  for (const row of rows) {
    lines.push(rowToLine(row, headers));
  }
  return BOM + lines.join('\r\n');
}
