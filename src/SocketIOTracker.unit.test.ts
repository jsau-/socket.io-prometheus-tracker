import { EventEmitter } from 'events';
import { register } from 'prom-client';
import { SocketIOTracker } from './SocketIOTracker';
import { getByteSize } from './getByteSize';

const payloadByteSize = 42;

jest.mock('./getByteSize', () => ({
  getByteSize: jest.fn().mockImplementation(() => payloadByteSize),
}));

describe('SocketIOTracker', () => {
  beforeEach(() => {
    register.clear();
  });

  it('Tracks client connections', () => {
    const io = new EventEmitter();
    const socket = new EventEmitter();
    const socketIOTracker = new SocketIOTracker(io);

    const connectsCurrentIncSpy = jest.spyOn(socketIOTracker.metrics.connectsCurrent, 'inc');
    const connectsTotalIncSpy = jest.spyOn(socketIOTracker.metrics.connectsTotal, 'inc');

    io.emit('connect', socket);

    expect(connectsCurrentIncSpy).toHaveBeenCalledTimes(1);
    expect(connectsTotalIncSpy).toHaveBeenCalledTimes(1);
  });

  it('Tracks client disconnections', () => {
    const io = new EventEmitter();
    const socket = new EventEmitter();
    const socketIOTracker = new SocketIOTracker(io);

    const connectsCurrentDecSpy = jest.spyOn(socketIOTracker.metrics.connectsCurrent, 'dec');
    const disconnectsTotalIncSpy = jest.spyOn(socketIOTracker.metrics.disconnectsTotal, 'inc');

    io.emit('connect', socket);
    socket.emit('disconnect');

    expect(connectsCurrentDecSpy).toHaveBeenCalledTimes(1);
    expect(disconnectsTotalIncSpy).toHaveBeenCalledTimes(1);
  });

  it('Tracks inbound events', (done) => {
    const io = new EventEmitter();
    const socket: any = new EventEmitter();
    const socketIOTracker = new SocketIOTracker(io);

    const eventName = 'eventName';
    const eventData = { foo: 'bar' };

    const bytesReceivedTotalIncSpy = jest.spyOn(socketIOTracker.metrics.bytesReceivedTotal, 'inc');
    const eventsReceivedTotalIncSpy = jest.spyOn(socketIOTracker.metrics.eventsReceivedTotal, 'inc');

    socket.onevent = (): void => {
      expect(bytesReceivedTotalIncSpy).toHaveBeenCalledTimes(1);
      expect(bytesReceivedTotalIncSpy).toHaveBeenCalledWith({ event: eventName }, payloadByteSize);

      expect(eventsReceivedTotalIncSpy).toHaveBeenCalledTimes(1);
      expect(eventsReceivedTotalIncSpy).toHaveBeenCalledWith({ event: eventName });

      expect(getByteSize).toHaveBeenCalledTimes(1);
      expect(getByteSize).toHaveBeenCalledWith(eventData);

      done();
    }

    io.emit('connect', socket);
    socket.onevent({ data: [eventData, eventName] });
  });

  it('Skips inbound events with no packet', (done: Function) => {
    const io = new EventEmitter();
    const socket: any = new EventEmitter();
    const socketIOTracker = new SocketIOTracker(io);

    const bytesReceivedTotalIncSpy = jest.spyOn(socketIOTracker.metrics.bytesReceivedTotal, 'inc');
    const eventsReceivedTotalIncSpy = jest.spyOn(socketIOTracker.metrics.eventsReceivedTotal, 'inc');

    socket.onevent = (): void => {
      expect(bytesReceivedTotalIncSpy).toHaveBeenCalledTimes(0);
      expect(eventsReceivedTotalIncSpy).toHaveBeenCalledTimes(0);
      expect(getByteSize).toHaveBeenCalledTimes(0);
      done();
    }

    io.emit('connect', socket);
    socket.onevent();
  });

  it('Skips inbound events with no data array', (done: Function) => {
    const io = new EventEmitter();
    const socket: any = new EventEmitter();
    const socketIOTracker = new SocketIOTracker(io);

    const bytesReceivedTotalIncSpy = jest.spyOn(socketIOTracker.metrics.bytesReceivedTotal, 'inc');
    const eventsReceivedTotalIncSpy = jest.spyOn(socketIOTracker.metrics.eventsReceivedTotal, 'inc');

    socket.onevent = (): void => {
      expect(bytesReceivedTotalIncSpy).toHaveBeenCalledTimes(0);
      expect(eventsReceivedTotalIncSpy).toHaveBeenCalledTimes(0);
      expect(getByteSize).toHaveBeenCalledTimes(0);
      done();
    }

    io.emit('connect', socket);
    socket.onevent({});
  });

  it('Tracks outbound events', () => {
    const io = new EventEmitter();
    const socket: any = new EventEmitter();
    const socketIOTracker = new SocketIOTracker(io);

    const eventName = 'eventName';
    const eventData = { foo: 'bar' };

    const bytesSentTotalIncSpy = jest.spyOn(socketIOTracker.metrics.bytesSentTotal, 'inc');
    const eventsSentTotalIncSpy = jest.spyOn(socketIOTracker.metrics.eventsSentTotal, 'inc');

    io.emit('connect', socket);
    socket.emit(eventName, eventData);

    expect(bytesSentTotalIncSpy).toHaveBeenCalledTimes(1);
    expect(bytesSentTotalIncSpy).toHaveBeenCalledWith({ event: eventName }, payloadByteSize);

    expect(eventsSentTotalIncSpy).toHaveBeenCalledTimes(1);
    expect(eventsSentTotalIncSpy).toHaveBeenCalledWith({ event: eventName });

    expect(getByteSize).toHaveBeenCalledTimes(1);
    expect(getByteSize).toHaveBeenCalledWith([eventData]);
  });
});
