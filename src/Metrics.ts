import { Counter, Gauge } from 'prom-client';

export interface Metrics {
  bytesReceivedTotal: Counter<'event'>;
  bytesSentTotal: Counter<'event'>;
  connectsCurrent: Gauge<''>;
  connectsTotal: Counter<''>;
  disconnectsTotal: Counter<''>;
  eventsReceivedTotal: Counter<'event'>;
  eventsSentTotal: Counter<'event'>;
}
