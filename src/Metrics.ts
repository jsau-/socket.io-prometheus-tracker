import { Counter, Gauge, Histogram } from 'prom-client';

/**
 * @fileoverview Metrics exposed by the library.
 */
export interface Metrics {
  bytesReceivedTotal: Counter<'event'>;
  bytesSentTotal: Counter<'event'>;
  connectsCurrent: Gauge<''>;
  connectsLength: Histogram<''>;
  connectsTotal: Counter<''>;
  disconnectsTotal: Counter<''>;
  eventsReceivedTotal: Counter<'event'>;
  eventsSentTotal: Counter<'event'>;
}
