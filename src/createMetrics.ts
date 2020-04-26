import { Counter, Gauge, Histogram } from 'prom-client';
import { Metrics } from './Metrics';

/**
 * @fileoverview Function for generating default metrics for the library.
 * @returns Metric configuration for the library.
 */
export function createMetrics(): Metrics {
  return {
    bytesReceivedTotal: new Counter({
      help: 'Total number of bytes received by the server.',
      labelNames: ['event', 'socketid'],
      name: 'socketio_bytes_received_total',
    }),
    bytesSentTotal: new Counter({
      help: 'Total number of bytes sent by the server.',
      labelNames: ['event'],
      name: 'socketio_bytes_sent_total',
    }),
    connectsCurrent: new Gauge({
      help: 'Current number of clients connected to the server.',
      name: 'socketio_connects_current',
    }),
    connectsLength: new Histogram({
      help: 'How long each socket connection to the server has lasted.',
      labelNames: ['socketid'],
      name: 'socketio_connects_length',
    }),
    connectsTotal: new Counter({
      help: 'Total number of connections that have been made to the server.',
      name: 'socketio_connects_total',
    }),
    disconnectsTotal: new Counter({
      help: 'Total number of disconnections from the server.',
      name: 'socketio_disconnects_total',
    }),
    eventsReceivedTotal: new Counter({
      help: 'Total number of events received by the server.',
      labelNames: ['event', 'socketid'],
      name: 'socketio_events_received_total',
    }),
    eventsSentTotal: new Counter({
      help: 'Total number of events sent by the server.',
      labelNames: ['event'],
      name: 'socketio_events_sent_total',
    }),
  };
}
