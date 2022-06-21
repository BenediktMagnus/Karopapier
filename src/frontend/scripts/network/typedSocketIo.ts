import type * as socketIoClient from 'socket.io-client';
import ClientToServerEvents from '../../../shared/scripts/clientToServerEvents';
import ServerToClientEvents from '../../../shared/scripts/serverToClientEvents';

export type Socket = socketIoClient.Socket<ServerToClientEvents, ClientToServerEvents>;
