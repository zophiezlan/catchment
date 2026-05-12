function normalizeCsvText(text) {
  return text.replace(/^﻿/, "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
}

function pushRow(rows, row, field) {
  const nextRow = [...row, field];
  if (nextRow.some((f) => f)) rows.push(nextRow);
}

export function parseCSV(text) {
  const src = normalizeCsvText(text);
  const rows = [];
  let row = [];
  let field = "";
  let inQ = false;

  for (let i = 0; i < src.length; i++) {
    const c = src[i];

    if (inQ) {
      if (c === '"' && src[i + 1] === '"') {
        field += '"';
        i++;
      } else if (c === '"') {
        inQ = false;
      } else {
        field += c;
      }
      continue;
    }

    if (c === '"') {
      inQ = true;
      continue;
    }

    if (c === ',') {
      row.push(field);
      field = "";
      continue;
    }

    if (c === "\n") {
      pushRow(rows, row, field);
      row = [];
      field = "";
      continue;
    }

    field += c;
  }

  if (row.length) {
    pushRow(rows, row, field);
  }

  return rows;
}

export function csv2obj(text) {
  const [headers, ...data] = parseCSV(text);
  const keys = headers.map((h) => h.trim());
  return data.map((r) =>
    Object.fromEntries(keys.map((k, i) => [k, (r[i] ?? "").trim()]))
  );
}
