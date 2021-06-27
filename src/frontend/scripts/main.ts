import * as Constants from "./shared/constants";
import type * as TypedSocketIo from "./typedSocketIo";
// FIXME: This is not correct. "import type" should not be needed according to the documentation. What is wrong?
import type { io } from "socket.io-client";
import Palette from "./elements/palette/palette";
import Paper from "./elements/paper/paper";
import UserCountController from "./elements/userCountController";

const sessionIdStorageKey = 'sessionId';
const sessionTokenStorageKey = 'sessionToken';

class Main
{
    private readonly socket: TypedSocketIo.Socket;

    private mapPublicIdentifier: string;
    private paper?: Paper;
    private palette?: Palette;
    private userCountController?: UserCountController;

    private isLoggedIn: boolean;

    constructor ()
    {
        this.isLoggedIn = false;

        // Get the map from the URL query string:
        const urlParameters = new URLSearchParams(window.location.search);
        this.mapPublicIdentifier = urlParameters.get('map') ?? '';

        // DOM events:
        document.addEventListener('DOMContentLoaded', this.onDocumentLoaded.bind(this), false);

        // @ts-expect-error Error expected because of the import type hack.
        this.socket = io();

        // Socket.io events:
        this.socket.on('connect', this.onConnect.bind(this));
        this.socket.io.on('reconnect', this.onReconnect.bind(this));
        // Log errors to the console: // TODO: Should we do this in production?
        this.socket.on('reportError', console.error.bind(console));
    }

    public run (): void
    {
        this.socket.connect();
    }

    private onConnect (): void
    {
        if (this.mapPublicIdentifier == '')
        {
            this.socket.disconnect();

            return;

            // TODO: Should we inform the user about the missing map public identifier?
            //       If we let him draw for himself we must go sure this has no unforeseen consequences.
        }

        // After connection, the same has to happen as after a reconnect:
        this.onReconnect();
    }

    private onReconnect (): void
    {
        this.authenticate();

        this.socket.emit('selectMap', this.mapPublicIdentifier);

        // TODO: Reload entries and palette.
    }

    private authenticate (): void
    {
        // TODO: Move authentication into a seperate class.
        // TODO: Shouldn't the authentication be async and everything else wait for it to finish?

        const sessionId = localStorage.getItem(sessionIdStorageKey);
        const sessionToken = localStorage.getItem(sessionTokenStorageKey);

        if ((sessionId !== null) && (sessionToken !== null))
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
                        this.isLoggedIn = true;
                        this.callOnReadyIfReady();
                    }
                    else
                    {
                        localStorage.removeItem(sessionIdStorageKey);
                        localStorage.removeItem(sessionTokenStorageKey);

                        this.authenticate();
                    }
                }
            );
        }
        else
        {
            this.socket.emit(
                'login',
                Constants.anonymousUserName,
                '', // Empty password
                (successful: boolean, sessionId?: number, sessionToken?: string) =>
                {
                    if ((!successful) || (sessionId === undefined) || (sessionToken === undefined))
                    {
                        throw Error('Could not login as Anonymous.');
                    }

                    localStorage.setItem(sessionIdStorageKey, `${sessionId}`);
                    localStorage.setItem(sessionTokenStorageKey, sessionToken);

                    this.isLoggedIn = true;
                    this.callOnReadyIfReady();
                }
            );
        }
    }

    private onDocumentLoaded (): void
    {
        this.paper = new Paper();

        this.palette = new Palette(
            (x: number, y: number, contentId: number): void =>
            {
                /* TODO: This is not elegant... we should abstract it because client side we need to do at least SOMETHING, too.
                         The user must see a quick response. */

                this.socket.emit('setMapEntry', x, y, contentId);
            }
        );

        this.paper.events.onClick.addEventListener(this.palette.onPaperClick.bind(this.palette));
        this.paper.events.onContentChange.addEventListener(this.palette.onContentChange.bind(this.palette));

        this.userCountController = new UserCountController('userCount');

        this.callOnReadyIfReady();
    }

    /**
     * Will check wether everything is read i.e. the document is completely loaded, the socket is connected etc.
     * and if yes it will call the associated event.
     */
    private callOnReadyIfReady (): void
    {
        if (this.socket.connected && (document.readyState != 'loading') && this.isLoggedIn)
        {
            this.onReady();
        }
    }

    /**
     * Called when everything is ready, i.e. the document is completely loaded, the socket is connected etc.
     */
    private onReady (): void
    {
        if ((this.paper === undefined) || (this.palette === undefined) || (this.userCountController === undefined))
        {
            // TODO: Should we do something here? It would mean a big error...

            return;
        }

        this.socket.on('updateUserCount', this.userCountController.onChange.bind(this.userCountController));

        this.socket.emit('getMapData', this.paper.createMap.bind(this.paper));

        // Map events, we only need to listen to them as soon as the map is loaded:
        this.socket.on('updateMapEntry', this.paper.setOrUpdateMapEntry.bind(this.paper));

        this.socket.emit('loadMap', this.paper.loadMap.bind(this.paper));

        this.socket.emit('getMapContents', this.palette.loadContents.bind(this.palette));
    }
}

const main = new Main();
main.run();
