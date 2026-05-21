export interface BaseEvent {
  eventId: string;
  version: string;
  tenantId: string;
  occurredAt: string;
  correlationId?: string;
  traceId?: string;
}
