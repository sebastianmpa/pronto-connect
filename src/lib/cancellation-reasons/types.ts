export interface CancellationSubReason {
  id: string;
  cancellationReasonId: string;
  reasonName: string;
  internalName: string;
  description: string | null;
  isActive: boolean;
}

export interface CancellationReason {
  id: string;
  reasonName: string;
  internalName: string;
  description: string | null;
  isActive: boolean;
  subReasons: CancellationSubReason[];
}

export interface CancellationReasonPayload {
  reasonName: string;
  description: string | null;
  isActive: boolean;
}

export interface CancellationReasonSelection {
  cancellationReasonId: string;
  cancellationSubReasonId: string;
  reasonName: string;
  subReasonName: string;
}
