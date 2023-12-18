import express from 'express';
import * as PromClient from 'prom-client';
import { Server, Socket } from 'socket.io';
import socketIOClient from 'socket.io-client';
import { SocketIOPrometheusTracker } from 'socket.io-prometheus-tracker';

const app = express();
const http = require('http').Server(app);
const port = 3000;

const io = new Server(http, {
  cors: {
    origin: '*',
  },
});

const otherNamespaceName = '/other-namespace';
const otherNamespace = io.of(otherNamespaceName);

const ioPrometheus = new SocketIOPrometheusTracker(io, { collectDefaultMetrics: true });

const eventHandlers = (socket: Socket) => {
  socket.on('join-room', () => {
    socket.join('room');
  });

  socket.broadcast.emit('socket.broadcast', 'Hello, socket.broadcast!');
  socket.compress(true).emit('socket.compress', 'Hello, socket.compress!');
  socket.emit('socket.emit', 'Hello, socket.emit!');
  socket.send('Hello, socket.send!');
  socket.to('room').emit('socket.room', 'Hello, socket.to!');
  socket.volatile.emit('socket.volatile', 'Hello, socket.volatile!');

  io.compress(true).emit('io.compress', 'Hello, io.compress!');
  io.emit('io.emit', 'Hello, io.emit!');
  io.in('room').emit('io.in', 'Hello, io.in!');
  io.send('Hello, io.send!');
  io.to('room').emit('io.to', 'Hello, io.to!');
};

io.on('connect', eventHandlers);
otherNamespace.on('connect', eventHandlers);

/**
 * Expose metrics via API endpoint
 */
app.get('/metrics', async (req, res) => {
  const metrics = await ioPrometheus.register.metrics();
  return res.contentType('text/plain').send(metrics);
});

/**
 * Run API
 */
const server = http.listen(port, function() {
  console.log(`Server listening on *:${port}`);

  const clientOne = socketIOClient(`http://localhost:${port}`, {
    forceNew: true,
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 4000,
    reconnectionDelayMax: 5000,
  });

  clientOne.on('connect', () => {
    clientOne.emit('join-room');
    clientOne.emit('clientOne.emit', 'Hello, world!');
  });

  const clientTwo = socketIOClient(`http://localhost:${port}`, {
    forceNew: true,
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 4000,
    reconnectionDelayMax: 5000,
  });

  clientTwo.on('connect', () => {
    clientTwo.emit('clientTwo.emit', 'Hello, other world!');
    clientTwo.disconnect();
  });

  const clientOneOtherNamespace = socketIOClient(`http://localhost:${port}${otherNamespaceName}`, {
    forceNew: true,
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 4000,
    reconnectionDelayMax: 5000,
  });

  clientOneOtherNamespace.on('connect', clientOneOtherNamespace.disconnect);

  setInterval(() => {
    const immediateDisconnectClient = socketIOClient(`http://localhost:${port}`, {
      forceNew: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 4000,
      reconnectionDelayMax: 5000,
    });

    immediateDisconnectClient.on('connect', immediateDisconnectClient.disconnect);
  }, 500);
});
