import socketIo from 'socket.io';

export default class MapHandler
{
    protected io: socketIo.Server;

    constructor (io: socketIo.Server)
    {
        this.io = io;

        io.on('connection', (socket) => this.onConnection(socket));
    }

    protected onConnection (socket: socketIo.Socket): void
    {
        console.log('connected: ' + socket.id);
    }
}
