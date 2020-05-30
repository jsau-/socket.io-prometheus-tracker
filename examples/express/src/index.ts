import express, { Request, Response, NextFunction } from 'express';
import socketIO from 'socket.io';
import socketIOClient from 'socket.io-client';
import SocketIOPrometheusTracker from 'socket.io-prometheus-tracker';

const app = express();
const http = require('http').Server(app);
const port = 3000;

const io = socketIO(http);
const ioPrometheus = new SocketIOPrometheusTracker(io, { collectDefaultMetrics: true, trackSocketId: true });

io.on('connect', socket => {
  socket.emit('socket.emit', 'Hello, socket.emit!');
  socket.broadcast.emit('socket.binary', 'Hello, socket.broadcast!');
  socket.compress(true).emit('socket.compress', 'Hello, socket.compress!');
  socket.to('room').emit('socket.room', 'Hello, socket.to!');

  io.emit('io.emit', 'Hello, io.emit!');
  io.in('room').emit('io.in', 'Hello, io.in!');
  io.of('/bar').emit('io.of', 'Hello, io.of!');
  io.to('room').emit('io.to', 'Hello, io.to!');
});

/**
 * Expose metrics via API endpoint
 */
app.get('/metrics', (req, res) => {
  const metrics = ioPrometheus.register.metrics();
  return res.send(metrics);
});

/**
 * Run API
 */
const server = http.listen(port, function() {
  console.log(`Server listening on *:${port}`);

  /**
   * Setup dummy client
   */
  const client = socketIOClient(`http://localhost:${port}`, {
    forceNew: true,
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 4000,
    reconnectionDelayMax: 5000,
  });

  client.on('connect', () => {
    client.emit('client.emit', 'Hello, world!');
  });
});
