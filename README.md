# socket.io-prometheus-tracker

Track metrics for a Socket.IO server for use in Prometheus.

Library aims:
* Cover all expected Socket.IO events (including rooms and namespaces).
* Unopinionated implementation. Serve the metrics using whatever framework you want.

# Contents
1. [Intro](#socket.io-prometheus-tracker)
2. [Configuration](#configuration)
3. [Metrics](#metrics)
4. [Examples](#examples)
    - [Basic Use](#basic-use)
    - [Configuring Instances](#configuring-instances)
    - [Express Application](#express-application)
5. [Contributing](#contributing)
6. [Feedback and Support](#feedback-and-support)

## Configuration

When instantiating `SocketIOPrometheusTracker`, you can optionally pass a
configuration object. Available parameters are listed below:

Option | Default Value | Summary
:--- | :--- | :---
`collectDefaultMetrics` | `false` | Should the library also collect metrics recommended by Prometheus. Note that this will increase the number of exposed metrics beyond those listed in [Metrics](#metrics). See: https://github.com/siimon/prom-client#default-metrics for more details.
`trackSocketId` | `false` | Should a label be included for additionally tracking the socket id where appropriate. This may be useful for debugging, but does come at the cost of larger metric sizes. Events affected by this value are noted in [Metrics](#metrics).

## Metrics

Name | Labels | Summary
:--- | :--- | :---
`socketio_bytes_received_total` | `['event', 'socketid*']` | Total number of bytes received by the server.
`socketio_bytes_sent_total` | `['event']` | Total number of bytes sent by the server.
`socketio_connects_current` | `[]` | Current number of clients connected to the server.
`socketio_connects_length` | `['socketid*']` | The length in seconds of connections to the server.
`socketio_connects_total` | `[]` | Total number of connections that have been made to the server.
`socketio_disconnects_total` | `[]` | Total number of disconnections from the server.
`socketio_events_received_total` | `['event', 'socketid*']` | Total number of events received by the server.
`socketio_events_sent_total` | `['event']` | Total number of events sent by the server.

<sub>* Field `socketid` will only be included if configuration option `trackSocketId` is set to `true`.</sub>


## Examples

#### Basic Use

The tracker can be instantiated by passing an instance of a Socket.IO server.

```
const ioPrometheus = new SocketIOPrometheusTracker(io);
```

Metrics can then be accessed using: `ioPrometheus.register.metrics();`

#### Configuring Instances

```
const ioPrometheus = new SocketIOPrometheusTracker(io, {
  collectDefaultMetrics: true,
  trackSocketId: true,
});
```

#### Express Application

An example project using the library can be found in `./examples/express`.

## Contributing

While contributions are appreciated, they may be rejected if not in line with
the intended project direction. It's recommended to check before undertaking a
major piece of work and/or refactoring.

Contributions should be based off the `develop` branch, and any pull requests
made into `develop`.

## Feedback and Support

For suggestions, issues, and/or support raise a GitHub issue!
