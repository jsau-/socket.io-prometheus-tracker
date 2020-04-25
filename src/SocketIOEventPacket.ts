import { Packet } from 'socket.io';

/**
 * @fileoverview Format of parameter to socket.onevent method.
 */
export interface SocketIOEventPacket {
  data?: Packet;
}
