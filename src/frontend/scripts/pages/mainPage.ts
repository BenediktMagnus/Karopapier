import type * as TypedSocketIo from '../network/typedSocketIo';
import Authenticator from '../network/authenticator';
import { FrontendUtils } from '../utility/frontendUtils';
// FIXME: This is not correct. 'import type' should not be needed according to the documentation. What is wrong?
import type { io } from 'socket.io-client';
import Palette from '../elements/palette/palette';
import Paper from '../elements/paper/paper';
import UserCountController from '../elements/userCountController';

class MainPage
{
    private readonly socket: TypedSocketIo.Socket;

    private readonly authenticator: Authenticator;

    private readonly mapPublicIdentifier: string;
    private readonly isGreenScreen: boolean;
    private paper?: Paper;
    private palette?: Palette;
    private userCountController?: UserCountController;

    constructor ()
    {
        // Get the map from the URL query string:
        const urlParameters = new URLSearchParams(window.location.search);
        this.mapPublicIdentifier = urlParameters.get('map') ?? '';
        this.isGreenScreen = urlParameters.has('greenScreen');

        // @ts-expect-error Error expected because of the import type hack.
        this.socket = io();

        FrontendUtils.callWhenDocumentIsReady(this.onDocumentLoaded.bind(this));

        // Socket.io events:
        this.socket.on('connect', this.onConnect.bind(this));
        this.socket.io.on('reconnect', this.onReconnect.bind(this));
        // Log errors to the console: // TODO: Should we do this in production?
        this.socket.on('reportError', console.error.bind(console));

        this.authenticator = new Authenticator(this.socket);
    }

    public run (): void
    {
        this.socket.connect();

        if (this.isGreenScreen)
        {
            const css = document.createElement('link');
            css.rel = 'stylesheet';
            css.type = 'text/css';
            css.href = '/css/greenScreen.css';
            document.head.appendChild(css);
        }
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
        this.authenticator.run(this.callOnReadyIfReady.bind(this));

        this.socket.emit('selectMap', this.mapPublicIdentifier);

        // TODO: Reload entries and palette.
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
     * Will check whether everything is read i.e. the document is completely loaded, the socket is connected etc.
     * and if yes it will call the associated event.
     */
    private callOnReadyIfReady (): void
    {
        if (this.socket.connected && (document.readyState != 'loading') && this.authenticator.isLoggedIn)
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

const mainPage = new MainPage();
mainPage.run();
