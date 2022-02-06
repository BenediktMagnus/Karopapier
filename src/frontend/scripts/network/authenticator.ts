import * as Constants from '../shared/constants';
import type * as TypedSocketIo from './typedSocketIo';

const sessionIdStorageKey = 'sessionId';
const sessionTokenStorageKey = 'sessionToken';

export default class Authenticator
{
    private readonly socket: TypedSocketIo.Socket;

    private _isLoggedIn: boolean;

    public get isLoggedIn (): boolean
    {
        return this._isLoggedIn;
    }

    constructor (socket: TypedSocketIo.Socket)
    {
        this._isLoggedIn = false;

        this.socket = socket;
    }

    public run (onAuthenticated: () => void): void
    {
        const sessionId = localStorage.getItem(sessionIdStorageKey);
        const sessionToken = localStorage.getItem(sessionTokenStorageKey);

        if ((sessionId !== null) && (sessionToken !== null))
        {
            this.tryAuthentication(sessionId, sessionToken, onAuthenticated);
        }
        else
        {
            this.login(onAuthenticated);
        }
    }

    private tryAuthentication (sessionId: string, sessionToken: string, onAuthenticated: () => void): void
    {
        const sessionIdAsNumber = Number.parseInt(sessionId);

        this.socket.emit(
            'authenticate',
            sessionIdAsNumber,
            sessionToken,
            (successful: boolean) =>
            {
                if (successful)
                {
                    this._isLoggedIn = true;
                    onAuthenticated();
                }
                else
                {
                    localStorage.removeItem(sessionIdStorageKey);
                    localStorage.removeItem(sessionTokenStorageKey);

                    this.login(onAuthenticated);
                }
            }
        );
    }

    private login (onAuthenticated: () => void): void
    {
        // TODO: Implement login with real credentials before login as anonymous.

        this.socket.emit(
            'login',
            Constants.anonymousUserName,
            '', // Anonymous' password is empty.
            (successful: boolean, sessionId?: number, sessionToken?: string) =>
            {
                if ((!successful) || (sessionId === undefined) || (sessionToken === undefined))
                {
                    throw Error('Could not login as Anonymous.');
                }

                localStorage.setItem(sessionIdStorageKey, `${sessionId}`);
                localStorage.setItem(sessionTokenStorageKey, sessionToken);

                this._isLoggedIn = true;
                onAuthenticated();
            }
        );
    }
}
