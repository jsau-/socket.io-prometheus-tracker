import { Counter, Gauge, Histogram } from 'prom-client';

/**
 * Metrics exposed by the library.
 */
export interface Metrics {
  bytesReceivedTotal: Counter<'event' | 'socketid'>;
  bytesSentTotal: Counter<'event'>;
  connectsCurrent: Gauge<''>;
  connectsLength: Histogram<'socketid'>;
  connectsTotal: Counter<''>;
  disconnectsTotal: Counter<''>;
  eventsReceivedTotal: Counter<'event' | 'socketid'>;
  eventsSentTotal: Counter<'event'>;
}
