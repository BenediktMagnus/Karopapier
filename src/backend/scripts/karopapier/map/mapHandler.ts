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

        // We have to do the following here:
        // 1. Bind the functions to prevent suprising changes of the meaning for "this".
        // 2. Catch the promises of async functions for the exceptions to not getting lost.
        // 3. Inject the user (get via socket) for us to know which user does the action.
    }

    protected onListMaps (mapId: number, reply: () => void): void
    {
    }

    protected onLoadMap (mapId: number, reply: () => void): void
    {

    }

    protected onSetMapEntry (userId: number, x: number, y: number, content: number): void
    {

    }
}
