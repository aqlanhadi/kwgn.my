export type CsvRow = {
  sequence: number;
  date: string;
  description: string;
  type: string;
  amount: string;
  balance: string;
  ref: string;
  source: string;
};

export function toCsvRows(transactions: any[]): CsvRow[] {
  return transactions.map((t: any) => ({
    sequence: t.sequence,
    date: t.date,
    description: Array.isArray(t.descriptions)
      ? t.descriptions.join(" | ")
      : String(t.descriptions ?? ""),
    type: t.type,
    amount: t.amount,
    balance: t.balance,
    ref: t.ref,
    source: t.source,
  }));
}

export function createCsvBlobUrl(rows: CsvRow[] | readonly CsvRow[] | null): string | null {
  if (!rows || rows.length === 0) return null;
  const headers = [
    "sequence",
    "date",
    "description",
    "type",
    "amount",
    "balance",
    "ref",
    "source",
  ];
  const escape = (val: string | number) => {
    const s = String(val ?? "");
    if (s.includes("\n") || s.includes(",") || s.includes('"')) {
      return '"' + s.replace(/"/g, '""') + '"';
    }
    return s;
  };
  const body = rows
    .map((r) => headers.map((h) => escape((r as any)[h])).join(","))
    .join("\n");
  const csv = headers.join(",") + "\n" + body;
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  return URL.createObjectURL(blob);
}






