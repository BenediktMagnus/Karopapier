import * as EventFunctionDefinitions from '../../shared/eventFunctionDefinitions';
import * as TypedSocketIo from '../typedSocketIo';
import Database from '../database/database';
import Server from '../server';
import SessionManager from './sessionManager';
import User from './user';
import Utils from '../../utility/utils';
import Validation from '../../utility/validation';

export default class UserHandler
{
    private io: TypedSocketIo.Server;
    private database: Database;

    private sessionManager: SessionManager;

    private socketIdToUserMap: Map<string, User>;

    constructor (server: Server, database: Database)
    {
        this.io = server.socketIo;
        this.database = database;

        this.sessionManager = new SessionManager(database);

        this.socketIdToUserMap = new Map<string, User>();

        this.io.on('connection', this.onConnection.bind(this));
    }

    public getUserFromSocket (socket: TypedSocketIo.Socket): User|null
    {
        const user = this.socketIdToUserMap.get(socket.id);

        if (user === undefined)
        {
            return null;
        }

        return user;
    }

    /**
     * Load a user from the database into the socketIdToUser map.
     * @param userId The ID of the user to load.
     * @param socket The socket to associate the user with.
     * @returns The loaded user.
     */
    private loadUser (userId: number, sessionId: number, socket: TypedSocketIo.Socket): User
    {
        if (this.socketIdToUserMap.has(socket.id))
        {
            // Remove existing users for this socket.
            // This can theoretically be the case if a socket logs in as a user after he has chosen a map.
            // -> Catches weird behaviour or custom clients.
            this.socketIdToUserMap.delete(socket.id);
        }

        const userTable = this.database.getUser(userId);

        if (userTable === undefined)
        {
            throw new Error(`Could not load the user; no user found for ID "${userId}".`);
        }

        const ipAddress = this.sessionManager.getIpAddress(socket);

        const user: User = {
            ...userTable,
            socket: socket,
            ip: ipAddress,
            sessionId: sessionId,
        };

        this.socketIdToUserMap.set(socket.id, user);

        return user;
    }

    private onConnection (socket: TypedSocketIo.Socket): void
    {
        // We have to do three things here for every event:
        // 1. Bind the functions to prevent suprising changes of the meaning for "this".
        // 2. Inject the socket as a parameter for us to know which client/user called the event.
        // 3. Catch the promises of async functions if needed for the exceptions to not getting lost.

        socket.on('disconnect', this.onDisconnect.bind(this, socket));

        socket.on('login', Utils.catchVoidPromise(this.onLogin.bind(this, socket)));
        socket.on('authenticate', this.onAuthenticate.bind(this, socket));
    }

    private onDisconnect (socket: TypedSocketIo.Socket): void
    {
        // Remove the user from the user/socket list as soon as there is a disconnect:
        this.socketIdToUserMap.delete(socket.id);
    }

    /**
     * Login with user name and password.
     */
    private async onLogin (
        socket: TypedSocketIo.Socket,
        name: string,
        password: string,
        reply: EventFunctionDefinitions.LoginReply
    ): Promise<void>
    {
        if (!Validation.isNonEmptyString(name)
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
            this.loadUser(session.userId, session.id, socket);

            reply(true, session.id, session.token);
        }
    }

    /**
     * Authentication via session (ID and token).
     */
    private onAuthenticate (
        socket: TypedSocketIo.Socket,
        sessionId: number,
        sessionToken: string,
        reply: EventFunctionDefinitions.AuthenticateReply
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
            this.loadUser(session.userId, session.id, socket);

            reply(true);
        }
    }
}
