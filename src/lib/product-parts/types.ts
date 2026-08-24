export interface WhereUsedItem {
  sku: string;
  brand: string;
  serie: string | null;
  model: string;
  serial: string;
  manual: string;
  part_type: string;
}

export interface Brand {
  id: string;
  name: string;
  internal_name: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface BrandModelManual {
  manualId: string;
  serial_number: string;
  downloadLink: string;
}

export interface BrandModel {
  modelId: string;
  modelName: string;
  serie: string;
  manualsCount: number;
  type: string;
  /** A model can have more than one manual (e.g. different serial ranges). */
  manuals: BrandModelManual[];
}

export interface ModelsByBrandResponse {
  brand_id: string;
  brand: string;
  totalItems: number;
  models: BrandModel[];
}
