import { EventEmitter } from 'events';
import * as promClient from 'prom-client';
import { SocketIOTracker } from './SocketIOTracker';
import { getByteSize } from './getByteSize';

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
  socket.to = () => socket;
  socket.volatile = socket;

  socket.id = socketId;

  return socket;
};

jest.mock('./getByteSize', () => ({
  getByteSize: jest.fn().mockImplementation(() => payloadByteSize),
}));

describe('SocketIOTracker', () => {
  beforeEach(() => {
    promClient.register.clear();
  });

  it('Uses default Prometheus register', () => {
    const io: any = mockServer();
    const socketIOTracker = new SocketIOTracker(io);
    expect(socketIOTracker.register).toBe(promClient.register);
  });

  it('Does not collect default Prometheus metrics by default', () => {
    const io: any = mockServer();
    const collectDefaultMetricsSpy = jest.spyOn(
      promClient,
      'collectDefaultMetrics',
    );
    new SocketIOTracker(io);
    expect(collectDefaultMetricsSpy).toHaveBeenCalledTimes(0);
  });

  it('Collects default metrics according to ctor params', () => {
    const io: any = mockServer();
    const collectDefaultMetricsSpy = jest.spyOn(
      promClient,
      'collectDefaultMetrics',
    );
    new SocketIOTracker(io, { collectDefaultMetrics: true });
    expect(collectDefaultMetricsSpy).toHaveBeenCalledTimes(1);
    expect(collectDefaultMetricsSpy).toHaveBeenCalledWith({
      register: promClient.register,
    });
  });

  it('Tracks client connections', () => {
    const io: any = mockServer();
    const socket: any = mockSocket();
    const socketIOTracker = new SocketIOTracker(io);

    const connectsCurrentIncSpy = jest.spyOn(
      socketIOTracker.metrics.connectsCurrent,
      'inc',
    );
    const connectsTotalIncSpy = jest.spyOn(
      socketIOTracker.metrics.connectsTotal,
      'inc',
    );

    io.emit('connect', socket);

    expect(connectsCurrentIncSpy).toHaveBeenCalledTimes(1);
    expect(connectsTotalIncSpy).toHaveBeenCalledTimes(1);
  });

  it('Tracks client disconnections', () => {
    const io: any = mockServer();
    const socket: any = mockSocket();
    const socketIOTracker = new SocketIOTracker(io);

    const connectsCurrentDecSpy = jest.spyOn(
      socketIOTracker.metrics.connectsCurrent,
      'dec',
    );
    const disconnectsTotalIncSpy = jest.spyOn(
      socketIOTracker.metrics.disconnectsTotal,
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
    const socketIOTracker = new SocketIOTracker(io);

    const connectsLengthStartTimerSpy = jest.spyOn(
      socketIOTracker.metrics.connectsLength,
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
    const socketIOTracker = new SocketIOTracker(io, { trackSocketId: true });

    const connectsLengthStartTimerSpy = jest.spyOn(
      socketIOTracker.metrics.connectsLength,
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

  it('Tracks inbound events', done => {
    const io: any = mockServer();
    const socket: any = mockSocket();
    const socketIOTracker = new SocketIOTracker(io);

    const eventName = 'eventName';
    const eventData = { foo: 'bar' };

    const bytesReceivedTotalIncSpy = jest.spyOn(
      socketIOTracker.metrics.bytesReceivedTotal,
      'inc',
    );
    const eventsReceivedTotalIncSpy = jest.spyOn(
      socketIOTracker.metrics.eventsReceivedTotal,
      'inc',
    );

    socket.onevent = (): void => {
      expect(bytesReceivedTotalIncSpy).toHaveBeenCalledTimes(1);
      expect(bytesReceivedTotalIncSpy).toHaveBeenCalledWith(
        { event: eventName },
        payloadByteSize,
      );

      expect(eventsReceivedTotalIncSpy).toHaveBeenCalledTimes(1);
      expect(eventsReceivedTotalIncSpy).toHaveBeenCalledWith({
        event: eventName,
      });

      expect(getByteSize).toHaveBeenCalledTimes(1);
      expect(getByteSize).toHaveBeenCalledWith(eventData);

      done();
    };

    io.emit('connect', socket);
    socket.onevent({ data: [eventName, eventData] });
  });

  it('Tracks inbound events with socket id', done => {
    const io: any = mockServer();
    const socket: any = mockSocket();
    const socketIOTracker = new SocketIOTracker(io, { trackSocketId: true });

    const eventName = 'eventName';
    const eventData = { foo: 'bar' };

    const bytesReceivedTotalIncSpy = jest.spyOn(
      socketIOTracker.metrics.bytesReceivedTotal,
      'inc',
    );
    const eventsReceivedTotalIncSpy = jest.spyOn(
      socketIOTracker.metrics.eventsReceivedTotal,
      'inc',
    );

    socket.onevent = (): void => {
      expect(bytesReceivedTotalIncSpy).toHaveBeenCalledTimes(1);
      expect(bytesReceivedTotalIncSpy).toHaveBeenCalledWith(
        { event: eventName, socketid: socket.id },
        payloadByteSize,
      );

      expect(eventsReceivedTotalIncSpy).toHaveBeenCalledTimes(1);
      expect(eventsReceivedTotalIncSpy).toHaveBeenCalledWith({
        event: eventName,
        socketid: socket.id,
      });

      expect(getByteSize).toHaveBeenCalledTimes(1);
      expect(getByteSize).toHaveBeenCalledWith(eventData);

      done();
    };

    io.emit('connect', socket);
    socket.onevent({ data: [eventName, eventData] });
  });

  it('Skips inbound events with no packet', (done: Function) => {
    const io: any = mockServer();
    const socket: any = mockSocket();
    const socketIOTracker = new SocketIOTracker(io);

    const bytesReceivedTotalIncSpy = jest.spyOn(
      socketIOTracker.metrics.bytesReceivedTotal,
      'inc',
    );
    const eventsReceivedTotalIncSpy = jest.spyOn(
      socketIOTracker.metrics.eventsReceivedTotal,
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
    const socketIOTracker = new SocketIOTracker(io);

    const bytesReceivedTotalIncSpy = jest.spyOn(
      socketIOTracker.metrics.bytesReceivedTotal,
      'inc',
    );
    const eventsReceivedTotalIncSpy = jest.spyOn(
      socketIOTracker.metrics.eventsReceivedTotal,
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
    const socketIOTracker = new SocketIOTracker(io);

    const bytesSentTotalIncSpy = jest.spyOn(
      socketIOTracker.metrics.bytesSentTotal,
      'inc',
    );
    const eventsSentTotalIncSpy = jest.spyOn(
      socketIOTracker.metrics.eventsSentTotal,
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
    const socketIOTracker = new SocketIOTracker(io);

    const eventName = 'eventName';
    const eventData = { foo: 'bar' };

    const bytesSentTotalIncSpy = jest.spyOn(
      socketIOTracker.metrics.bytesSentTotal,
      'inc',
    );
    const eventsSentTotalIncSpy = jest.spyOn(
      socketIOTracker.metrics.eventsSentTotal,
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
    const socketIOTracker = new SocketIOTracker(io);

    const eventName = 'eventName';
    const eventData = { foo: 'bar' };

    const bytesSentTotalIncSpy = jest.spyOn(
      socketIOTracker.metrics.bytesSentTotal,
      'inc',
    );
    const eventsSentTotalIncSpy = jest.spyOn(
      socketIOTracker.metrics.eventsSentTotal,
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
    const socketIOTracker = new SocketIOTracker(io);

    const eventName = 'eventName';
    const eventData = { foo: 'bar' };

    const bytesSentTotalIncSpy = jest.spyOn(
      socketIOTracker.metrics.bytesSentTotal,
      'inc',
    );
    const eventsSentTotalIncSpy = jest.spyOn(
      socketIOTracker.metrics.eventsSentTotal,
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
    const socketIOTracker = new SocketIOTracker(io);

    const eventName = 'eventName';
    const eventData = { foo: 'bar' };

    const bytesSentTotalIncSpy = jest.spyOn(
      socketIOTracker.metrics.bytesSentTotal,
      'inc',
    );
    const eventsSentTotalIncSpy = jest.spyOn(
      socketIOTracker.metrics.eventsSentTotal,
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

  it('Tracks socket.to.emit', () => {
    const io: any = mockServer();
    const socket: any = mockSocket();
    const socketIOTracker = new SocketIOTracker(io);

    const eventName = 'eventName';
    const eventData = { foo: 'bar' };

    const bytesSentTotalIncSpy = jest.spyOn(
      socketIOTracker.metrics.bytesSentTotal,
      'inc',
    );
    const eventsSentTotalIncSpy = jest.spyOn(
      socketIOTracker.metrics.eventsSentTotal,
      'inc',
    );

    io.emit('connect', socket);
    socket.to('foo').emit(eventName, eventData);

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
    const socketIOTracker = new SocketIOTracker(io);

    const eventName = 'eventName';
    const eventData = { foo: 'bar' };

    const bytesSentTotalIncSpy = jest.spyOn(
      socketIOTracker.metrics.bytesSentTotal,
      'inc',
    );
    const eventsSentTotalIncSpy = jest.spyOn(
      socketIOTracker.metrics.eventsSentTotal,
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
