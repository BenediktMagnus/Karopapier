import type * as socketIoClient from "socket.io-client";
import ClientToServerEvents from '../shared/clientToServerEvents';
import ServerToClientEvents from '../shared/serverToClientEvents';

export type Socket = socketIoClient.Socket<ServerToClientEvents, ClientToServerEvents>;
