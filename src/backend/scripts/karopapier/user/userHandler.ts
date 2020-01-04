import * as FunctionDefinitions from '../../shared/functionDefinitions';
import * as FunctionNames from '../../shared/functionNames';
import Database from '../database/database';
import SessionManager from './sessionManager';
import socketIo from 'socket.io';
import Utils from '../../utility/utils';

export default class UserHandler
{
    protected io: socketIo.Server;
    protected database: Database;

    protected sessionManager: SessionManager;

    protected socketIdToUserMap: Map<string, number>;

    constructor (io: socketIo.Server, database: Database)
    {
        this.io = io;
        this.database = database;

        this.sessionManager = new SessionManager(database);

        this.socketIdToUserMap = new Map<string, number>();

        io.on('connection', this.onConnection.bind(this));
    }

    protected onConnection (socket: socketIo.Socket): void
    {
        // We have to do three things here for every event:
        // 1. Bind the functions to prevent suprising changes of the meaning for "this".
        // 2. Catch the promises of async functions for the exceptions to not getting lost.
        // 3. Inject the socket as a parameter for us to know which client/user called the event.

        socket.on(FunctionNames.login, Utils.catchVoidPromise(this.onLogin.bind(this, socket)));
        socket.on(FunctionNames.authenticate, this.onAuthenticate.bind(this, socket));
    }

    /**
     * Login with user name and password.
     */
    protected async onLogin (
        socket: socketIo.Socket,
        name: string,
        password: string,
        reply: FunctionDefinitions.LoginResponseFunction
    ): Promise<void>
    {
        const session = await this.sessionManager.login(name, password);

        if (session === null)
        {
            reply(false);
        }
        else
        {
            this.socketIdToUserMap.set(socket.id, session.userId);

            reply(true, session.id, session.token);
        }
    }

    /**
     * Authentication via session (ID and token).
     */
    protected onAuthenticate (
        socket: socketIo.Socket,
        sessionId: number,
        sessionToken: string,
        reply: FunctionDefinitions.AuthenticateResponseFunction
    ): void
    {
        const session = this.sessionManager.authenticate(sessionId, sessionToken);

        if (session === null)
        {
            reply(false);
        }
        else
        {
            this.socketIdToUserMap.set(socket.id, session.userId);

            reply(true);
        }
    }
}
