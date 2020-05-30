import * as promClient from 'prom-client';
import { Metrics } from './Metrics';
import { SocketIOEventPacket } from './SocketIOEventPacket';
import { SocketIOTrackerOptions } from './SocketIOTrackerOptions';
import { createMetrics } from './createMetrics';
import { getByteSize } from './getByteSize';
import { childHook } from './childHook';
import { hook } from './hook';

/**
 * This is just a list of Socket.IO reserved event names. At time of writing I
 * see no reason why we'd want to track calls to these events.
 */
const EVENTS_TO_IGNORE = [
  'connect',
  'connection',
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
  private options: SocketIOTrackerOptions;
  public register: promClient.Registry;

  /**
   * @param ioServer - The Socket.IO server instance to track metrics for.
   * @param options - Optional configuration parameters for the tracker
   * instance.
   * @example
   * ```javascript
   * const ioPrometheus = new SocketIOTracker(
   *   io,
   *   { collectDefaultMetrics: true },
   * );
   * ```
   */
  constructor(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ioServer: any,
    options: SocketIOTrackerOptions = {
      collectDefaultMetrics: false,
      trackSocketId: false,
    },
  ) {
    this.metrics = createMetrics();
    this.options = options;
    this.register = promClient.register;

    if (options.collectDefaultMetrics) {
      promClient.collectDefaultMetrics({ register: this.register });
    }

    this.bindHandlers(ioServer);
  }

  /**
   * Bind relevant handlers/hooks to the Socket.IO server instance.
   *
   * @param ioServer - Socket.IO server instance to bind handlers/event hooks
   * to for tracking metrics.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  bindHandlers = (ioServer: any): void => {
    childHook(ioServer, 'of', 'emit', this.hookOutboundEvent);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ioServer.on('connect', (socket: any) => {
      const endConnectsLength = this.metrics.connectsLength.startTimer(
        this.options.trackSocketId ? { socketid: socket.id } : {},
      );

      this.metrics.connectsCurrent.inc();
      this.metrics.connectsTotal.inc();

      socket.on('disconnect', () => {
        endConnectsLength();
        this.metrics.connectsCurrent.dec();
        this.metrics.disconnectsTotal.inc();
      });

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

        const [event, data] = packet.data;

        let defaultLabels = {};

        if (this.options.trackSocketId) {
          defaultLabels = { socketid: socket.id };
        }

        this.metrics.bytesReceivedTotal.inc(
          { ...defaultLabels, event },
          getByteSize(data),
        );

        this.metrics.eventsReceivedTotal.inc({ ...defaultLabels, event });
      });
    });
  };

  /**
   * Track an occurring outbound message.
   *
   * @param event - The occurring event name.
   * @param ...data - The data payload for the outbound event.
   * @example
   * ```javascript
   * hookOutboundEvent('event_name', { example_payload: { foo: 'bar' }});
   * ```
   */
  hookOutboundEvent = (event: string, ...data: any[]): void => {
    if (EVENTS_TO_IGNORE.includes(event)) {
      return;
    }

    this.metrics.bytesSentTotal.inc({ event }, getByteSize(data));
    this.metrics.eventsSentTotal.inc({ event });
  };
}
