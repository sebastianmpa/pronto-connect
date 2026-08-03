import type { GoToConnectCallAnsweredEvent } from "./types";

/** The external party on the call — pulled from the PHONE_NUMBER participant leg. */
export function getCallerInfo(
  event: GoToConnectCallAnsweredEvent
): { name: string; number: string } | null {
  const participant = event.call?.state?.participants?.find(
    (p) => p.type?.value === "PHONE_NUMBER"
  );
  if (!participant) return null;
  return {
    name: participant.type.caller?.name || participant.type.name || "Unknown caller",
    number: participant.type.caller?.number || participant.type.number || "",
  };
}

/** The queue the call came through, if any. */
export function getQueueName(event: GoToConnectCallAnsweredEvent): string | null {
  const ivr = event.call?.state?.interactiveVoiceResponseSystems?.find(
    (s) => s.type?.value === "CALL_QUEUE"
  );
  return ivr?.type.queueName ?? null;
}
