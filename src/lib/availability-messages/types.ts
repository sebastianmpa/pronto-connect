export interface AvailabilityMessage {
  id: string;
  supplier_id: string | null;
  reason: string;
  message: string;
  created_at?: string;
  updated_at?: string;
}

export interface AvailabilityMessagePayload {
  supplier_id: string | null;
  reason: string;
  message: string;
}

export interface AvailabilityMessagesPage {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  items: AvailabilityMessage[];
}

export interface SupplierOption {
  id: string;
  code: string;
  name: string;
}
