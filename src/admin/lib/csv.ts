/**
 * RFC 4180 compliant CSV builder.
 * - Wraps values containing comma, quote, or newline in double quotes
 * - Escapes embedded quotes by doubling them
 * - Optional UTF-8 BOM for Excel compatibility
 * - CRLF line endings (RFC 4180 requires CRLF; modern tools accept LF too)
 */
export function buildCsv(rows: string[][], opts: { bom?: boolean } = {}): string {
  const escape = (cell: string) => {
    const s = cell ?? '';
    if (/[",\r\n]/.test(s)) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };
  const body = rows.map((r) => r.map(escape).join(',')).join('\r\n');
  return opts.bom !== false ? '\uFEFF' + body : body;
}
