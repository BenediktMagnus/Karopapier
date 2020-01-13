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

    protected socketIdToUserMap: Map<string, User>;

    constructor (server: Server, database: Database)
    {
        this.io = server.socketIo;
        this.database = database;

        this.sessionManager = new SessionManager(database);

        this.socketIdToUserMap = new Map<string, User>();

        this.io.on('connection', this.onConnection.bind(this));
    }

    public getUserFromSocket (socket: socketIo.Socket): User
    {
        let user = this.socketIdToUserMap.get(socket.id);

        if (user === undefined)
        {
            // If there can no user be found in the map, he has not logged in yet, so he becomes an anonymous user:
            user = this.loadUser(this.anonymousUserId, socket);
        }

        return user;
    }

    /**
     * Load a user from the database into the socketIdToUser map.
     * @param userId The ID of the user to load.
     * @param socket The socket to associate the user with.
     * @returns The loaded user.
     */
    protected loadUser (userId: number, socket: SocketIO.Socket): User
    {
        if (this.socketIdToUserMap.has(socket.id))
        {
            // Remove existing users for this socket.
            // This can theoretically be the case if a socket logs in as a user after he has chosen a map.
            // -> Catches weird behaviour or custom clients.
            this.socketIdToUserMap.delete(socket.id);
        }

        const userTable = this.database.getUser(userId);
        const ipAddress = this.sessionManager.getIpAddress(socket);

        const user: User = {
            ...userTable,
            socket: socket,
            ip: ipAddress,
        };

        this.socketIdToUserMap.set(socket.id, user);

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
        // Remove the user from the user/socket list as soon as there is a disconnect:
        this.socketIdToUserMap.delete(socket.id);
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
        if (!Validation.isNonEmptyString(name)
            || !Validation.isNonEmptyString(password)
            || !Validation.isCallable(reply))
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
            this.loadUser(session.userId, socket);

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
        if (!Validation.isValidId(sessionId)
            || !Validation.isNonEmptyString(sessionToken)
            || !Validation.isCallable(reply))
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
            this.loadUser(session.userId, socket);

            reply(true);
        }
    }
}
