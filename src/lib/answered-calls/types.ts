export interface CreateAnsweredCallPayload {
  agentName: string;
  agentEmail: string;
  /** YYYY-MM-DD */
  callDateTime: string;
  extension: string;
  callId: string;
  customerPhoneNumber: string;
  contactReason: string;
  closureMethod: string;
  origin: string;
}
