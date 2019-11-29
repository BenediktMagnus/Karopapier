import SocketFunctions from '../shared/socketFunctions';
import socketIo from 'socket.io';

export default class UserHandler
{
    protected io: socketIo.Server;

    constructor (io: socketIo.Server)
    {
        this.io = io;

        io.on('connection', this.onConnection.bind(this));
    }

    protected onConnection (socket: socketIo.Socket): void
    {
        console.log('socket: ' + socket.id);

        socket.on(SocketFunctions.login, this.onLogin.bind(this, socket));
    }

    protected onLogin (socket: socketIo.Socket, name: string, password: string): void
    {
        console.log(name + ': "' + password + '" - ' + socket.id);
    }
}
