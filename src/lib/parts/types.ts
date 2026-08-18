export interface PartDetailParams {
  mfr: string;
  partNumber: string;
  locationId: number | string;
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

export type PartDynamicRow = Record<string, unknown>;

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
  [key: string]: unknown;
}
