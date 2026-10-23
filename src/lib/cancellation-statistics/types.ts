export interface CancellationStoreStats {
  store_name: string;
  store_prefix: string | null;
  sales_quantity: number;
  sales_usd: number;
  cancellations_quantity: number;
  cancellations_usd: number;
  cancellation_rate_quantity: number | null;
  cancellation_rate_usd: number | null;
}

export interface CancellationReasonStats {
  store_name: string;
  reason: string;
  cancellations_quantity: number;
  cancellations_usd: number;
}

export interface CancellationBrandStats {
  store_name: string;
  brand: string | null;
  cancelled_units: number;
  cancellations_usd: number;
}

export interface CancellationAgentStats {
  agent: string;
  cancellations: number;
  share_percent: number;
}

export interface CancellationTimeBucketStats {
  bucket: string;
  cancellations: number;
  average_days: number | null;
}

export interface CancellationBrandTimeStats {
  brand: string;
  bucket: string;
  cancellations: number;
  average_days: number | null;
}

export interface CancellationStatisticsResponse {
  filters: {
    from: string;
    to: string;
    store: string;
    focus: "" | "high-rate" | "high-impact";
    reason: string;
    agent: string;
    age: string;
  };
  available_filters: {
    stores: string[];
    reasons: string[];
    agents: string[];
    ages: string[];
  };
  totals: {
    sales_quantity: number;
    sales_usd: number;
    cancellations_quantity: number;
    cancellations_usd: number;
    cancellation_rate_quantity: number | null;
    cancellation_rate_usd: number | null;
  };
  alerts: {
    high_rate_stores: number;
    high_impact_stores: number;
    cancellations_over_30_days: number;
    inconsistent_dates: number;
  };
  stores: CancellationStoreStats[];
  reasons: CancellationReasonStats[];
  brands: CancellationBrandStats[];
  agents: CancellationAgentStats[];
  time_to_cancel: {
    by_bucket: CancellationTimeBucketStats[];
    by_brand: CancellationBrandTimeStats[];
    data_quality: {
      total_cancellations: number;
      missing_dates: number;
      inconsistent_dates: number;
    };
  };
}
