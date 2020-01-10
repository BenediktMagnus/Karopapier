import * as FunctionDefinitions from '../../shared/functionDefinitions';
import * as FunctionNames from '../../shared/functionNames';
import Database from '../database/database';
import Server from '../server';
import SessionManager from './sessionManager';
import socketIo from 'socket.io';
import User from './user';
import Utils from '../../utility/utils';
import Validation from '../../utility/validation';

export default class UserHandler
{
    public readonly anonymousUserId = 0;

    protected io: socketIo.Server;
    protected database: Database;

    protected sessionManager: SessionManager;

    protected socketIdToUserIdMap: Map<string, number>;

    constructor (server: Server, database: Database)
    {
        this.io = server.socketIo;
        this.database = database;

        this.sessionManager = new SessionManager(database);

        this.socketIdToUserIdMap = new Map<string, number>();

        this.io.on('connection', this.onConnection.bind(this));
    }

    public getUserFromSocket (socket: socketIo.Socket): User
    {
        let userId = this.socketIdToUserIdMap.get(socket.id);

        if (userId === undefined)
        {
            userId = this.anonymousUserId;
        }

        const userTable = this.database.getUser(userId);

        const user: User = {
            ...userTable,
            socket: socket
        };

        return user;
    }

    protected onConnection (socket: socketIo.Socket): void
    {
        // We have to do three things here for every event:
        // 1. Bind the functions to prevent suprising changes of the meaning for "this".
        // 2. Inject the socket as a parameter for us to know which client/user called the event.
        // 3. Catch the promises of async functions if needed for the exceptions to not getting lost.

        socket.on('disconnect', this.onDisconnect.bind(this, socket));

        socket.on(FunctionNames.login, Utils.catchVoidPromise(this.onLogin.bind(this, socket)));
        socket.on(FunctionNames.authenticate, this.onAuthenticate.bind(this, socket));
    }

    protected onDisconnect (socket: socketIo.Socket): void
    {
        // Remove the socket from the user list as soon as there is a disconnect:
        this.socketIdToUserIdMap.delete(socket.id);
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
        if (!Validation.isNonEmptyString(name) || !Validation.isNonEmptyString(password))
        {
            return;
        }

        const session = await this.sessionManager.login(name, password);

        if (session === null)
        {
            reply(false);
        }
        else
        {
            this.socketIdToUserIdMap.set(socket.id, session.userId);

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
        if (!Validation.isValidId(sessionId) || !Validation.isNonEmptyString(sessionToken))
        {
            return;
        }

        const session = this.sessionManager.authenticate(sessionId, sessionToken);

        if (session === null)
        {
            reply(false);
        }
        else
        {
            this.socketIdToUserIdMap.set(socket.id, session.userId);

            reply(true);
        }
    }
}
