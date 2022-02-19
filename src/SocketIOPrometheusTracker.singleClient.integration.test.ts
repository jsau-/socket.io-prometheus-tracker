import express from 'express';
import http from 'http';
import * as promClient from 'prom-client';
import { Server } from 'socket.io';
import socketIOClient from 'socket.io-client';
import { SocketIOPrometheusTracker } from './SocketIOPrometheusTracker';

const makeClient = () => socketIOClient(`http://localhost:${port}`, {
  forceNew: true,
  reconnection: false,
  transports: ['websocket'],
});

let app;
let server;
let io: Server;
let client: ReturnType<typeof makeClient>;

const eventName = 'event_name';
const eventPayload = { hello: 'world!' };
const port = 3001;

const TEST_CASE_TIMEOUT_MS = 250;

describe('SocketIOPrometheusTracker (Single Client)', () => {
  beforeEach(done => {
    promClient.register.clear();

    app = express();
    server = new http.Server(app);
    io = new Server(server, {
      cors: {
        origin: '*',
      },
    });

    server.listen(port, () => {
      done();
    });
  });

  afterEach(done => {
    if (client) {
      client.disconnect();
    }

    server.close(() => {
      done();
    });
  });

  it('Tracks socket.broadcast', async () => {
    const socketIOTracker = new SocketIOPrometheusTracker(io);

    const eventsSentTotalIncSpy = jest.spyOn(
      socketIOTracker.metrics.eventsSentTotal,
      'inc',
    );

    io.on('connect', socket => socket.broadcast.emit(eventName, eventPayload));

    client = makeClient();

    await new Promise((r) => setTimeout(r, TEST_CASE_TIMEOUT_MS));

    expect(eventsSentTotalIncSpy).toHaveBeenCalledTimes(1);
    expect(eventsSentTotalIncSpy).toHaveBeenCalledWith({ event: eventName });
  });

  it('Tracks socket.compress', async () => {
    const socketIOTracker = new SocketIOPrometheusTracker(io);

    const eventsSentTotalIncSpy = jest.spyOn(
      socketIOTracker.metrics.eventsSentTotal,
      'inc',
    );

    io.on('connect', socket =>
      socket.compress(true).emit(eventName, eventPayload),
    );

    client = makeClient();

    await new Promise((r) => setTimeout(r, TEST_CASE_TIMEOUT_MS));

    expect(eventsSentTotalIncSpy).toHaveBeenCalledTimes(1);
    expect(eventsSentTotalIncSpy).toHaveBeenCalledWith({ event: eventName });
  });

  it('Tracks socket.emit', async () => {
    const socketIOTracker = new SocketIOPrometheusTracker(io);

    const eventsSentTotalIncSpy = jest.spyOn(
      socketIOTracker.metrics.eventsSentTotal,
      'inc',
    );

    io.on('connect', socket => socket.emit(eventName, eventPayload));

    client = makeClient();

    await new Promise((r) => setTimeout(r, TEST_CASE_TIMEOUT_MS));

    expect(eventsSentTotalIncSpy).toHaveBeenCalledTimes(1);
    expect(eventsSentTotalIncSpy).toHaveBeenCalledWith({ event: eventName });
  });

  it('Tracks socket.send', async () => {
    const socketIOTracker = new SocketIOPrometheusTracker(io);

    const eventsSentTotalIncSpy = jest.spyOn(
      socketIOTracker.metrics.eventsSentTotal,
      'inc',
    );

    io.on('connect', socket => socket.send(eventPayload));

    client = makeClient();

    await new Promise((r) => setTimeout(r, TEST_CASE_TIMEOUT_MS));

    expect(eventsSentTotalIncSpy).toHaveBeenCalledTimes(1);
    expect(eventsSentTotalIncSpy).toHaveBeenCalledWith({ event: 'message' });
  });

  it('Tracks socket.to', async () => {
    const socketIOTracker = new SocketIOPrometheusTracker(io);

    const eventsSentTotalIncSpy = jest.spyOn(
      socketIOTracker.metrics.eventsSentTotal,
      'inc',
    );

    io.on('connect', socket => socket.to('room').emit(eventName, eventPayload));

    client = makeClient();

    await new Promise((r) => setTimeout(r, TEST_CASE_TIMEOUT_MS));

    expect(eventsSentTotalIncSpy).toHaveBeenCalledTimes(1);
    expect(eventsSentTotalIncSpy).toHaveBeenCalledWith({ event: eventName });
  });

  it('Tracks socket.volatile', async () => {
    const socketIOTracker = new SocketIOPrometheusTracker(io);

    const eventsSentTotalIncSpy = jest.spyOn(
      socketIOTracker.metrics.eventsSentTotal,
      'inc',
    );

    io.on('connect', socket => socket.volatile.emit(eventName, eventPayload));

    client = makeClient();

    await new Promise((r) => setTimeout(r, TEST_CASE_TIMEOUT_MS));

    expect(eventsSentTotalIncSpy).toHaveBeenCalledTimes(1);
    expect(eventsSentTotalIncSpy).toHaveBeenCalledWith({ event: eventName });
  });

  it('Tracks socket.write', async () => {
    const socketIOTracker = new SocketIOPrometheusTracker(io);

    const eventsSentTotalIncSpy = jest.spyOn(
      socketIOTracker.metrics.eventsSentTotal,
      'inc',
    );

    io.on('connect', socket => socket.write(eventPayload));

    client = makeClient();

    await new Promise((r) => setTimeout(r, TEST_CASE_TIMEOUT_MS));

    expect(eventsSentTotalIncSpy).toHaveBeenCalledTimes(1);
    expect(eventsSentTotalIncSpy).toHaveBeenCalledWith({ event: 'message' });
  });

  it('Tracks io.compress', async () => {
    const socketIOTracker = new SocketIOPrometheusTracker(io);

    const eventsSentTotalIncSpy = jest.spyOn(
      socketIOTracker.metrics.eventsSentTotal,
      'inc',
    );

    io.on('connect', () => io.compress(true).emit(eventName, eventPayload));

    client = makeClient();

    await new Promise((r) => setTimeout(r, TEST_CASE_TIMEOUT_MS));

    expect(eventsSentTotalIncSpy).toHaveBeenCalledTimes(1);
    expect(eventsSentTotalIncSpy).toHaveBeenCalledWith({ event: eventName });
  });

  it('Tracks io.emit', async () => {
    const socketIOTracker = new SocketIOPrometheusTracker(io);

    const eventsSentTotalIncSpy = jest.spyOn(
      socketIOTracker.metrics.eventsSentTotal,
      'inc',
    );

    io.on('connect', () => io.emit(eventName, eventPayload));

    client = makeClient();

    await new Promise((r) => setTimeout(r, TEST_CASE_TIMEOUT_MS));

    expect(eventsSentTotalIncSpy).toHaveBeenCalledTimes(1);
    expect(eventsSentTotalIncSpy).toHaveBeenCalledWith({ event: eventName });
  });

  it('Tracks outbound emit to socket with acknowledge function', async () => {
    let acknowledged = false;

    const socketIOTracker = new SocketIOPrometheusTracker(io);

    const eventsSentTotalIncSpy = jest.spyOn(
      socketIOTracker.metrics.eventsSentTotal,
      'inc',
    );

    io.on('connect', (socket) => socket.emit(eventName, eventPayload, () => {
      acknowledged = true;
    }));

    client = makeClient();

    client.on(eventName, (data, ack) => {
      ack(data);
    });

    await new Promise((r) => setTimeout(r, TEST_CASE_TIMEOUT_MS));

    expect(acknowledged).toBe(true);
    expect(eventsSentTotalIncSpy).toHaveBeenCalledTimes(1);
    expect(eventsSentTotalIncSpy).toHaveBeenCalledWith({ event: eventName });
  });

  it('Tracks io.except', async () => {
    const socketIOTracker = new SocketIOPrometheusTracker(io);

    const eventsSentTotalIncSpy = jest.spyOn(
      socketIOTracker.metrics.eventsSentTotal,
      'inc',
    );

    io.on('connect', () => io.except('bla').emit(eventName, eventPayload));

    client = makeClient();

    await new Promise((r) => setTimeout(r, TEST_CASE_TIMEOUT_MS));

    expect(eventsSentTotalIncSpy).toHaveBeenCalledTimes(1);
    expect(eventsSentTotalIncSpy).toHaveBeenCalledWith({ event: eventName });
  });

  it('Tracks io.in', async () => {
    const socketIOTracker = new SocketIOPrometheusTracker(io);

    const eventsSentTotalIncSpy = jest.spyOn(
      socketIOTracker.metrics.eventsSentTotal,
      'inc',
    );

    io.on('connect', () => io.in('room').emit(eventName, eventPayload));

    client = makeClient();

    await new Promise((r) => setTimeout(r, TEST_CASE_TIMEOUT_MS));

    expect(eventsSentTotalIncSpy).toHaveBeenCalledTimes(1);
    expect(eventsSentTotalIncSpy).toHaveBeenCalledWith({ event: eventName });
  });

  it('Tracks io.send', async () => {
    const socketIOTracker = new SocketIOPrometheusTracker(io);

    const eventsSentTotalIncSpy = jest.spyOn(
      socketIOTracker.metrics.eventsSentTotal,
      'inc',
    );

    io.on('connect', () => io.send(eventPayload));

    client = makeClient();

    await new Promise((r) => setTimeout(r, TEST_CASE_TIMEOUT_MS));

    expect(eventsSentTotalIncSpy).toHaveBeenCalledTimes(1);
    expect(eventsSentTotalIncSpy).toHaveBeenCalledWith({ event: 'message' });
  });

  it('Tracks io.to', async () => {
    const socketIOTracker = new SocketIOPrometheusTracker(io);

    const eventsSentTotalIncSpy = jest.spyOn(
      socketIOTracker.metrics.eventsSentTotal,
      'inc',
    );

    io.on('connect', () => io.to('room').emit(eventName, eventPayload));

    client = makeClient();

    await new Promise((r) => setTimeout(r, TEST_CASE_TIMEOUT_MS));

    expect(eventsSentTotalIncSpy).toHaveBeenCalledTimes(1);
    expect(eventsSentTotalIncSpy).toHaveBeenCalledWith({ event: eventName });
  });

  it('Tracks io.write', async () => {
    const socketIOTracker = new SocketIOPrometheusTracker(io);

    const eventsSentTotalIncSpy = jest.spyOn(
      socketIOTracker.metrics.eventsSentTotal,
      'inc',
    );

    io.on('connect', () => io.write(eventPayload));

    client = makeClient();

    await new Promise((r) => setTimeout(r, TEST_CASE_TIMEOUT_MS));

    expect(eventsSentTotalIncSpy).toHaveBeenCalledTimes(1);
    expect(eventsSentTotalIncSpy).toHaveBeenCalledWith({ event: 'message' });
  });

  it('Tracks inbound message from client', async () => {
    const socketIOTracker = new SocketIOPrometheusTracker(io);

    const eventsReceivedTotalIncSpy = jest.spyOn(
      socketIOTracker.metrics.eventsReceivedTotal,
      'inc',
    );

    client = makeClient();

    client.on('connect', () => client.emit(eventName, eventPayload));

    await new Promise((r) => setTimeout(r, TEST_CASE_TIMEOUT_MS));

    expect(eventsReceivedTotalIncSpy).toHaveBeenCalledTimes(1);
    expect(eventsReceivedTotalIncSpy).toHaveBeenCalledWith({ event: eventName });
  });

  it('Tracks inbound message from client with acknowledge functions', async () => {
    let acknowledged = false;

    io.on('connect', (socket) => {
      socket.on(eventName, (data, ack) => {
        ack(data);
      });
    });

    const socketIOTracker = new SocketIOPrometheusTracker(io);

    const eventsReceivedTotalIncSpy = jest.spyOn(
      socketIOTracker.metrics.eventsReceivedTotal,
      'inc',
    );

    client = makeClient();

    client.on('connect', () => client.emit(eventName, eventPayload, () => {
      acknowledged = true;
    }));

    await new Promise((r) => setTimeout(r, TEST_CASE_TIMEOUT_MS));

    expect(acknowledged).toBe(true);
    expect(eventsReceivedTotalIncSpy).toHaveBeenCalledTimes(1);
    expect(eventsReceivedTotalIncSpy).toHaveBeenCalledWith({ event: eventName });
  });

  it('Tracks inbound message from client with socket id', async () => {
    let socketId;

    io.on('connect', (socket) => {
      socketId = socket.id;
    });

    const socketIOTracker = new SocketIOPrometheusTracker(io, { trackSocketId: true });

    const eventsReceivedTotalIncSpy = jest.spyOn(
      socketIOTracker.metrics.eventsReceivedTotal,
      'inc',
    );

    client = makeClient();

    client.on('connect', () => client.emit(eventName, eventPayload));

    await new Promise((r) => setTimeout(r, TEST_CASE_TIMEOUT_MS));

    expect(eventsReceivedTotalIncSpy).toHaveBeenCalledTimes(1);
    expect(eventsReceivedTotalIncSpy).toHaveBeenCalledWith({ event: eventName, socketid: socketId });
  });
});
