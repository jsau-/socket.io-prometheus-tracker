import * as promClient from 'prom-client';

export interface SocketIOTrackerOptions {
  collectDefaultMetrics?: boolean;
  prometheusClient?: typeof promClient;
  trackSocketId?: boolean;
}
