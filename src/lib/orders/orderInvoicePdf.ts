import type { OrderDetail, OrderDetailItem } from "./types";

interface RasterPage {
  jpeg: Uint8Array;
  width: number;
  height: number;
  logoLink?: string | null;
}

const PAGE_WIDTH = 612;
const PAGE_HEIGHT = 792;
const SCALE = 2;

const CONTENT_LEFT = 36.7875;
const CONTENT_RIGHT = 575.9625;
const BORDER_LEFT = 33.8625;
const BORDER_TOP = 33.8625;
const BORDER_RIGHT = 578.8875;

const BODY_FONT = "Verdana, Arial, sans-serif";
const HEADER_FONT = "Arial, sans-serif";

function numberValue(value: unknown): number {
  const parsed = Number.parseFloat(String(value ?? "0"));
  return Number.isFinite(parsed) ? parsed : 0;
}

function money(value: unknown, currency = "USD"): string {
  return `$${numberValue(value).toFixed(2)} ${currency || "USD"}`;
}

function moneyNoCurrency(value: unknown): string {
  return `$${numberValue(value).toFixed(2)}`;
}

function ordinal(day: number): string {
  const mod100 = day % 100;
  if (mod100 >= 11 && mod100 <= 13) return `${day}th`;
  switch (day % 10) {
    case 1:
      return `${day}st`;
    case 2:
      return `${day}nd`;
    case 3:
      return `${day}rd`;
    default:
      return `${day}th`;
  }
}

function formatOrderDate(raw?: string | null): string {
  if (!raw) return "-";
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return raw;

  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  return `${months[date.getMonth()]} ${ordinal(date.getDate())} ${date.getFullYear()}`;
}

function formatPrintTimestamp(date = new Date()): string {
  const day = date.getDate();
  const month = date.getMonth() + 1;
  const year = String(date.getFullYear()).slice(-2);
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const hour24 = date.getHours();
  const hour12 = hour24 % 12 || 12;
  const meridiem = hour24 < 12 ? "a.m." : "p.m.";
  return `${day}/${month}/${year}, ${hour12}:${minutes} ${meridiem}`;
}

function cleanUrl(url?: string | null): string | null {
  const value = String(url ?? "").trim();
  if (!value) return null;
  return value;
}

function storeDomain(url?: string | null): string | null {
  const value = cleanUrl(url);
  if (!value) return null;

  try {
    return new URL(value).hostname.replace(/^www\./i, "");
  } catch {
    return value
      .replace(/^https?:\/\//i, "")
      .replace(/^www\./i, "")
      .split("/")[0] || null;
  }
}

function storeContact(order: OrderDetail): {
  address1: string;
  address2: string;
  country: string;
  email: string;
} {
  const store = order.store;
  const domain = storeDomain(store?.url);

  // The current endpoint only guarantees description/url/logo fields.
  // These optional fields are used automatically if the backend adds them later.
  const address1 = store?.address_line_1 || "8207 205th PL S.";
  const defaultCity = store?.city || "Boca Raton";
  const defaultState = store?.state || "FL";
  const defaultZip = store?.zip || "33434";
  const address2 =
    store?.address_line_2 ||
    `${defaultCity}${defaultState ? `, ${defaultState}` : ""}${
      defaultZip ? ` ${defaultZip}` : ""
    }`;
  const country = store?.country || "USA.";
  const email = store?.email || (domain ? `sales@${domain}` : "");

  return { address1, address2, country, email };
}

function customerAddressLines(address?: {
  first_name?: string;
  last_name?: string;
  company?: string;
  street_1?: string;
  street_2?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
  phone?: string;
  email?: string;
} | null): {
  name: string;
  main: string[];
  phone: string;
  email: string;
} {
  if (!address) {
    return { name: "-", main: ["-"], phone: "", email: "" };
  }

  const name = [address.first_name, address.last_name].filter(Boolean).join(" ") || "-";
  const cityLine = [
    address.city ? `${address.city},` : "",
    address.state,
    address.zip,
  ]
    .filter(Boolean)
    .join(" ")
    .replace(/,\s+$/, "");

  const main = [
    address.company,
    address.street_1,
    address.street_2,
    cityLine,
    address.country,
  ].filter((line): line is string => Boolean(line));

  return {
    name,
    main,
    phone: address.phone ? `Phone: ${address.phone}` : "",
    email: address.email ? `Email: ${address.email}` : "",
  };
}

function packageText(item: OrderDetailItem): string | null {
  const raw = item.raw ?? {};
  const candidates = [
    raw.package,
    raw.package_info,
    raw.package_label,
    raw.pack,
    raw.pack_qty,
    raw.package_quantity,
  ];

  for (const value of candidates) {
    if (value !== null && value !== undefined && String(value).trim()) {
      const text = String(value).trim();
      if (/^pack\//i.test(text)) return text;
      if (/^\d+$/.test(text)) return `Pack/${text}`;
      return text;
    }
  }

  const match = item.sku?.match(/-PK(\d+)$/i);
  return match ? `Pack/${match[1]}` : null;
}

function paymentMethod(order: OrderDetail): string {
  const method = String(order.header?.payment_method || "-").trim();
  if (!method || method === "-") return "-";
  if (/\$\s*\d/.test(method)) return method;
  return `${method} (${moneyNoCurrency(order.header?.total_inc_tax)})`;
}

function splitLine(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): string[] {
  const clean = String(text ?? "").trim();
  if (!clean) return [""];
  if (ctx.measureText(clean).width <= maxWidth) return [clean];

  const words = clean.split(/\s+/);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (ctx.measureText(candidate).width <= maxWidth) {
      current = candidate;
    } else {
      if (current) lines.push(current);
      current = word;
    }
  }

  if (current) lines.push(current);
  return lines;
}

function setFont(
  ctx: CanvasRenderingContext2D,
  size: number,
  bold = false,
  family = BODY_FONT,
): void {
  ctx.font = `${bold ? "700" : "400"} ${size}px ${family}`;
}

function drawText(
  ctx: CanvasRenderingContext2D,
  text: unknown,
  x: number,
  top: number,
  size = 5.85,
  bold = false,
  color = "#000000",
  align: CanvasTextAlign = "left",
  family = BODY_FONT,
): void {
  setFont(ctx, size, bold, family);
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = "top";
  ctx.fillText(String(text ?? ""), x, top);
}

function drawRule(
  ctx: CanvasRenderingContext2D,
  y: number,
  x1 = CONTENT_LEFT,
  x2 = CONTENT_RIGHT,
  width = 0.4875,
): void {
  ctx.save();
  ctx.strokeStyle = "#000000";
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(x1, y);
  ctx.lineTo(x2, y);
  ctx.stroke();
  ctx.restore();
}

function drawOuterBorder(ctx: CanvasRenderingContext2D, bottom: number): void {
  ctx.save();
  ctx.strokeStyle = "#cacaca";
  ctx.lineWidth = 0.975;
  ctx.strokeRect(
    BORDER_LEFT,
    BORDER_TOP,
    BORDER_RIGHT - BORDER_LEFT,
    bottom - BORDER_TOP,
  );
  ctx.restore();
}

function drawFittedImage(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  x: number,
  y: number,
  maxWidth: number,
  maxHeight: number,
): void {
  const ratio = Math.min(maxWidth / image.naturalWidth, maxHeight / image.naturalHeight);
  const width = image.naturalWidth * ratio;
  const height = image.naturalHeight * ratio;
  ctx.drawImage(image, x, y, width, height);
}

function googleDriveId(url: string): string | null {
  try {
    const parsed = new URL(url);
    const queryId = parsed.searchParams.get("id");
    if (queryId) return queryId;
    const match = parsed.pathname.match(/\/d\/([^/]+)/);
    return match?.[1] || null;
  } catch {
    return null;
  }
}

function logoCandidates(url?: string | null): string[] {
  const clean = cleanUrl(url);
  if (!clean) return [];

  const driveId = googleDriveId(clean);

  // Google Drive download URLs are not reliable browser image URLs. Some of
  // them return 403/429 or a file format Chrome cannot decode directly.
  // For Drive assets we always go through our same-origin image proxy.
  if (driveId) {
    return [`/api/invoice-logo?id=${encodeURIComponent(driveId)}`];
  }

  // Non-Drive logos can still be requested directly.
  return [clean];
}

async function blobToImage(blob: Blob): Promise<HTMLImageElement> {
  const objectUrl = URL.createObjectURL(blob);

  try {
    return await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error("Unable to decode logo image."));
      image.src = objectUrl;
    });
  } finally {
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 2500);
  }
}

const logoCache = new Map<string, Promise<HTMLImageElement | null>>();

async function loadLogo(url?: string | null): Promise<HTMLImageElement | null> {
  const clean = cleanUrl(url);
  if (!clean) return null;

  const cached = logoCache.get(clean);
  if (cached) return cached;

  const loading = (async () => {
    for (const candidate of logoCandidates(clean)) {
      try {
        const response = await fetch(candidate, {
          method: "GET",
          credentials: "omit",
          cache: "no-store",
        });

        if (!response.ok) continue;

        const contentType = response.headers.get("content-type") || "";
        if (!contentType.toLowerCase().startsWith("image/")) continue;

        const blob = await response.blob();
        if (!blob.size) continue;

        return await blobToImage(blob);
      } catch {
        // The invoice remains downloadable even if a store logo cannot load.
      }
    }

    return null;
  })();

  logoCache.set(clean, loading);
  return loading;
}

function createCanvas(): {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
} {
  const canvas = document.createElement("canvas");
  canvas.width = PAGE_WIDTH * SCALE;
  canvas.height = PAGE_HEIGHT * SCALE;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Unable to create invoice canvas.");

  ctx.scale(SCALE, SCALE);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, PAGE_WIDTH, PAGE_HEIGHT);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  return { canvas, ctx };
}

function drawBrowserHeader(
  ctx: CanvasRenderingContext2D,
  order: OrderDetail,
  printedAt: Date,
): void {
  const storeName = (order.store?.description || "STORE").toUpperCase();
  drawText(
    ctx,
    formatPrintTimestamp(printedAt),
    24,
    16.2,
    7.99,
    false,
    "#000000",
    "left",
    HEADER_FONT,
  );
  drawText(
    ctx,
    `${storeName} - Print invoice for order #${order.order_number}`,
    PAGE_WIDTH / 2,
    16.2,
    7.99,
    false,
    "#000000",
    "center",
    HEADER_FONT,
  );
}

function drawBrowserFooter(
  ctx: CanvasRenderingContext2D,
  order: OrderDetail,
  pageNumber: number,
  pageCount: number,
): void {
  const footerUrl = order.store?.url || "";
  if (footerUrl) {
    drawText(
      ctx,
      footerUrl,
      24,
      769.2,
      7.99,
      false,
      "#000000",
      "left",
      HEADER_FONT,
    );
  }

  drawText(
    ctx,
    `${pageNumber}/${pageCount}`,
    588,
    769.2,
    7.99,
    false,
    "#000000",
    "right",
    HEADER_FONT,
  );
}

function drawAddressBlock(
  ctx: CanvasRenderingContext2D,
  x: number,
  header: string,
  address: ReturnType<typeof customerAddressLines>,
): void {
  drawText(ctx, header, x, 156.785, 7.31, true);
  drawText(ctx, address.name, x, 170.13, 5.85, true);

  let y = 177.44;
  address.main.forEach((line) => {
    drawText(ctx, line, x, y, 5.85);
    y += 7.31;
  });

  // Match the original invoice spacing: contact fields begin lower even when
  // the address has fewer than four detail rows.
  const contactY = Math.max(205.23, y + 5.85);
  if (address.phone) drawText(ctx, address.phone, x, contactY, 5.85);
  if (address.email) drawText(ctx, address.email, x, contactY + 7.31, 5.85);
}

function itemDisplayName(item: OrderDetailItem): string {
  return String(item.name || "-").trim();
}

function drawFirstPageContent(
  ctx: CanvasRenderingContext2D,
  order: OrderDetail,
  colorLogo: HTMLImageElement | null,
): number {
  const storeName = (order.store?.description || "STORE").toUpperCase();
  const contact = storeContact(order);
  const currency = order.header?.currency_code || "USD";
  const shippingAddress = order.shipping_addresses?.[0];

  // Invoice background is white, so only the color store logo is used.
  // logo_white remains available in the API response for dark UI backgrounds,
  // but it is intentionally not rendered in the invoice.
  if (colorLogo) {
    drawFittedImage(ctx, colorLogo, 36.7875, 36.7875, 243.75, 53.625);
  }

  drawText(
    ctx,
    `${storeName} invoice for order #${order.order_number}`,
    39.225,
    99.26,
    7.31,
    true,
    "#a6a6a6",
  );

  drawText(ctx, contact.address1, CONTENT_LEFT, 115.0, 5.85, true);
  drawText(ctx, contact.address2, CONTENT_LEFT, 122.4, 5.85, true);
  drawText(ctx, contact.country, CONTENT_LEFT, 129.7, 5.85, true);
  if (contact.email) drawText(ctx, contact.email, CONTENT_LEFT, 144.3, 5.85, true);

  const billing = customerAddressLines(order.header?.billing_address);
  const shipping = customerAddressLines(shippingAddress);
  drawAddressBlock(ctx, CONTENT_LEFT, "Billing Details", billing);
  drawAddressBlock(ctx, 295.589, "Shipping Details", shipping);

  drawText(ctx, "Order:", CONTENT_LEFT, 228.14, 5.85, true);
  drawText(ctx, `#${order.order_number}`, 105.0375, 227.65, 5.85);

  drawText(ctx, "Order Date:", 295.589, 228.14, 5.85, true);
  drawText(ctx, formatOrderDate(order.header?.date_created), 363.84, 227.65, 5.85);

  drawText(ctx, "Payment Method:", CONTENT_LEFT, 238.865, 5.85, true);
  drawText(ctx, paymentMethod(order), 105.0375, 238.38, 5.85);

  drawText(ctx, "Shipping Method:", 295.589, 238.865, 5.85, true);
  drawText(ctx, shippingAddress?.shipping_method || "-", 363.84, 238.38, 5.85);

  drawRule(ctx, 252.99);
  drawText(ctx, "Order Items", CONTENT_LEFT, 259.65, 7.31, true);

  const qtyX = 59.88;
  const skuX = 68.475;
  const nameX = 132.734;
  const priceRight = 495.525;
  const totalRight = 573.518;

  drawText(ctx, "Qty", 52.151, 275.428, 5.85, true);
  drawText(ctx, "Code/SKU", 68.475, 275.428, 5.85, true);
  drawText(ctx, "Product Name", 132.734, 275.428, 5.85, true);
  drawText(ctx, "Price", priceRight, 275.428, 5.85, true, "#000000", "right");
  drawText(ctx, "Total", totalRight, 275.428, 5.85, true, "#000000", "right");

  let y = 287.62;

  for (const item of order.items) {
    setFont(ctx, 5.85, false);
    const nameLines = splitLine(ctx, itemDisplayName(item), 300).slice(0, 2);
    const pack = packageText(item);

    drawText(ctx, item.quantity, qtyX, y, 5.85, false, "#000000", "right");
    drawText(ctx, item.sku || "-", skuX, y, 5.85);

    nameLines.forEach((line, index) => {
      drawText(ctx, line, nameX, y + index * 7.31, 5.85);
    });

    drawText(
      ctx,
      money(item.unit_price, currency),
      priceRight,
      y,
      5.85,
      false,
      "#000000",
      "right",
    );
    drawText(
      ctx,
      money(item.total_price, currency),
      totalRight,
      y,
      5.85,
      false,
      "#000000",
      "right",
    );

    const nameHeight = Math.max(1, nameLines.length) * 7.31;
    let rowHeight = Math.max(14.85, nameHeight + 5.5);

    if (pack) {
      const packageY = y + Math.max(10.13, nameHeight + 2.0);
      drawText(ctx, "Package:", 137.609, packageY, 5.36, false);
      drawText(ctx, pack, 205.859, packageY - 0.49, 5.36, false);
      rowHeight = Math.max(rowHeight, packageY - y + 14.2);
    }

    y += rowHeight;
  }

  const dividerY = Math.max(321.24, y - 1.0);
  drawRule(ctx, dividerY, 130.3875, CONTENT_RIGHT);

  const subtotal = numberValue(order.header?.subtotal_inc_tax);
  const shippingCost = numberValue(order.header?.shipping_cost_inc_tax);
  const grandTotal = numberValue(order.header?.total_inc_tax);
  const explicitTax = order.header?.total_tax;
  const tax =
    explicitTax !== null && explicitTax !== undefined && String(explicitTax).trim() !== ""
      ? numberValue(explicitTax)
      : Math.max(0, grandTotal - subtotal - shippingCost);

  let totalsY = dividerY + 3.9;
  const labelRight = 495.522;
  const valueRight = 573.518;

  drawText(ctx, "Subtotal:", labelRight, totalsY, 5.85, false, "#000000", "right");
  drawText(ctx, money(subtotal, currency), valueRight, totalsY, 5.85, false, "#000000", "right");

  totalsY += 12.19;
  drawText(ctx, "Shipping:", labelRight, totalsY, 5.85, false, "#000000", "right");
  drawText(ctx, money(shippingCost, currency), valueRight, totalsY, 5.85, false, "#000000", "right");

  totalsY += 12.19;
  drawText(ctx, "Tax:", labelRight, totalsY, 5.85, false, "#000000", "right");
  drawText(ctx, money(tax, currency), valueRight, totalsY, 5.85, false, "#000000", "right");

  totalsY += 12.19;
  drawText(ctx, "Grand total:", labelRight, totalsY, 5.85, true, "#000000", "right");
  drawText(ctx, money(grandTotal, currency), valueRight, totalsY, 5.85, true, "#000000", "right");

  const borderBottom = Math.max(378.0375, totalsY + 16.3);
  drawOuterBorder(ctx, borderBottom);
  return borderBottom;
}

function canvasToJpeg(canvas: HTMLCanvasElement): Uint8Array {
  const dataUrl = canvas.toDataURL("image/jpeg", 0.96);
  const base64 = dataUrl.split(",")[1] || "";
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
}

async function createInvoicePage(order: OrderDetail): Promise<RasterPage> {
  const printedAt = new Date();
  const colorLogo = await loadLogo(order.store?.logo_color);
  const { canvas, ctx } = createCanvas();

  drawBrowserHeader(ctx, order, printedAt);
  drawFirstPageContent(ctx, order, colorLogo);
  drawBrowserFooter(ctx, order, 1, 1);

  return {
    jpeg: canvasToJpeg(canvas),
    width: canvas.width,
    height: canvas.height,
    logoLink: order.store?.url || null,
  };
}

function encode(text: string): Uint8Array {
  return new TextEncoder().encode(text);
}

function concatBytes(parts: Uint8Array[]): Uint8Array {
  const length = parts.reduce((total, part) => total + part.length, 0);
  const output = new Uint8Array(length);
  let offset = 0;

  for (const part of parts) {
    output.set(part, offset);
    offset += part.length;
  }

  return output;
}

function escapePdfString(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");
}

function streamObject(bytes: Uint8Array, dictionary = ""): Uint8Array {
  return concatBytes([
    encode(`<< ${dictionary} /Length ${bytes.length} >>\nstream\n`),
    bytes,
    encode("\nendstream"),
  ]);
}

function buildRasterPdf(pages: RasterPage[]): Blob {
  const objects: Array<Uint8Array | null> = [null];
  const reserve = () => {
    objects.push(null);
    return objects.length - 1;
  };
  const set = (id: number, value: string | Uint8Array) => {
    objects[id] = typeof value === "string" ? encode(value) : value;
  };

  const catalogId = reserve();
  const pagesId = reserve();
  const pageIds: number[] = [];

  pages.forEach((page, pageIndex) => {
    const imageId = reserve();
    const contentId = reserve();
    const pageId = reserve();
    const annotationId = page.logoLink ? reserve() : null;
    pageIds.push(pageId);

    set(
      imageId,
      streamObject(
        page.jpeg,
        `/Type /XObject /Subtype /Image /Width ${page.width} /Height ${page.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode`,
      ),
    );

    const pageStream = encode(
      `q ${PAGE_WIDTH} 0 0 ${PAGE_HEIGHT} 0 0 cm /Im${pageIndex + 1} Do Q`,
    );
    set(contentId, streamObject(pageStream));

    if (annotationId && page.logoLink) {
      const x1 = 36.7875;
      const y1 = PAGE_HEIGHT - (36.7875 + 53.625);
      const x2 = 36.7875 + 243.75;
      const y2 = PAGE_HEIGHT - 36.7875;
      set(
        annotationId,
        `<< /Type /Annot /Subtype /Link /Rect [${x1} ${y1} ${x2} ${y2}] /Border [0 0 0] /A << /S /URI /URI (${escapePdfString(
          page.logoLink,
        )}) >> >>`,
      );
    }

    const annots = annotationId ? ` /Annots [${annotationId} 0 R]` : "";
    set(
      pageId,
      `<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] /Resources << /XObject << /Im${
        pageIndex + 1
      } ${imageId} 0 R >> >> /Contents ${contentId} 0 R${annots} >>`,
    );
  });

  set(
    pagesId,
    `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${pageIds.length} >>`,
  );
  set(catalogId, `<< /Type /Catalog /Pages ${pagesId} 0 R >>`);

  const chunks: Uint8Array[] = [encode("%PDF-1.4\n")];
  const offsets = new Array(objects.length).fill(0);
  let position = chunks[0].length;

  for (let id = 1; id < objects.length; id += 1) {
    const object = objects[id];
    if (!object) throw new Error(`Missing PDF object ${id}`);

    offsets[id] = position;
    const objectBytes = concatBytes([
      encode(`${id} 0 obj\n`),
      object,
      encode("\nendobj\n"),
    ]);
    chunks.push(objectBytes);
    position += objectBytes.length;
  }

  const xrefOffset = position;
  const xref = [
    "xref",
    `0 ${objects.length}`,
    "0000000000 65535 f ",
    ...offsets.slice(1).map((offset) => `${String(offset).padStart(10, "0")} 00000 n `),
    "trailer",
    `<< /Size ${objects.length} /Root ${catalogId} 0 R >>`,
    "startxref",
    String(xrefOffset),
    "%%EOF",
  ].join("\n");

  chunks.push(encode(`${xref}\n`));
  return new Blob(chunks as BlobPart[], { type: "application/pdf" });
}

export async function downloadOrderInvoicePdf(order: OrderDetail): Promise<void> {
  const page = await createInvoicePage(order);
  const blob = buildRasterPdf([page]);
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = objectUrl;
  anchor.download = `${(order.store?.description || "store")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")}-invoice-${order.order_number || "order"}.pdf`;

  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 2000);
}
