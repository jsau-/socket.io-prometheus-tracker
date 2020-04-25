import {
  Registry,
  collectDefaultMetrics as prometheusCollectDefaultMetrics,
  register as prometheusDefaultRegister,
} from 'prom-client';
import { Metrics } from './Metrics';
import { SocketIOEventPacket } from './SocketIOEventPacket';
import { childHook } from './childHook';
import { createMetrics } from './createMetrics';
import { getByteSize } from './getByteSize';
import { hook } from './hook';

/**
 * This is just a list of Socket.IO reserved event names. At time of writing I
 * see no reason why we'd want to track calls to these events.
 */
const EVENTS_TO_IGNORE = [
  'connect',
  'connect_error',
  'connect_timeout',
  'disconnect',
  'disconnecting',
  'error',
  'newListener',
  'reconnect_attempt',
  'reconnecting',
  'reconnect_error',
  'reconnect_failed',
  'removeListener',
  'ping',
  'pong',
];

/**
 * @fileoverview Bootstrap relevant hooks into a Socket.IO server instance,
 * and track metrics over time.
 */
export class SocketIOTracker {
  public metrics: Metrics;
  public register: Registry;

  constructor(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ioServer: any,
    collectDefaultMetrics = false,
  ) {
    this.metrics = createMetrics();

    this.register = prometheusDefaultRegister;

    if (collectDefaultMetrics) {
      prometheusCollectDefaultMetrics({ register: this.register });
    }

    this.bindHandlers(ioServer);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  bindHandlers = (ioServer: any): void => {
    childHook(ioServer, 'of', 'emit', this.hookOutboundEvent);
    childHook(ioServer, 'in', 'emit', this.hookOutboundEvent);
    childHook(ioServer, 'local', 'emit', this.hookOutboundEvent);
    childHook(ioServer, 'to', 'emit', this.hookOutboundEvent);

    hook(ioServer, 'emit', this.hookOutboundEvent);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ioServer.on('connect', (socket: any) => {
      this.metrics.connectsCurrent.inc();
      this.metrics.connectsTotal.inc();

      socket.on('disconnect', () => {
        this.metrics.connectsCurrent.dec();
        this.metrics.disconnectsTotal.inc();
      });

      childHook(socket, 'binary', 'emit', this.hookOutboundEvent);
      childHook(socket, 'broadcast', 'emit', this.hookOutboundEvent);
      childHook(socket, 'compress', 'emit', this.hookOutboundEvent);
      childHook(socket, 'to', 'emit', this.hookOutboundEvent);
      childHook(socket, 'volatile', 'emit', this.hookOutboundEvent);

      hook(socket, 'emit', this.hookOutboundEvent);

      /**
       * Track inbound events (eg. those handled by socket.on - done like this
       * to ensure we track data about events even if not explicitly handled,
       * 'cos those will still have effects on network traffic into the node!)
       */
      hook(socket, 'onevent', (packet: SocketIOEventPacket) => {
        if (!packet || !packet.data) {
          return;
        }

        const [data, event] = packet.data;

        this.metrics.bytesReceivedTotal.inc({ event }, getByteSize(data));
        this.metrics.eventsReceivedTotal.inc({ event });
      });
    });
  };

  hookOutboundEvent = (event: string, ...data: any[]): void => {
    if (EVENTS_TO_IGNORE.includes(event)) {
      return;
    }

    this.metrics.bytesSentTotal.inc({ event }, getByteSize(data));
    this.metrics.eventsSentTotal.inc({ event });
  };
}
