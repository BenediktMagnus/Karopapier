import * as TypedSocketIo from '../typedSocketIo';
import { UserTable } from "../database/tables/userTable";

export default interface User extends UserTable
{
    socket: TypedSocketIo.Socket;
    sessionId: number;
    ip: string;
    selectedMapId?: number;
}
