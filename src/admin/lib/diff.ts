/**
 * Tiny line-diff for SEO preview. O(n*m) — fine for short strings (titles/descriptions).
 * Returns a list of operations: 'eq' (unchanged), 'del' (removed), 'add' (added).
 */
export type DiffOp = { kind: 'eq' | 'del' | 'add'; value: string };

export function diffLines(a: string, b: string): DiffOp[] {
  const aLines = a.split(/\r?\n/);
  const bLines = b.split(/\r?\n/);
  const m = aLines.length;
  const n = bLines.length;

  // Build LCS table
  const lcs: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = m - 1; i >= 0; i--) {
    for (let j = n - 1; j >= 0; j--) {
      if (aLines[i] === bLines[j]) lcs[i][j] = lcs[i + 1][j + 1] + 1;
      else lcs[i][j] = Math.max(lcs[i + 1][j], lcs[i][j + 1]);
    }
  }

  const ops: DiffOp[] = [];
  let i = 0;
  let j = 0;
  while (i < m && j < n) {
    if (aLines[i] === bLines[j]) {
      ops.push({ kind: 'eq', value: aLines[i] });
      i++; j++;
    } else if (lcs[i + 1][j] >= lcs[i][j + 1]) {
      ops.push({ kind: 'del', value: aLines[i] });
      i++;
    } else {
      ops.push({ kind: 'add', value: bLines[j] });
      j++;
    }
  }
  while (i < m) ops.push({ kind: 'del', value: aLines[i++] });
  while (j < n) ops.push({ kind: 'add', value: bLines[j++] });
  return ops;
}

export type FieldDiff = { field: string; from: string; to: string };
export function diffObjects<T extends Record<string, any>>(a: T, b: T, fields: (keyof T)[]): FieldDiff[] {
  const out: FieldDiff[] = [];
  for (const f of fields) {
    const av = a[f] ?? '';
    const bv = b[f] ?? '';
    if (String(av) !== String(bv)) {
      out.push({ field: String(f), from: String(av), to: String(bv) });
    }
  }
  return out;
}
