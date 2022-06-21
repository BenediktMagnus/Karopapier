import * as socketIo from 'socket.io';
import ClientToServerEvents from '../../../shared/scripts/clientToServerEvents';
import ServerToClientEvents from '../../../shared/scripts//serverToClientEvents';

export class Server extends socketIo.Server<ClientToServerEvents, ServerToClientEvents> {}
export class Socket extends socketIo.Socket<ClientToServerEvents, ServerToClientEvents> {}
