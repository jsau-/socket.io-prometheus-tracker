import express from 'express';
import http from 'http';
import * as promClient from 'prom-client';
import socketIO from 'socket.io';
import socketIOClient from 'socket.io-client';
import { SocketIOTracker } from './SocketIOTracker';

let app;
let server;
let io;
let socketIOTracker;
let client;
let eventsSentTotalIncSpy;

const eventName = 'event_name';
const eventPayload = { hello: 'world!' };
const port = 3001;

describe('SocketIOTracker', () => {
  beforeEach(done => {
    promClient.register.clear();

    app = express();
    server = new http.Server(app);
    io = socketIO(server);

    socketIOTracker = new SocketIOTracker(io);

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

  it('Tracks socket.broadcast', done => {
    io.on('connect', socket => socket.broadcast.emit(eventName, eventPayload));

    client = socketIOClient(`http://localhost:${port}`, {
      forceNew: true,
      reconnection: false,
      transports: ['websocket'],
    });

    setTimeout(() => {
      expect(eventsSentTotalIncSpy).toHaveBeenCalledTimes(1);
      expect(eventsSentTotalIncSpy).toHaveBeenCalledWith({ event: eventName });
      done();
    }, 100);
  });

  it('Tracks socket.compress', done => {
    io.on('connect', socket =>
      socket.compress(true).emit(eventName, eventPayload),
    );

    client = socketIOClient(`http://localhost:${port}`, {
      forceNew: true,
      reconnection: false,
      transports: ['websocket'],
    });

    setTimeout(() => {
      expect(eventsSentTotalIncSpy).toHaveBeenCalledTimes(1);
      expect(eventsSentTotalIncSpy).toHaveBeenCalledWith({ event: eventName });
      done();
    }, 100);
  });

  it('Tracks socket.emit', done => {
    io.on('connect', socket => socket.emit(eventName, eventPayload));

    client = socketIOClient(`http://localhost:${port}`, {
      forceNew: true,
      reconnection: false,
      transports: ['websocket'],
    });

    setTimeout(() => {
      expect(eventsSentTotalIncSpy).toHaveBeenCalledTimes(1);
      expect(eventsSentTotalIncSpy).toHaveBeenCalledWith({ event: eventName });
      done();
    }, 100);
  });

  it('Tracks socket.send', done => {
    io.on('connect', socket => socket.send(eventPayload));

    client = socketIOClient(`http://localhost:${port}`, {
      forceNew: true,
      reconnection: false,
      transports: ['websocket'],
    });

    setTimeout(() => {
      expect(eventsSentTotalIncSpy).toHaveBeenCalledTimes(1);
      expect(eventsSentTotalIncSpy).toHaveBeenCalledWith({ event: 'message' });
      done();
    }, 100);
  });

  it('Tracks socket.to', done => {
    io.on('connect', socket => socket.to('room').emit(eventName, eventPayload));

    client = socketIOClient(`http://localhost:${port}`, {
      forceNew: true,
      reconnection: false,
      transports: ['websocket'],
    });

    setTimeout(() => {
      expect(eventsSentTotalIncSpy).toHaveBeenCalledTimes(1);
      expect(eventsSentTotalIncSpy).toHaveBeenCalledWith({ event: eventName });
      done();
    }, 100);
  });

  it('Tracks socket.volatile', done => {
    io.on('connect', socket => socket.volatile.emit(eventName, eventPayload));

    client = socketIOClient(`http://localhost:${port}`, {
      forceNew: true,
      reconnection: false,
      transports: ['websocket'],
    });

    setTimeout(() => {
      expect(eventsSentTotalIncSpy).toHaveBeenCalledTimes(1);
      expect(eventsSentTotalIncSpy).toHaveBeenCalledWith({ event: eventName });
      done();
    }, 100);
  });

  it('Tracks io.compress', done => {
    io.on('connect', () => io.compress(true).emit(eventName, eventPayload));

    client = socketIOClient(`http://localhost:${port}`, {
      forceNew: true,
      reconnection: false,
      transports: ['websocket'],
    });

    setTimeout(() => {
      expect(eventsSentTotalIncSpy).toHaveBeenCalledTimes(1);
      expect(eventsSentTotalIncSpy).toHaveBeenCalledWith({ event: eventName });
      done();
    }, 100);
  });

  it('Tracks io.emit', done => {
    io.on('connect', () => io.emit(eventName, eventPayload));

    client = socketIOClient(`http://localhost:${port}`, {
      forceNew: true,
      reconnection: false,
      transports: ['websocket'],
    });

    setTimeout(() => {
      expect(eventsSentTotalIncSpy).toHaveBeenCalledTimes(1);
      expect(eventsSentTotalIncSpy).toHaveBeenCalledWith({ event: eventName });
      done();
    }, 100);
  });

  it('Tracks io.in', done => {
    io.on('connect', () => io.in('room').emit(eventName, eventPayload));

    client = socketIOClient(`http://localhost:${port}`, {
      forceNew: true,
      reconnection: false,
      transports: ['websocket'],
    });

    setTimeout(() => {
      expect(eventsSentTotalIncSpy).toHaveBeenCalledTimes(1);
      expect(eventsSentTotalIncSpy).toHaveBeenCalledWith({ event: eventName });
      done();
    }, 100);
  });

  it('Tracks io.local', done => {
    io.on('connect', () => io.local.emit(eventName, eventPayload));

    client = socketIOClient(`http://localhost:${port}`, {
      forceNew: true,
      reconnection: false,
      transports: ['websocket'],
    });

    setTimeout(() => {
      expect(eventsSentTotalIncSpy).toHaveBeenCalledTimes(1);
      expect(eventsSentTotalIncSpy).toHaveBeenCalledWith({ event: eventName });
      done();
    }, 100);
  });

  it('Tracks io.of', done => {
    io.on('connect', () => io.of('/namespace').emit(eventName, eventPayload));

    client = socketIOClient(`http://localhost:${port}`, {
      forceNew: true,
      reconnection: false,
      transports: ['websocket'],
    });

    setTimeout(() => {
      expect(eventsSentTotalIncSpy).toHaveBeenCalledTimes(1);
      expect(eventsSentTotalIncSpy).toHaveBeenCalledWith({ event: eventName });
      done();
    }, 100);
  });

  it('Tracks io.send', done => {
    io.on('connect', () => io.send(eventPayload));

    client = socketIOClient(`http://localhost:${port}`, {
      forceNew: true,
      reconnection: false,
      transports: ['websocket'],
    });

    setTimeout(() => {
      expect(eventsSentTotalIncSpy).toHaveBeenCalledTimes(1);
      expect(eventsSentTotalIncSpy).toHaveBeenCalledWith({ event: 'message' });
      done();
    }, 100);
  });

  it('Tracks io.to', done => {
    io.on('connect', () => io.to('room').emit(eventName, eventPayload));

    client = socketIOClient(`http://localhost:${port}`, {
      forceNew: true,
      reconnection: false,
      transports: ['websocket'],
    });

    setTimeout(() => {
      expect(eventsSentTotalIncSpy).toHaveBeenCalledTimes(1);
      expect(eventsSentTotalIncSpy).toHaveBeenCalledWith({ event: eventName });
      done();
    }, 100);
  });
});
