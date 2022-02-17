import express from 'express';
import http from 'http';
import * as promClient from 'prom-client';
import { Server } from 'socket.io';
import socketIOClient from 'socket.io-client';
import { SocketIOPrometheusTracker } from './SocketIOPrometheusTracker';

let app;
let server;
let io;
let socketIOTracker;
let client;
let eventsReceivedTotalIncSpy;
let eventsSentTotalIncSpy;

const eventName = 'event_name';
const eventPayload = { hello: 'world!' };
const port = 3001;

const TEST_CASE_TIMEOUT_MS = 250;

const makeClient = () => socketIOClient(`http://localhost:${port}`, {
  forceNew: true,
  reconnection: false,
  transports: ['websocket'],
});

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

    socketIOTracker = new SocketIOPrometheusTracker(io);

    eventsReceivedTotalIncSpy = jest.spyOn(
      socketIOTracker.metrics.eventsReceivedTotal,
      'inc',
    );

    eventsSentTotalIncSpy = jest.spyOn(
      socketIOTracker.metrics.eventsSentTotal,
      'inc',
    );

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
    io.on('connect', socket => socket.broadcast.emit(eventName, eventPayload));

    client = makeClient();

    await new Promise((r) => setTimeout(r, TEST_CASE_TIMEOUT_MS));

    expect(eventsSentTotalIncSpy).toHaveBeenCalledTimes(1);
    expect(eventsSentTotalIncSpy).toHaveBeenCalledWith({ event: eventName });
  });

  it('Tracks socket.compress', async () => {
    io.on('connect', socket =>
      socket.compress(true).emit(eventName, eventPayload),
    );

    client = makeClient();

    await new Promise((r) => setTimeout(r, TEST_CASE_TIMEOUT_MS));

    expect(eventsSentTotalIncSpy).toHaveBeenCalledTimes(1);
    expect(eventsSentTotalIncSpy).toHaveBeenCalledWith({ event: eventName });
  });

  it('Tracks socket.emit', async () => {
    io.on('connect', socket => socket.emit(eventName, eventPayload));

    client = makeClient();

    await new Promise((r) => setTimeout(r, TEST_CASE_TIMEOUT_MS));

    expect(eventsSentTotalIncSpy).toHaveBeenCalledTimes(1);
    expect(eventsSentTotalIncSpy).toHaveBeenCalledWith({ event: eventName });
  });

  it('Tracks socket.send', async () => {
    io.on('connect', socket => socket.send(eventPayload));

    client = makeClient();

    await new Promise((r) => setTimeout(r, TEST_CASE_TIMEOUT_MS));

    expect(eventsSentTotalIncSpy).toHaveBeenCalledTimes(1);
    expect(eventsSentTotalIncSpy).toHaveBeenCalledWith({ event: 'message' });
  });

  it('Tracks socket.to', async () => {
    io.on('connect', socket => socket.to('room').emit(eventName, eventPayload));

    client = makeClient();

    await new Promise((r) => setTimeout(r, TEST_CASE_TIMEOUT_MS));

    expect(eventsSentTotalIncSpy).toHaveBeenCalledTimes(1);
    expect(eventsSentTotalIncSpy).toHaveBeenCalledWith({ event: eventName });
  });

  it('Tracks socket.volatile', async () => {
    io.on('connect', socket => socket.volatile.emit(eventName, eventPayload));

    client = makeClient();

    await new Promise((r) => setTimeout(r, TEST_CASE_TIMEOUT_MS));

    expect(eventsSentTotalIncSpy).toHaveBeenCalledTimes(1);
    expect(eventsSentTotalIncSpy).toHaveBeenCalledWith({ event: eventName });
  });

  it('Tracks socket.write', async () => {
    io.on('connect', socket => socket.write(eventPayload));

    client = makeClient();

    await new Promise((r) => setTimeout(r, TEST_CASE_TIMEOUT_MS));

    expect(eventsSentTotalIncSpy).toHaveBeenCalledTimes(1);
    expect(eventsSentTotalIncSpy).toHaveBeenCalledWith({ event: 'message' });
  });

  it('Tracks io.compress', async () => {
    io.on('connect', () => io.compress(true).emit(eventName, eventPayload));

    client = makeClient();

    await new Promise((r) => setTimeout(r, TEST_CASE_TIMEOUT_MS));

    expect(eventsSentTotalIncSpy).toHaveBeenCalledTimes(1);
    expect(eventsSentTotalIncSpy).toHaveBeenCalledWith({ event: eventName });
  });

  it('Tracks io.emit', async () => {
    io.on('connect', () => io.emit(eventName, eventPayload));

    client = makeClient();

    await new Promise((r) => setTimeout(r, TEST_CASE_TIMEOUT_MS));

    expect(eventsSentTotalIncSpy).toHaveBeenCalledTimes(1);
    expect(eventsSentTotalIncSpy).toHaveBeenCalledWith({ event: eventName });
  });

  it('Tracks io.except', async () => {
    io.on('connect', () => io.except('bla').emit(eventName, eventPayload));

    client = makeClient();

    await new Promise((r) => setTimeout(r, TEST_CASE_TIMEOUT_MS));

    expect(eventsSentTotalIncSpy).toHaveBeenCalledTimes(1);
    expect(eventsSentTotalIncSpy).toHaveBeenCalledWith({ event: eventName });
  });

  it('Tracks io.in', async () => {
    io.on('connect', () => io.in('room').emit(eventName, eventPayload));

    client = makeClient();

    await new Promise((r) => setTimeout(r, TEST_CASE_TIMEOUT_MS));

    expect(eventsSentTotalIncSpy).toHaveBeenCalledTimes(1);
    expect(eventsSentTotalIncSpy).toHaveBeenCalledWith({ event: eventName });
  });

  it('Tracks io.send', async () => {
    io.on('connect', () => io.send(eventPayload));

    client = makeClient();

    await new Promise((r) => setTimeout(r, TEST_CASE_TIMEOUT_MS));

    expect(eventsSentTotalIncSpy).toHaveBeenCalledTimes(1);
    expect(eventsSentTotalIncSpy).toHaveBeenCalledWith({ event: 'message' });
  });

  it('Tracks io.to', async () => {
    io.on('connect', () => io.to('room').emit(eventName, eventPayload));

    client = makeClient();

    await new Promise((r) => setTimeout(r, TEST_CASE_TIMEOUT_MS));

    expect(eventsSentTotalIncSpy).toHaveBeenCalledTimes(1);
    expect(eventsSentTotalIncSpy).toHaveBeenCalledWith({ event: eventName });
  });

  it('Tracks io.write', async () => {
    io.on('connect', () => io.write(eventPayload));

    client = makeClient();

    await new Promise((r) => setTimeout(r, TEST_CASE_TIMEOUT_MS));

    expect(eventsSentTotalIncSpy).toHaveBeenCalledTimes(1);
    expect(eventsSentTotalIncSpy).toHaveBeenCalledWith({ event: 'message' });
  });

  it('Tracks inbound message from client', async () => {
    client = makeClient();

    client.on('connect', () => client.emit(eventName, eventPayload));

    await new Promise((r) => setTimeout(r, TEST_CASE_TIMEOUT_MS));

    expect(eventsReceivedTotalIncSpy).toHaveBeenCalledTimes(1);
    expect(eventsReceivedTotalIncSpy).toHaveBeenCalledWith({ event: eventName });
  });
});
