import * as bcrypt from 'bcrypt';
import Database from '../database/database';
import socketIo from 'socket.io';
import Utils from '../../utility/utils';

const min32BitInt = 1 << 30;
const max32BitInt = 2 ** 32;

const secondsBeforeASessionExpires = 2419200; // 4 weeks

interface Session
{
    id: number;
    userId: number;
    token: string;
}

export default class SessionManager
{
    protected database: Database;

    protected counter = 0;

    constructor (database: Database)
    {
        this.database = database;
    }

    /**
     * Get a random number that is exactly 32 bit long. \
     * For example, a 4 bit long number must be between (including) 1000 and 1111. \
     * NOTE: This could be replaced with String.padStart().
     */
    protected getRandom32BitInt (): number
    {
        let result = Math.random() * (max32BitInt - min32BitInt) + min32BitInt;
        result = Math.floor(result);

        return result;
    }

    protected generateSessionToken (): string
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

    protected getIpAddress (socket: socketIo.Socket): string
    {
        let ipAddress: string;

        const xForwardedForHeader: string|undefined = socket.handshake.headers['x-forwarded-for'];

        if (xForwardedForHeader)
        {
            const ipAddresses = xForwardedForHeader.split(',');
            ipAddress = ipAddresses[0].trim();
        }
        else
        {
            ipAddress = socket.request.connection.remoteAddress;
        }

        return ipAddress;
    }

    protected sessionIsExpired (lastAccess: number): boolean
    {
        const currentTime = Utils.getCurrentUnixTime();

        const timeSinceLastAccess = currentTime - lastAccess;

        const isExpired = timeSinceLastAccess > secondsBeforeASessionExpires;

        return isExpired;
    }

    /**
     * Log in a user with name and password, generating a new token.
     * @param name The user name to log in.
     * @param password The user's plain text password.
     */
    public async login (name: string, password: string): Promise<Session|null>
    {
        const user = this.database.getUserByName(name); // FIXME: Handle the case that the user name does not exist.

        const passwordIsCorrect = await bcrypt.compare(password, user.passwordHash);

        if (!passwordIsCorrect)
        {
            return null;
        }

        const token = this.generateSessionToken();

        const session: Session = this.database.insertSession(user.id, token);

        return session;
    }

    /**
     * Authenticate a user with session ID and token.
     * @param sessionId The ID of the session.
     * @param sessionToken The session token in plain text.
     */
    public authenticate (sessionId: number, sessionToken: string): Session|null
    {
        const session = this.database.getSession(sessionId); // FIXME: Handle the case that the session ID does not exist.

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
}
