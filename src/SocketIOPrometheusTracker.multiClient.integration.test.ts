import express from 'express';
import http from 'http';
import * as promClient from 'prom-client';
import { Server } from 'socket.io';
import socketIOClient from 'socket.io-client';
import { SocketIOPrometheusTracker } from './SocketIOPrometheusTracker';
import { getByteSize } from './getByteSize';

let app;
let server;
let io;
let socketIOTracker;
let clientOne;
let clientTwo;
let bytesSentTotalIncSpy;
let eventsSentTotalIncSpy;

const eventName = 'event_name';
const eventPayload = { hello: 'world!' };
const port = 3002;

const TEST_CASE_TIMEOUT_MS = 250;

const makeClient = () => socketIOClient(`http://localhost:${port}`, {
  forceNew: true,
  reconnection: false,
  transports: ['websocket'],
});

describe('SocketIOPrometheusTracker (Mutli-Client)', () => {
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

    bytesSentTotalIncSpy = jest.spyOn(
      socketIOTracker.metrics.bytesSentTotal,
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
    if (clientOne) {
      clientOne.disconnect();
    }

    if (clientTwo) {
      clientTwo.disconnect();
    }

    server.close(() => {
      done();
    });
  });

  it('Tracks event sent to room with no members', async () => {
    const roomName = 'my-room';

    clientOne = makeClient();
    clientTwo = makeClient();

    await new Promise((r) => setTimeout(r, TEST_CASE_TIMEOUT_MS));

    io.to(roomName).emit(eventName, eventPayload);

    expect(bytesSentTotalIncSpy).toHaveBeenCalledTimes(1);
    expect(bytesSentTotalIncSpy).toHaveBeenCalledWith({ event: eventName }, getByteSize([eventPayload]));

    expect(eventsSentTotalIncSpy).toHaveBeenCalledTimes(1);
    expect(eventsSentTotalIncSpy).toHaveBeenCalledWith({ event: eventName });
  });

  it('Tracks event sent to room with single member using `to`', async () => {
    const roomName = 'my-room';

    io.on('connect', (socket) => {
      socket.on('join-room', () => {
        socket.join(roomName);
      });
    });

    clientOne = makeClient();
    clientTwo = makeClient();

    clientOne.on('connect', () => clientOne.emit('join-room'));

    await new Promise((r) => setTimeout(r, TEST_CASE_TIMEOUT_MS));

    io.to(roomName).emit(eventName, eventPayload);

    expect(bytesSentTotalIncSpy).toHaveBeenCalledTimes(1);
    expect(bytesSentTotalIncSpy).toHaveBeenCalledWith({ event: eventName }, getByteSize([eventPayload]));

    expect(eventsSentTotalIncSpy).toHaveBeenCalledTimes(1);
    expect(eventsSentTotalIncSpy).toHaveBeenCalledWith({ event: eventName });
  });

  it('Tracks event sent to room with single member using `in`', async () => {
    const roomName = 'my-room';

    io.on('connect', (socket) => {
      socket.on('join-room', () => {
        socket.join(roomName);
      });
    });

    clientOne = makeClient();
    clientTwo = makeClient();

    clientOne.on('connect', () => clientOne.emit('join-room'));

    await new Promise((r) => setTimeout(r, TEST_CASE_TIMEOUT_MS));

    io.in(roomName).emit(eventName, eventPayload);

    expect(bytesSentTotalIncSpy).toHaveBeenCalledTimes(1);
    expect(bytesSentTotalIncSpy).toHaveBeenCalledWith({ event: eventName }, getByteSize([eventPayload]));

    expect(eventsSentTotalIncSpy).toHaveBeenCalledTimes(1);
    expect(eventsSentTotalIncSpy).toHaveBeenCalledWith({ event: eventName });
  });

  it('Tracks event emitted directly to a client', async () => {
    io.on('connect', (socket) => {
      socket.on('reply', () => {
        socket.emit(eventName, eventPayload);
      });
    });

    clientOne = makeClient();
    clientTwo = makeClient();

    clientOne.on('connect', () => clientOne.emit('reply'));

    await new Promise((r) => setTimeout(r, TEST_CASE_TIMEOUT_MS));

    expect(bytesSentTotalIncSpy).toHaveBeenCalledTimes(1);
    expect(bytesSentTotalIncSpy).toHaveBeenCalledWith({ event: eventName }, getByteSize([eventPayload]));

    expect(eventsSentTotalIncSpy).toHaveBeenCalledTimes(1);
    expect(eventsSentTotalIncSpy).toHaveBeenCalledWith({ event: eventName });
  });
});
