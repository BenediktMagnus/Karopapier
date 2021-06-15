import socketIo from 'socket.io';
import { UserTable } from "../database/tables/userTable";

export default interface User extends UserTable
{
    socket: socketIo.Socket;
    sessionId: number;
    ip: string;
    selectedMapId?: number;
}
