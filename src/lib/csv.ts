// Helper CSV sesuai RFC 4180 — dipakai oleh Research Export (/api/export).
// Nilai yang mengandung koma, tanda kutip, atau baris baru dibungkus tanda
// kutip dan kutip di dalamnya digandakan, supaya file aman dibuka di
// SPSS/Stata/R/Excel.

export function escapeCsvValue(val: unknown): string {
  if (val === null || val === undefined) return "";
  // Boolean ditulis 1/0 agar langsung terpakai sebagai dummy variable di
  // SPSS/Stata/R.
  if (typeof val === "boolean") return val ? "1" : "0";
  let str =
    typeof val === "object" ? JSON.stringify(val) : String(val);
  // Formula injection guard: Excel/LibreOffice/Sheets treat cells starting
  // with =, +, -, @, tab, or CR as formulas. Free-text clinical fields
  // (patientInitial, notes, ...Other reasons) are attacker-controllable, so
  // prefix a leading apostrophe to force those to render as plain text.
  if (/^[=+\-@\t\r]/.test(str)) {
    str = `'${str}`;
  }
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function buildCsv(
  headers: string[],
  rows: Record<string, unknown>[]
): string {
  const lines = [
    headers.map(escapeCsvValue).join(","),
    ...rows.map((row) => headers.map((h) => escapeCsvValue(row[h])).join(",")),
  ];
  return lines.join("\n");
}
