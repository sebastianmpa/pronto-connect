export interface PartDetailParams {
  mfr: string;
  partNumber: string;
  locationId: number | string;
  po?: string;
}

export interface PartLookupParams {
  partNumber: string;
}

export interface PartDetailBcParams {
  storeId: number | string;
  brand: string;
  mpn: string;
}

export type InventoryValue = number | string | null;

export interface PartStockLocation {
  locationid: number | string | null;
  onhand?: InventoryValue;
  onhand_available?: InventoryValue;
  allocated?: InventoryValue;
  onorder_qty?: InventoryValue;
  backorder_qty?: InventoryValue;
  binlocation?: string | null;
  cost?: InventoryValue;
  min?: InventoryValue;
  max?: InventoryValue;
  summin?: InventoryValue;
  summax?: InventoryValue;
  [key: string]: unknown;
}

export interface PartLookupStockLevels {
  level_1?: InventoryValue;
  level_2?: InventoryValue;
  level_3?: InventoryValue;
  level_4?: InventoryValue;
  [key: string]: unknown;
}

export interface PartLookupLocation {
  location_id: number | string | null;
  onhand?: InventoryValue;
  onhand_available?: InventoryValue;
  allocated?: InventoryValue;
  backorder?: InventoryValue;
  binlocation?: string | null;
  binlocation2?: string | null;
  binlocation3?: string | null;
  binlocation4?: string | null;
  stock_levels?: PartLookupStockLevels | null;
  [key: string]: unknown;
}

export interface PartLookupStock {
  location_id?: number | string | null;
  onhand?: InventoryValue;
  onhand_available?: InventoryValue;
  locations?: PartLookupLocation[];
  [key: string]: unknown;
}

export interface PartProductData {
  MFRID?: string | null;
  PARTNUMBER?: string | null;
  DESCRIPTION?: string | null;
  LOOKUPPARTNUMBER?: string | null;
  CATEGORY?: string | null;
  STATUS?: string | null;
  UPC?: string | null;
  CURRENTCOST?: InventoryValue;
  LISTPRICE?: InventoryValue;
  STANDARDCOST?: InventoryValue;
  AVERAGECOST?: InventoryValue;
  PREFERREDSUPPLIERID?: number | string | null;
  LASTCHANGEDATE?: string | null;
  [key: string]: unknown;
}

export type PartDynamicRow = Record<string, unknown>;

export interface PartLookupItem {
  sku?: string | null;
  mfr: string;
  partnumber: string;
  description?: string | null;
  productThumbnailImage?: string | null;
  productStandarImage?: string | null;
  product?: PartProductData | null;
  stock?: PartLookupStock | null;
  allocated?: InventoryValue;
  backorder?: InventoryValue;
  supplier_stock?: PartDynamicRow[];
  eta?: string | null;
  treatment?: string | null;
  links?: Record<string, unknown> | null;
  [key: string]: unknown;
}

export interface PartLookupMeta {
  total: number;
  limit?: number;
  offset?: number;
  page?: number;
  [key: string]: unknown;
}

export interface PartLookupResponse {
  items: PartLookupItem[];
  meta: PartLookupMeta;
}

type PartLookupEnvelope = {
  items?: PartLookupItem[];
  data?: PartLookupItem[];
  results?: PartLookupItem[];
  meta?: Partial<PartLookupMeta> | null;
  total?: number | string | null;
  [key: string]: unknown;
};

/**
 * GET /api/parts/lookup can return a collection envelope or, for older
 * responses, a single item/array. The service normalizes all of them to
 * PartLookupResponse so PartsTable always receives { items, meta }.
 */
export type PartLookupApiResponse =
  | PartLookupItem
  | PartLookupItem[]
  | PartLookupEnvelope;

export interface PartPurchaseOrdersMeta {
  total?: number;
  limit?: number;
  offset?: number;
  [key: string]: unknown;
}

export interface PartDetailLinks {
  product_row?: string | null;
  stock_row?: string | null;
  [key: string]: unknown;
}

export interface PartTracking {
  number?: string | null;
  url?: string | null;
  status?: string | null;
  eta?: string | null;
  carrier?: string | null;
}

/**
 * Current response from:
 * GET /api/parts/detail?mfr=...&partnumber=...&locationid=...
 */
export interface PartDetailResponse {
  mfr: string;
  partnumber: string;
  product?: PartProductData | null;
  stock_location?: PartStockLocation | null;
  supplier_stock?: PartDynamicRow[];
  purchase_orders?: PartDynamicRow[];
  purchase_orders_meta?: PartPurchaseOrdersMeta | null;
  eta?: string | null;
  treatment?: string | null;
  links?: PartDetailLinks | null;
  tracking?: PartTracking | null;
  [key: string]: unknown;
}

/**
 * Response from:
 * GET /api/parts/detail-bc?storeid=...&brand=...&mpn=...
 */
export interface PartDetailBcResponse extends PartDetailResponse {
  brand: string;
  mpn: string;
  total_invoices?: number | string | null;
  suppliers?: PartDynamicRow[];
}
