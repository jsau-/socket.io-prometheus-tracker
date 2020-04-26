import express, { Request, Response, NextFunction } from 'express';
import socketIO from 'socket.io';
import socketIOClient from 'socket.io-client';
import SocketIOPrometheusTracker from 'socket.io-prometheus-tracker';

const app = express();
const http = require('http').Server(app);
const io = socketIO(http);
const ioPrometheus = new SocketIOPrometheusTracker(io);

/**
 * Setup some dummy io emits
 */
setInterval(() => io.of('of').emit('io.of.emit', 'Hello, world!'), 5000);
setInterval(() => io.in('in').emit('io.in.emit', 'Hello, world!'), 5000);
setInterval(() => io.local.emit('io.local.emit', 'Hello, world!'), 5000);
setInterval(() => io.to('to').emit('io.to.emit', 'Hello, world!'), 5000);
setInterval(() => io.emit('io.emit', 'Hello, world!'), 5000);

io.on('connect', socket => {
  /**
   * Setup some dummy socket emits
   */
  setInterval(() => {
    socket.broadcast.emit('socket.broadcast.emit', 'Hello, world!');
    socket.compress(false).emit('socket.compress.emit', 'Hello, world!');
    socket.to('to').emit('socket.to.emit', 'Hello, world!');
    socket.volatile.emit('socket.volatile.emit', 'Hello, world!');
    socket.emit('socket.emit', 'Hello, world!');
  }, 5000);
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
const server = http.listen(3000, function() {
  console.log('listening on *:3000');

  /**
   * Setup dummy client
   */
  const client = socketIOClient('http://localhost:3000', {
    forceNew: true,
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 4000,
    reconnectionDelayMax: 5000,
  });

  client.on('connect', () => {
    console.log('Websocket client connected');
    setInterval(() => client.emit('client.emit', 'Hello, world!'), 3000);
    setTimeout(() => client.disconnect(), 5000);
  });

  client.on('disconnect', () => {
    console.log('Websocket client disconnected');
    setTimeout(() => client.connect(), 5000);
  });
});
