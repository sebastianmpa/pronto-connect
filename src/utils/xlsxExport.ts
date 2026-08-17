export interface XlsxColumn<T> {
  header: string;
  value: (row: T) => string | number | boolean | null | undefined;
}

interface ZipEntry {
  name: string;
  data: Uint8Array;
  crc32: number;
  offset: number;
}

const encoder = new TextEncoder();

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function columnName(index: number): string {
  let value = index + 1;
  let result = "";

  while (value > 0) {
    const remainder = (value - 1) % 26;
    result = String.fromCharCode(65 + remainder) + result;
    value = Math.floor((value - 1) / 26);
  }

  return result;
}

function cellXml(reference: string, value: unknown): string {
  if (typeof value === "number" && Number.isFinite(value)) {
    return `<c r="${reference}"><v>${value}</v></c>`;
  }

  if (typeof value === "boolean") {
    return `<c r="${reference}" t="b"><v>${value ? 1 : 0}</v></c>`;
  }

  const text = value === null || value === undefined ? "" : String(value);
  return `<c r="${reference}" t="inlineStr"><is><t xml:space="preserve">${escapeXml(text)}</t></is></c>`;
}

function buildWorksheet<T>(rows: T[], columns: XlsxColumn<T>[]): string {
  const header = columns
    .map((column, index) => cellXml(`${columnName(index)}1`, column.header))
    .join("");

  const body = rows
    .map((row, rowIndex) => {
      const excelRow = rowIndex + 2;
      const cells = columns
        .map((column, columnIndex) =>
          cellXml(`${columnName(columnIndex)}${excelRow}`, column.value(row)),
        )
        .join("");

      return `<row r="${excelRow}">${cells}</row>`;
    })
    .join("");

  const lastColumn = columnName(Math.max(columns.length - 1, 0));
  const lastRow = Math.max(rows.length + 1, 1);

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <dimension ref="A1:${lastColumn}${lastRow}"/>
  <sheetViews><sheetView workbookViewId="0"/></sheetViews>
  <sheetFormatPr defaultRowHeight="15"/>
  <sheetData><row r="1">${header}</row>${body}</sheetData>
  <autoFilter ref="A1:${lastColumn}${lastRow}"/>
</worksheet>`;
}

function crc32(bytes: Uint8Array): number {
  let crc = 0xffffffff;

  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
    }
  }

  return (crc ^ 0xffffffff) >>> 0;
}

function dosDateTime(date = new Date()): { time: number; date: number } {
  const year = Math.max(date.getFullYear(), 1980);
  const time =
    (date.getHours() << 11) |
    (date.getMinutes() << 5) |
    Math.floor(date.getSeconds() / 2);
  const dosDate =
    ((year - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate();

  return { time, date: dosDate };
}

function concat(parts: Uint8Array[]): Uint8Array {
  const length = parts.reduce((total, part) => total + part.length, 0);
  const output = new Uint8Array(length);
  let offset = 0;

  parts.forEach((part) => {
    output.set(part, offset);
    offset += part.length;
  });

  return output;
}

function makeLocalHeader(
  nameBytes: Uint8Array,
  data: Uint8Array,
  checksum: number,
): Uint8Array {
  const header = new Uint8Array(30 + nameBytes.length);
  const view = new DataView(header.buffer);
  const stamp = dosDateTime();

  view.setUint32(0, 0x04034b50, true);
  view.setUint16(4, 20, true);
  view.setUint16(6, 0x0800, true);
  view.setUint16(8, 0, true);
  view.setUint16(10, stamp.time, true);
  view.setUint16(12, stamp.date, true);
  view.setUint32(14, checksum, true);
  view.setUint32(18, data.length, true);
  view.setUint32(22, data.length, true);
  view.setUint16(26, nameBytes.length, true);
  view.setUint16(28, 0, true);
  header.set(nameBytes, 30);

  return header;
}

function makeCentralHeader(entry: ZipEntry): Uint8Array {
  const nameBytes = encoder.encode(entry.name);
  const header = new Uint8Array(46 + nameBytes.length);
  const view = new DataView(header.buffer);
  const stamp = dosDateTime();

  view.setUint32(0, 0x02014b50, true);
  view.setUint16(4, 20, true);
  view.setUint16(6, 20, true);
  view.setUint16(8, 0x0800, true);
  view.setUint16(10, 0, true);
  view.setUint16(12, stamp.time, true);
  view.setUint16(14, stamp.date, true);
  view.setUint32(16, entry.crc32, true);
  view.setUint32(20, entry.data.length, true);
  view.setUint32(24, entry.data.length, true);
  view.setUint16(28, nameBytes.length, true);
  view.setUint16(30, 0, true);
  view.setUint16(32, 0, true);
  view.setUint16(34, 0, true);
  view.setUint16(36, 0, true);
  view.setUint32(38, 0, true);
  view.setUint32(42, entry.offset, true);
  header.set(nameBytes, 46);

  return header;
}

function makeEndOfCentralDirectory(
  entryCount: number,
  centralSize: number,
  centralOffset: number,
): Uint8Array {
  const footer = new Uint8Array(22);
  const view = new DataView(footer.buffer);

  view.setUint32(0, 0x06054b50, true);
  view.setUint16(4, 0, true);
  view.setUint16(6, 0, true);
  view.setUint16(8, entryCount, true);
  view.setUint16(10, entryCount, true);
  view.setUint32(12, centralSize, true);
  view.setUint32(16, centralOffset, true);
  view.setUint16(20, 0, true);

  return footer;
}

function buildZip(files: Array<{ name: string; content: string }>): Uint8Array {
  const localParts: Uint8Array[] = [];
  const entries: ZipEntry[] = [];
  let offset = 0;

  files.forEach((file) => {
    const nameBytes = encoder.encode(file.name);
    const data = encoder.encode(file.content);
    const checksum = crc32(data);
    const localHeader = makeLocalHeader(nameBytes, data, checksum);

    entries.push({
      name: file.name,
      data,
      crc32: checksum,
      offset,
    });

    localParts.push(localHeader, data);
    offset += localHeader.length + data.length;
  });

  const centralParts = entries.map(makeCentralHeader);
  const centralSize = centralParts.reduce(
    (total, part) => total + part.length,
    0,
  );
  const footer = makeEndOfCentralDirectory(
    entries.length,
    centralSize,
    offset,
  );

  return concat([...localParts, ...centralParts, footer]);
}

function safeSheetName(value: string): string {
  return value.replace(/[\\/*?:\[\]]/g, " ").trim().slice(0, 31) || "Sheet1";
}

function ensureXlsxExtension(filename: string): string {
  return filename.toLowerCase().endsWith(".xlsx") ? filename : `${filename}.xlsx`;
}

export function downloadRowsAsXlsx<T>(options: {
  rows: T[];
  columns: XlsxColumn<T>[];
  filename: string;
  sheetName?: string;
}): void {
  const { rows, columns, filename, sheetName = "Data" } = options;

  if (columns.length === 0) {
    throw new Error("At least one XLSX column is required.");
  }

  const worksheet = buildWorksheet(rows, columns);
  const safeName = safeSheetName(sheetName);

  const files = [
    {
      name: "[Content_Types].xml",
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
</Types>`,
    },
    {
      name: "_rels/.rels",
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`,
    },
    {
      name: "xl/workbook.xml",
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets><sheet name="${escapeXml(safeName)}" sheetId="1" r:id="rId1"/></sheets>
</workbook>`,
    },
    {
      name: "xl/_rels/workbook.xml.rels",
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
</Relationships>`,
    },
    { name: "xl/worksheets/sheet1.xml", content: worksheet },
  ];

  const workbookBytes = buildZip(files);
  const blob = new Blob([workbookBytes], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = ensureXlsxExtension(filename);
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
