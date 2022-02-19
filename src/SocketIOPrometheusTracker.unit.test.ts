import { EventEmitter } from 'events';
import * as promClient from 'prom-client';
import { SocketIOPrometheusTracker } from './SocketIOPrometheusTracker';
import { getByteSize } from './getByteSize';

jest.mock('prom-client', () => ({
  __esModule: true,
    // @ts-ignore
    ...jest.requireActual('prom-client'),
}));

const payloadByteSize = 42;
const socketId = 'socket_id';

const mockServer = (): any => {
  const io: any = new EventEmitter();

  io.compress = () => io;
  io.in = () => io;
  io.json = io;
  io.local = io;
  io.of = () => io;
  io.to = () => io;
  io.volatile = io;

  return io;
};

/**
 * Monkey-patch an EventEmitter to include relevant Socket.IO socket methods for
 * emiting to rooms/namespaces
 */
const mockSocket = (): any => {
  const socket: any = new EventEmitter();

  socket.broadcast = socket;
  socket.compress = () => socket;
  socket.volatile = socket;
  socket.prependAny = () => {};

  socket.id = socketId;

  return socket;
};

jest.mock('./getByteSize', () => ({
  getByteSize: jest.fn().mockImplementation(() => payloadByteSize),
}));

describe('SocketIOPrometheusTracker', () => {
  beforeEach(() => {
    promClient.register.clear();
  });

  it('Uses default Prometheus register', () => {
    const io: any = mockServer();
    const socketIOPrometheusTracker = new SocketIOPrometheusTracker(io);
    expect(socketIOPrometheusTracker.register).toBe(promClient.register);
  });

  it('Does not collect default Prometheus metrics by default', () => {
    const collectDefaultMetricsSpy = jest.spyOn(
      promClient,
      'collectDefaultMetrics',
    );

    const io: any = mockServer();
    new SocketIOPrometheusTracker(io, { prometheusClient: promClient });
    expect(collectDefaultMetricsSpy).toHaveBeenCalledTimes(0);
  });

  it('Collects default metrics according to ctor params', () => {
    // @ts-ignore
    const collectDefaultMetricsSpy = jest.spyOn(
      promClient,
      'collectDefaultMetrics',
    );

    const io: any = mockServer();
    new SocketIOPrometheusTracker(io, {
      collectDefaultMetrics: true,
      prometheusClient: promClient
    });

    expect(collectDefaultMetricsSpy).toHaveBeenCalledTimes(1);
    expect(collectDefaultMetricsSpy).toHaveBeenCalledWith({
      register: promClient.register,
    });
  });

  it('Tracks client connections', () => {
    const io: any = mockServer();
    const socket: any = mockSocket();
    const socketIOPrometheusTracker = new SocketIOPrometheusTracker(io);

    const connectsCurrentIncSpy = jest.spyOn(
      socketIOPrometheusTracker.metrics.connectsCurrent,
      'inc',
    );
    const connectsTotalIncSpy = jest.spyOn(
      socketIOPrometheusTracker.metrics.connectsTotal,
      'inc',
    );

    io.emit('connect', socket);

    expect(connectsCurrentIncSpy).toHaveBeenCalledTimes(1);
    expect(connectsTotalIncSpy).toHaveBeenCalledTimes(1);
  });

  it('Tracks client disconnections', () => {
    const io: any = mockServer();
    const socket: any = mockSocket();
    const socketIOPrometheusTracker = new SocketIOPrometheusTracker(io);

    const connectsCurrentDecSpy = jest.spyOn(
      socketIOPrometheusTracker.metrics.connectsCurrent,
      'dec',
    );
    const disconnectsTotalIncSpy = jest.spyOn(
      socketIOPrometheusTracker.metrics.disconnectsTotal,
      'inc',
    );

    io.emit('connect', socket);
    socket.emit('disconnect');

    expect(connectsCurrentDecSpy).toHaveBeenCalledTimes(1);
    expect(disconnectsTotalIncSpy).toHaveBeenCalledTimes(1);
  });

  it('Tracks length of connections', () => {
    const io: any = mockServer();
    const socket: any = mockSocket();
    const socketIOPrometheusTracker = new SocketIOPrometheusTracker(io);

    const connectsLengthStartTimerSpy = jest.spyOn(
      socketIOPrometheusTracker.metrics.connectsLength,
      'startTimer',
    );
    const endConnectsLength = jest.fn();

    connectsLengthStartTimerSpy.mockImplementation(() => endConnectsLength);

    io.emit('connect', socket);

    expect(connectsLengthStartTimerSpy).toHaveBeenCalledTimes(1);
    expect(connectsLengthStartTimerSpy).toHaveBeenCalledWith({});

    expect(endConnectsLength).toHaveBeenCalledTimes(0);

    socket.emit('disconnect');

    expect(connectsLengthStartTimerSpy).toHaveBeenCalledTimes(1);
    expect(endConnectsLength).toHaveBeenCalledTimes(1);
  });

  it('Tracks length of connections including socket id', () => {
    const io: any = mockServer();
    const socket: any = mockSocket();
    const socketIOPrometheusTracker = new SocketIOPrometheusTracker(io, { trackSocketId: true });

    const connectsLengthStartTimerSpy = jest.spyOn(
      socketIOPrometheusTracker.metrics.connectsLength,
      'startTimer',
    );
    const endConnectsLength = jest.fn();

    connectsLengthStartTimerSpy.mockImplementation(() => endConnectsLength);

    io.emit('connect', socket);

    expect(connectsLengthStartTimerSpy).toHaveBeenCalledTimes(1);
    expect(connectsLengthStartTimerSpy).toHaveBeenCalledWith({
      socketid: socket.id,
    });

    expect(endConnectsLength).toHaveBeenCalledTimes(0);

    socket.emit('disconnect');

    expect(connectsLengthStartTimerSpy).toHaveBeenCalledTimes(1);
    expect(endConnectsLength).toHaveBeenCalledTimes(1);
  });

  it('Skips inbound events with no packet', (done: Function) => {
    const io: any = mockServer();
    const socket: any = mockSocket();
    const socketIOPrometheusTracker = new SocketIOPrometheusTracker(io);

    const bytesReceivedTotalIncSpy = jest.spyOn(
      socketIOPrometheusTracker.metrics.bytesReceivedTotal,
      'inc',
    );
    const eventsReceivedTotalIncSpy = jest.spyOn(
      socketIOPrometheusTracker.metrics.eventsReceivedTotal,
      'inc',
    );

    socket.onevent = (): void => {
      expect(bytesReceivedTotalIncSpy).toHaveBeenCalledTimes(0);
      expect(eventsReceivedTotalIncSpy).toHaveBeenCalledTimes(0);
      expect(getByteSize).toHaveBeenCalledTimes(0);
      done();
    };

    io.emit('connect', socket);
    socket.onevent();
  });

  it('Skips inbound events with no data array', (done: Function) => {
    const io: any = mockServer();
    const socket: any = mockSocket();
    const socketIOPrometheusTracker = new SocketIOPrometheusTracker(io);

    const bytesReceivedTotalIncSpy = jest.spyOn(
      socketIOPrometheusTracker.metrics.bytesReceivedTotal,
      'inc',
    );
    const eventsReceivedTotalIncSpy = jest.spyOn(
      socketIOPrometheusTracker.metrics.eventsReceivedTotal,
      'inc',
    );

    socket.onevent = (): void => {
      expect(bytesReceivedTotalIncSpy).toHaveBeenCalledTimes(0);
      expect(eventsReceivedTotalIncSpy).toHaveBeenCalledTimes(0);
      expect(getByteSize).toHaveBeenCalledTimes(0);
      done();
    };

    io.emit('connect', socket);
    socket.onevent({});
  });

  it('Does not track internal socketio events', () => {
    const io: any = mockServer();
    const socket: any = mockSocket();
    const socketIOPrometheusTracker = new SocketIOPrometheusTracker(io);

    const bytesSentTotalIncSpy = jest.spyOn(
      socketIOPrometheusTracker.metrics.bytesSentTotal,
      'inc',
    );
    const eventsSentTotalIncSpy = jest.spyOn(
      socketIOPrometheusTracker.metrics.eventsSentTotal,
      'inc',
    );

    io.emit('connect', socket);
    io.emit('connect_error');
    io.emit('connect_timeout');
    io.emit('disconnect');
    io.emit('disconnecting');
    io.emit('newListener');
    io.emit('reconnect_attempt');
    io.emit('reconnecting');
    io.emit('reconnect_error');
    io.emit('reconnect_failed');
    io.emit('removeListener');
    io.emit('ping');
    io.emit('pong');

    expect(bytesSentTotalIncSpy).toHaveBeenCalledTimes(0);
    expect(eventsSentTotalIncSpy).toHaveBeenCalledTimes(0);
  });

  it('Tracks io.of.emit', () => {
    const io: any = mockServer();
    const socket: any = mockSocket();
    const socketIOPrometheusTracker = new SocketIOPrometheusTracker(io);

    const eventName = 'eventName';
    const eventData = { foo: 'bar' };

    const bytesSentTotalIncSpy = jest.spyOn(
      socketIOPrometheusTracker.metrics.bytesSentTotal,
      'inc',
    );
    const eventsSentTotalIncSpy = jest.spyOn(
      socketIOPrometheusTracker.metrics.eventsSentTotal,
      'inc',
    );

    io.emit('connect', socket);
    io.of('foo').emit(eventName, eventData);

    expect(bytesSentTotalIncSpy).toHaveBeenCalledTimes(1);
    expect(bytesSentTotalIncSpy).toHaveBeenCalledWith(
      { event: eventName },
      payloadByteSize,
    );
    expect(eventsSentTotalIncSpy).toHaveBeenCalledTimes(1);
    expect(eventsSentTotalIncSpy).toHaveBeenCalledWith({ event: eventName });
    expect(getByteSize).toHaveBeenCalledTimes(1);
    expect(getByteSize).toHaveBeenCalledWith([eventData]);
  });

  it('Tracks socket.emit', () => {
    const io: any = mockServer();
    const socket: any = mockSocket();
    const socketIOPrometheusTracker = new SocketIOPrometheusTracker(io);

    const eventName = 'eventName';
    const eventData = { foo: 'bar' };

    const bytesSentTotalIncSpy = jest.spyOn(
      socketIOPrometheusTracker.metrics.bytesSentTotal,
      'inc',
    );
    const eventsSentTotalIncSpy = jest.spyOn(
      socketIOPrometheusTracker.metrics.eventsSentTotal,
      'inc',
    );

    io.emit('connect', socket);
    socket.emit(eventName, eventData);

    expect(bytesSentTotalIncSpy).toHaveBeenCalledTimes(1);
    expect(bytesSentTotalIncSpy).toHaveBeenCalledWith(
      { event: eventName },
      payloadByteSize,
    );
    expect(eventsSentTotalIncSpy).toHaveBeenCalledTimes(1);
    expect(eventsSentTotalIncSpy).toHaveBeenCalledWith({ event: eventName });
    expect(getByteSize).toHaveBeenCalledTimes(1);
    expect(getByteSize).toHaveBeenCalledWith([eventData]);
  });

  it('Tracks socket.broadcast.emit', () => {
    const io: any = mockServer();
    const socket: any = mockSocket();
    const socketIOPrometheusTracker = new SocketIOPrometheusTracker(io);

    const eventName = 'eventName';
    const eventData = { foo: 'bar' };

    const bytesSentTotalIncSpy = jest.spyOn(
      socketIOPrometheusTracker.metrics.bytesSentTotal,
      'inc',
    );
    const eventsSentTotalIncSpy = jest.spyOn(
      socketIOPrometheusTracker.metrics.eventsSentTotal,
      'inc',
    );

    io.emit('connect', socket);
    socket.broadcast.emit(eventName, eventData);

    expect(bytesSentTotalIncSpy).toHaveBeenCalledTimes(1);
    expect(bytesSentTotalIncSpy).toHaveBeenCalledWith(
      { event: eventName },
      payloadByteSize,
    );
    expect(eventsSentTotalIncSpy).toHaveBeenCalledTimes(1);
    expect(eventsSentTotalIncSpy).toHaveBeenCalledWith({ event: eventName });
    expect(getByteSize).toHaveBeenCalledTimes(1);
    expect(getByteSize).toHaveBeenCalledWith([eventData]);
  });

  it('Tracks socket.compress.emit', () => {
    const io: any = mockServer();
    const socket: any = mockSocket();
    const socketIOPrometheusTracker = new SocketIOPrometheusTracker(io);

    const eventName = 'eventName';
    const eventData = { foo: 'bar' };

    const bytesSentTotalIncSpy = jest.spyOn(
      socketIOPrometheusTracker.metrics.bytesSentTotal,
      'inc',
    );
    const eventsSentTotalIncSpy = jest.spyOn(
      socketIOPrometheusTracker.metrics.eventsSentTotal,
      'inc',
    );

    io.emit('connect', socket);
    socket.compress(false).emit(eventName, eventData);

    expect(bytesSentTotalIncSpy).toHaveBeenCalledTimes(1);
    expect(bytesSentTotalIncSpy).toHaveBeenCalledWith(
      { event: eventName },
      payloadByteSize,
    );
    expect(eventsSentTotalIncSpy).toHaveBeenCalledTimes(1);
    expect(eventsSentTotalIncSpy).toHaveBeenCalledWith({ event: eventName });
    expect(getByteSize).toHaveBeenCalledTimes(1);
    expect(getByteSize).toHaveBeenCalledWith([eventData]);
  });

  it('Tracks socket.volatile.emit', () => {
    const io: any = mockServer();
    const socket: any = mockSocket();
    const socketIOPrometheusTracker = new SocketIOPrometheusTracker(io);

    const eventName = 'eventName';
    const eventData = { foo: 'bar' };

    const bytesSentTotalIncSpy = jest.spyOn(
      socketIOPrometheusTracker.metrics.bytesSentTotal,
      'inc',
    );
    const eventsSentTotalIncSpy = jest.spyOn(
      socketIOPrometheusTracker.metrics.eventsSentTotal,
      'inc',
    );

    io.emit('connect', socket);
    socket.volatile.emit(eventName, eventData);

    expect(bytesSentTotalIncSpy).toHaveBeenCalledTimes(1);
    expect(bytesSentTotalIncSpy).toHaveBeenCalledWith(
      { event: eventName },
      payloadByteSize,
    );
    expect(eventsSentTotalIncSpy).toHaveBeenCalledTimes(1);
    expect(eventsSentTotalIncSpy).toHaveBeenCalledWith({ event: eventName });
    expect(getByteSize).toHaveBeenCalledTimes(1);
    expect(getByteSize).toHaveBeenCalledWith([eventData]);
  });
});
