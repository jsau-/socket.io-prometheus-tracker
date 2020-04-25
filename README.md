# socket.io-prometheus-tracker

Track metrics for a Socket.IO server for use in Prometheus.

# Contents
1. [Intro](#socket.io-prometheus-tracker)
2. [Examples](#examples)
    - [Basic Use](#basic-use)
    - [Configuration](#configuration)
    - [Collecting Default Metrics](#collecting-default-metrics)
3. [Metrics](#metrics)
3. [Contributing](#contributing)
4. [Feedback and Support ](#feedback-and-support)

## Examples

#### Basic Use

The tracker can be instantiated by passing an instance of a Socket.IO server.

```
const server = require('http').createServer();
const io = require('socket.io')(server);
const ioPrometheus = require('socket.io-prometheus-tracker)(io);
```

Metrics can then be accessed using: `ioPrometheus.register.metrics();`

#### Configuration

Option | Default Value | Summary
:--- | :--- | :---
`collectDefaultMetrics` | `false` | Should the library also collect metrics recommended by Prometheus. See: https://github.com/siimon/prom-client#default-metrics

## Metrics

Below are all the default metrics available as part of the library. Note that
this will be extended by additional fields if `collectDefaultMetrics` is
enabled.

Name | Labels | Summary
:--- | :--- | :---
`socketio_bytes_received_total` | `['event']` | Total number of bytes received by the server.
`socketio_bytes_sent_total` | `['event']` | Total number of bytes sent by the server.
`socketio_connects_current` | `[]` | Current number of clients connected to the server.
`socketio_connects_total` | `[]` | Total number of connections that have been made to the server.
`socketio_disconnects_total` | `[]` | Total number of disconnections from the server.
`socketio_connects_current` | `['event']` | Current number of clients connected to the server.
`socketio_events_received_total` | `['event']` | Total number of events received by the server.
`socketio_events_sent_total` | `['event']` | Total number of events sent by the server.

## Contributing

While contributions are appreciated, they may be rejected if not in line with
the intended project direction. It's recommended to check before undertaking a
major piece of work and/or refactoring.

Contributions should be based off the `develop` branch, and any pull requests
made into `develop`.

## Feedback and Support

For suggestions, issues, and/or support raise a GitHub issue!
