export interface ModelManualEntry {
  serial_number: string;
  serial_number_manual: string;
}

export interface ModelManuals {
  name: string;
  models: ModelManualEntry[];
}

export interface WhereUsedItem {
  sku: string;
  brand: string;
  serie: string | null;
  model: string;
  serial: string;
  manual: string;
  part_type: string;
}
