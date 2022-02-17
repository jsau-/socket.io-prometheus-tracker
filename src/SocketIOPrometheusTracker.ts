import * as PromClient from 'prom-client';
import { Server, Socket } from 'socket.io';
import { Metrics } from './Metrics';
import { createMetrics } from './createMetrics';
import { getByteSize } from './getByteSize';
import { childHook } from './childHook';
import { hook } from './hook';

export interface SocketIOTrackerOptions {
  collectDefaultMetrics?: boolean;
  prometheusClient?: Pick<
    typeof PromClient,
    'register' | 'collectDefaultMetrics'
  >;
  trackSocketId?: boolean;
}

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
export class SocketIOPrometheusTracker {
  public metrics: Metrics;
  private options: SocketIOTrackerOptions;
  public register: PromClient.Registry;

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
    ioServer: Server,
    options: SocketIOTrackerOptions = {
      collectDefaultMetrics: false,
      prometheusClient: undefined,
      trackSocketId: false,
    },
  ) {
    this.metrics = createMetrics();
    this.options = options;

    const prometheusClientToUse = options.prometheusClient || PromClient;

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
  private bindHandlers = (ioServer: Server): void => {
    childHook(ioServer, 'compress', 'emit', this.hookOutboundEvent);
    childHook(ioServer, 'except', 'emit', this.hookOutboundEvent);
    childHook(ioServer, 'in', 'emit', this.hookOutboundEvent);
    childHook(ioServer, 'to', 'emit', this.hookOutboundEvent);

    hook(ioServer, 'emit', this.hookOutboundEvent);

    hook(
      ioServer,
      'send',
      (...args: unknown[]) => this.hookOutboundEvent('message', args),
    );

    hook(
      ioServer,
      'write',
      (...args: unknown[]) => this.hookOutboundEvent('message', args),
    );

    ioServer.on('connect', (socket: Socket) => {
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

      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      const initNewBroadcastOperator = socket.newBroadcastOperator;

      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      socket.newBroadcastOperator = () => {
        const broadcastOperator = initNewBroadcastOperator.apply(socket);
        hook(broadcastOperator, 'emit', this.hookOutboundEvent)
        return broadcastOperator;
      };

      childHook(socket, 'to', 'emit', this.hookOutboundEvent);

      /**
       * Track all inbound websocket events (regardless if there's an explicit
       * handler setup for it or not).
       *
       * My thought process on tracking events without defined handlers is it
       * might be useful to identify:
       * -- Clients using outdated software (i.e. "This event stopped being
       *    handled 2 months ago. Crap, why are they still on that build!?")
       * -- Malicious actors sending dummy events attempting to DOS the server
       */
      socket.prependAny((event,  ...args) => {
        let defaultLabels = {};

        if (this.options.trackSocketId) {
          defaultLabels = { socketid: socket.id };
        }

        this.metrics.bytesReceivedTotal.inc(
          { ...defaultLabels, event },
          getByteSize(args),
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
  private hookOutboundEvent = (event: string, ...data: any[]): void => {
    if (EVENTS_TO_IGNORE.includes(event)) {
      return;
    }

    this.metrics.bytesSentTotal.inc({ event }, getByteSize(data));
    this.metrics.eventsSentTotal.inc({ event });
  };
}
