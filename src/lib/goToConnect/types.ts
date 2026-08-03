// ─── GoToConnect call-answered event (received over Socket.io) ────────────────

export interface GoToConnectAgent {
  name: string;
  extension: string;
  status: string;
}

export interface GoToConnectCaller {
  name?: string;
  number?: string;
}

export interface GoToConnectParticipantType {
  value: string; // "PHONE_NUMBER" | "LINE" | ...
  number?: string;
  name?: string;
  callProvider?: string;
  caller?: GoToConnectCaller;
  extensionNumber?: string;
  device?: { id: string; model: string; user?: { id: string } };
}

export interface GoToConnectParticipant {
  id: string;
  legId: string;
  originator: string;
  status: { value: string };
  type: GoToConnectParticipantType;
}

export interface GoToConnectIvrType {
  value: string; // "DIAL_PLAN" | "CALL_QUEUE" | ...
  queueId?: string;
  queueName?: string;
  queueType?: string;
}

export interface GoToConnectIvrSystem {
  id: string;
  originator: string;
  status: { value: string };
  type: GoToConnectIvrType;
}

export interface GoToConnectCallState {
  id: string;
  sequenceNumber: number;
  type: string;
  interactiveVoiceResponseSystems?: GoToConnectIvrSystem[];
  timestamp: string;
  participants: GoToConnectParticipant[];
}

export interface GoToConnectCallContent {
  metadata: {
    conversationSpaceId: string;
    direction: string;
    accountKey: string;
    callCreated: string;
    callInitiator: string;
  };
  state: GoToConnectCallState;
}

export interface GoToConnectCallAnsweredEvent {
  source: string;
  eventType: string;
  occurredAt: string;
  conversationId: string;
  callState: string;
  agent: GoToConnectAgent;
  call: GoToConnectCallContent;
}

/** A call-answered event tagged with a local id/seen-flag for the notification UI. */
export interface CallNotification {
  localId: string;
  receivedAt: number;
  seen: boolean;
  event: GoToConnectCallAnsweredEvent;
}
