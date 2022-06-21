import * as socketIo from 'socket.io';
import ClientToServerEvents from '../../shared/clientToServerEvents';
import ServerToClientEvents from '../../shared/serverToClientEvents';

export class Server extends socketIo.Server<ClientToServerEvents, ServerToClientEvents> {}
export class Socket extends socketIo.Socket<ClientToServerEvents, ServerToClientEvents> {}
