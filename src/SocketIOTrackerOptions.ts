import * as promClient from 'prom-client';

export interface SocketIOTrackerOptions {
  collectDefaultMetrics?: boolean;
  prometheusClient?: Pick<typeof promClient, 'register'|'collectDefaultMetrics'>;
  trackSocketId?: boolean;
}
