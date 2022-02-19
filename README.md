# socket.io-prometheus-tracker

[![npm version](https://img.shields.io/npm/v/socket.io-prometheus-tracker.svg)](https://www.npmjs.com/package/socket.io-prometheus-tracker)
[![build status](https://github.com/jsau-/socket.io-prometheus-tracker/actions/workflows/ci.yml/badge.svg?branch=master)](https://github.com/jsau-/socket.io-prometheus-tracker/actions/workflows/ci.yml)
[![npm downloads](https://img.shields.io/npm/dm/socket.io-prometheus-tracker.svg)](https://www.npmjs.com/package/socket.io-prometheus-tracker)

Track metrics for a Socket.IO server for use in Prometheus.

***Note that by its nature this library relies on monkey-patching the
`socket.io` server instance to hook into functions like `socket.emit`. Bear
this in mind if you're applying any monkey-patches of your own, and please read
the source code to ensure compatibility.***

Library aims:
* Cover all Socket.IO events in the default namespace, sent or received.
* _Just track metrics_. You can do what you want with them - serve via `express`, periodically write to a file, whatever.

Useful links:
* [Documentation](https://jsau-.github.io/socket.io-prometheus-tracker)
* [Code Coverage Report](https://jsau-.github.io/socket.io-prometheus-tracker/coverage/lcov-report)
* [Unit Test Report](https://jsau-.github.io/socket.io-prometheus-tracker/coverage/test_report.html)

# Contents
1. [Intro](#socket.io-prometheus-tracker)
2. [Configuration](#configuration)
3. [Metrics](#metrics)
4. [Examples](#examples)
    - [Basic Use](#basic-use)
    - [Configuring Instances](#configuring-instances)
    - [Express Application](#express-application)
5. [Contributing](#contributing)
    - [Useful Snippets](#useful-snippets)
6. [Feedback and Support](#feedback-and-support)

## Configuration

When instantiating `SocketIOPrometheusTracker`, you can optionally pass a
configuration object. Available parameters are listed below:

Option | Default Value | Summary
:--- | :--- | :---
`collectDefaultMetrics` | `false` | Should the library also collect metrics recommended by Prometheus. Note that this will increase the number of exposed metrics beyond those listed in [Metrics](#metrics). See: https://github.com/siimon/prom-client#default-metrics for more details.
`prometheusClient` | undefined | An instance of `prom-client` the library uses to determine the registry for storing metrics. If not provided, the default registry will be used.
`trackSocketId` | `false` | Should a label be included for additionally tracking the socket id where appropriate. This may be useful for debugging, but is **not** recommended for use in production. This will lead to the size of the registry growing indefinitely over time. Events affected by this value are noted in [Metrics](#metrics).

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

## Things to be aware of

### Namespaces

Events emitted outbound via the `Server` instance should be tracked
successfully regardless of the namespace used. Events emitted outbound
via a `Socket` instance are currently only tracked in the default
namespace.

The library exports all functions used, so feel free to setup hooks
against any custom namespaces you want on top of the default behavior.

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

Pull requests should include a corresponding entry in `CHANGELOG.md`.

#### Useful Snippets

```
// Install dependencies
npm ci

// Run tests
npm run lint
npm run test

// Build the library
npm run build
```

## Feedback and Support

For suggestions, issues, and/or support raise a GitHub issue!
