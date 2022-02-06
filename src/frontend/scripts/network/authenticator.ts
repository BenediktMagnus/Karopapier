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

    /**
     * Try to authenticate with stored session ID and token. If there are none or this fails, login as anonymous.
     */
    public async run (): Promise<void>
    {
        const sessionId = localStorage.getItem(sessionIdStorageKey);
        const sessionToken = localStorage.getItem(sessionTokenStorageKey);

        if ((sessionId !== null) && (sessionToken !== null))
        {
            await this.tryAuthentication(sessionId, sessionToken);
        }
        else
        {
            await this.loginAsAnonymous();
        }
    }

    private async tryAuthentication (sessionId: string, sessionToken: string): Promise<void>
    {
        const sessionIdAsNumber = Number.parseInt(sessionId);

        const authentication = new Promise<void>(
            (resolve, reject) =>
            {
                this.socket.emit(
                    'authenticate',
                    sessionIdAsNumber,
                    sessionToken,
                    (successful: boolean) =>
                    {
                        if (successful)
                        {
                            this._isLoggedIn = true;
                            resolve();
                        }
                        else
                        {
                            localStorage.removeItem(sessionIdStorageKey);
                            localStorage.removeItem(sessionTokenStorageKey);

                            reject(new Error('Authentication failed.'));
                        }
                    }
                );
            }
        );

        try
        {
            await authentication;
        }
        catch
        {
            await this.loginAsAnonymous();
        }
    }

    private async loginAsAnonymous (): Promise<void>
    {
        await this.login(Constants.anonymousUserName, '');
    }

    public async login (userName: string, password: string): Promise<void>
    {
        const login = new Promise<void>(
            (resolve, reject) =>
            {
                this.socket.emit(
                    'login',
                    userName,
                    password,
                    (successful: boolean, sessionId?: number, sessionToken?: string) =>
                    {
                        if ((!successful) || (sessionId === undefined) || (sessionToken === undefined))
                        {
                            reject(new Error(`Could not login as "${userName}".`));

                            return;
                        }

                        localStorage.setItem(sessionIdStorageKey, `${sessionId}`);
                        localStorage.setItem(sessionTokenStorageKey, sessionToken);

                        this._isLoggedIn = true;
                        resolve();
                    }
                );
            }
        );

        await login;
    }
}
