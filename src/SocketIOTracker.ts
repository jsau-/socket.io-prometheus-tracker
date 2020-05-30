import * as promClient from 'prom-client';
import socketIO from 'socket.io';
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
    ioServer: socketIO.Server,
    options: SocketIOTrackerOptions = {
      collectDefaultMetrics: false,
      prometheusClient: undefined,
      trackSocketId: false,
    },
  ) {
    this.metrics = createMetrics();
    this.options = options;

    const prometheusClientToUse = options.prometheusClient || promClient;

    this.register = prometheusClientToUse.register;

    if (options.collectDefaultMetrics) {
      prometheusClientToUse.collectDefaultMetrics({
        register: this.register,
      });
    }

    this.bindHandlers(ioServer);
  }

  /**
   * Bind relevant handlers/hooks to the Socket.IO server instance.
   *
   * @param ioServer - Socket.IO server instance to bind handlers/event hooks
   * to for tracking metrics.
   */
  bindHandlers = (ioServer: socketIO.Server): void => {
    childHook(ioServer, 'of', 'emit', this.hookOutboundEvent);

    ioServer.on('connect', (socket: socketIO.Socket) => {
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
       * Track inbound events (eg. those handled by socket.on). This ensures we
       * track _all_ inbound events, even those without defined handlers.
       *
       * My thought process on tracking events without defined handlers is it
       * might be useful to identify:
       * -- Clients using outdated software (i.e. "This event stopped being
       *    handled 2 months ago. Crap, why are they still on that build!?")
       * -- Malicious actors sending dummy events attempting to DOS the server
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
