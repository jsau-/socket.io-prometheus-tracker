import { Packet } from 'socket.io';

export interface SocketIOEventPacket {
  data?: Packet;
}
