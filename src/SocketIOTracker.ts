import {
  Registry,
  collectDefaultMetrics as prometheusCollectDefaultMetrics,
  register as prometheusDefaultRegister,
} from 'prom-client';
import * as io from 'socket.io';
import { Metrics } from './Metrics';
import { SocketIOEventPacket } from './SocketIOEventPacket';
import { createMetrics } from './createMetrics';
import { getByteSize } from './getByteSize';
import { hook } from './hook';

export class SocketIOTracker {
  private metrics: Metrics;

  public register: Registry;

  constructor(ioServer: io.Server, collectDefaultMetrics = false) {
    this.metrics = createMetrics();

    this.register = prometheusDefaultRegister;

    if (collectDefaultMetrics) {
      prometheusCollectDefaultMetrics({ register: this.register });
    }

    this.bindHandlers(ioServer);
  }

  private bindHandlers(ioServer: io.Server): void {
    ioServer.on('connect', (socket: io.Socket) => {
      this.metrics.connectsCurrent.inc();
      this.metrics.connectsTotal.inc();

      socket.on('disconnect', () => {
        this.metrics.connectsCurrent.dec();
        this.metrics.disconnectsTotal.inc();
      });

      hook(socket, 'emit', (event: string, ...data: any[]) => {
        this.metrics.bytesSentTotal.inc({ event }, getByteSize(data));
        this.metrics.eventsSentTotal.inc({ event });
      });

      hook(socket, 'onevent', (packet: SocketIOEventPacket) => {
        if (!packet || !packet.data) {
          return;
        }

        const [data, event] = packet.data;

        this.metrics.bytesReceivedTotal.inc({ event }, getByteSize(data));
        this.metrics.eventsReceivedTotal.inc({ event });
      });
    });
  }
}
