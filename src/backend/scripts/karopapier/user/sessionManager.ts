import * as bcrypt from 'bcrypt';
import * as Constants from '../../../../shared/scripts/constants';
import Database from '../database/database';
import socketIo from 'socket.io';
import Utils from '../../../../shared/scripts/utils';

const min32BitInt = 1 << 30;
const max32BitInt = 2 ** 32;

const secondsBeforeASessionExpires = 60 * 60 * 24 * 7 * 52;

interface Session
{
    id: number;
    userId: number;
    token: string;
}

export default class SessionManager
{
    private database: Database;

    private counter = 0;

    constructor (database: Database)
    {
        this.database = database;
    }

    /**
     * Get a random number that is exactly 32 bit long. \
     * For example, a 4 bit long number must be between (including) 1000 and 1111. \
     * NOTE: This could be replaced with String.padStart().
     */
    private getRandom32BitInt (): number
    {
        let result = Math.random() * (max32BitInt - min32BitInt) + min32BitInt;
        result = Math.floor(result);

        return result;
    }

    private generateSessionToken (): string
    {
        this.counter++;

        let randomString = '';
        for (let i = 0; i < 4; i++) // 4 times 32 bit are 128 bit of randomness.
        {
            const randomInt = this.getRandom32BitInt();
            const randomIntAsString = randomInt.toString(32);

            randomString += randomIntAsString;
        }

        const unixTimeInMilliseconds = new Date().getTime();

        const sessionToken = unixTimeInMilliseconds.toString(32) + '-' + randomString + '-' + this.counter.toString(32);

        return sessionToken;
    }

    private sessionIsExpired (lastAccess: number): boolean
    {
        const currentTime = Utils.getCurrentUnixTime();

        const timeSinceLastAccess = currentTime - lastAccess;

        const isExpired = timeSinceLastAccess > secondsBeforeASessionExpires;

        return isExpired;
    }

    /**
     * Register a new user with name and password, creating a session.
     * @param name The user name to register.
     * @param password The user's plain text password.
     * @param isAdmin Whether the user shall get admin priviliges.
     */
    public async register (name: string, password: string, isAdmin: boolean): Promise<Session|null>
    {
        const passwordHash = await bcrypt.hash(password, 10);

        const userInsert = {
            name: name,
            passwordHash: passwordHash,
            isAdmin: isAdmin,
        };

        const user = this.database.insertUser(userInsert);

        const token = this.generateSessionToken();

        const sessionInsert = {
            userId: user.id,
            token: token,
        };

        const session: Session = this.database.insertSession(sessionInsert);

        return session;
    }

    /**
     * Log in a user with name and password, creating a new session.
     * @param name The user name to log in.
     * @param password The user's plain text password.
     */
    public async login (name: string, password: string): Promise<Session|null>
    {
        const user = this.database.getUserByName(name);

        if (user === undefined)
        {
            return null;
        }

        const passwordIsCorrect = (name == Constants.anonymousUserName) || await bcrypt.compare(password, user.passwordHash);

        if (!passwordIsCorrect)
        {
            return null;
        }

        const token = this.generateSessionToken();

        const sessionInsert = {
            userId: user.id,
            token: token,
        };

        const session: Session = this.database.insertSession(sessionInsert);

        return session;
    }

    /**
     * Authenticate a user with session ID and token.
     * @param sessionId The ID of the session.
     * @param sessionToken The session token in plain text.
     */
    public authenticate (sessionId: number, sessionToken: string): Session|null
    {
        const session = this.database.getSession(sessionId);

        if (session === undefined)
        {
            return null;
        }

        if (this.sessionIsExpired(session.lastAccess))
        {
            this.database.deleteSession(sessionId);

            return null;
        }

        if (session.token === sessionToken)
        {
            return session;
        }
        else
        {
            return null;
        }
    }

    /**
     * Get the current IP of the socket connection. \
     * This takes possible (reverse) proxies that set an x-forwarded-for header into account and returns the IP they mention in the header.
     * @param socket The socket to get the IP from.
     * @returns The socket's IP.
     */
    public getIpAddress (socket: socketIo.Socket): string
    {
        let ipAddress: string;

        // The headers typings are incomplete. 'x-forwarded-for' is always a string or undefined and never a string array:
        const xForwardedForHeader = socket.handshake.headers['x-forwarded-for'] as string|undefined;

        if (xForwardedForHeader != undefined)
        {
            const ipAddresses = xForwardedForHeader.split(',');
            ipAddress = ipAddresses[0].trim();
        }
        else if (socket.request.socket.remoteAddress != undefined)
        {
            ipAddress = socket.request.socket.remoteAddress;
        }
        else
        {
            throw new Error("Could not identify the client's IP address.");
        }

        return ipAddress;
    }
}
