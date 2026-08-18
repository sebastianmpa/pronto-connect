export interface PartDetailParams {
  mfr: string;
  partNumber: string;
  locationId: number | string;
}

export interface PartLookupParams {
  partNumber: string;
}

export type InventoryValue = number | string | null;

export interface PartLookupStockLevels {
  level_1: InventoryValue;
  level_2: InventoryValue;
  level_3: InventoryValue;
  level_4: InventoryValue;
}

export interface PartLookupStock {
  location_id: number | string | null;
  onhand: InventoryValue;
  onhand_available: InventoryValue;
  allocated: InventoryValue;
  backorder: InventoryValue;
  binlocation: string | null;
  binlocation2: string | null;
  binlocation3: string | null;
  binlocation4: string | null;
  stock_levels: PartLookupStockLevels;
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
  sku: string;
  mfr: string;
  partnumber: string;
  description: string | null;
  productThumbnailImage: string | null;
  productStandarImage: string | null;
  product: PartProductData | null;
  stock: PartLookupStock | null;
  allocated: InventoryValue;
  backorder: InventoryValue;
  supplier_stock: PartDynamicRow[];
  eta: string | null;
  treatment: string | null;
  links: {
    self?: string | null;
    [key: string]: unknown;
  } | null;
}

export interface PartLookupMeta {
  total: number;
}

export interface PartLookupResponse {
  items: PartLookupItem[];
  meta: PartLookupMeta;
}

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
