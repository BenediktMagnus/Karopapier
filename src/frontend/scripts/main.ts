import * as Constants from "./shared/constants";
import * as FunctionNames from "./shared/functionNames";
import { ContentEntryListElement } from "./shared/map";
import Palette from "./elements/palette/palette";
import Paper from "./elements/paper/paper";
import VoteCountHolder from "./elements/palette/voteCountHolder";

// FIXME: This is not correct. "import type" should not be needed according to the documentation. What is wrong?
import type * as socketIoClient from "socket.io-client";
import type { io } from "socket.io-client";

const sessionIdStorageKey = 'sessionId';
const sessionTokenStorageKey = 'sessionToken';

class Main
{
    private readonly socket: socketIoClient.Socket;

    private mapPublicIdentifier: string|null;
    private paper?: Paper;
    private palette?: Palette;
    private voteCountHolder?: VoteCountHolder;

    private isLoggedIn: boolean;

    constructor ()
    {
        this.isLoggedIn = false;

        // Get the map from the URL query string:
        const urlParameters = new URLSearchParams(window.location.search);
        this.mapPublicIdentifier = urlParameters.get('map');

        // DOM events:
        document.addEventListener('DOMContentLoaded', this.onDocumentLoaded.bind(this), false);

        // @ts-expect-error Error expected because of the import type hack.
        this.socket = io();

        // Socket.io events:
        this.socket.on('connect', this.onConnect.bind(this));
        this.socket.on('reconnect', this.onReconnect.bind(this));
    }

    public run (): void
    {
        this.socket.connect();
    }

    private onConnect (): void
    {
        if (this.mapPublicIdentifier === null)
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

        this.socket.emit(FunctionNames.selectMap, this.mapPublicIdentifier);

        // TODO: Reload entries and palette.
    }

    private authenticate (): void
    {
        const sessionId = localStorage.getItem(sessionIdStorageKey);
        const sessionToken = localStorage.getItem(sessionTokenStorageKey);

        if ((sessionId !== null) && (sessionToken !== null))
        {
            const sessionIdAsNumber = Number.parseInt(sessionId);
            this.socket.emit(
                FunctionNames.authenticate,
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
                FunctionNames.login,
                Constants.anonymousUserName,
                '', // Empty password
                (successful: boolean, sessionId: number, sessionToken: string) =>
                {
                    if (!successful)
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

        this.voteCountHolder = new VoteCountHolder();

        // TODO: The following is not elegant... we should abstract it, maybe with addSelectedListener or something?
        //       Because client side we need to do at least SOMETHING, too. The user must see a quick response.
        this.palette = new Palette(this.voteCountHolder, this.socket.emit.bind(this.socket, FunctionNames.setMapEntry));

        this.paper.events.onClick.addEventListener(this.palette.onPaperClick.bind(this.palette));

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
        if ((this.paper === undefined) || (this.voteCountHolder === undefined) || (this.palette === undefined))
        {
            // TODO: Should we do something here? It would mean a big error...

            return;
        }

        this.socket.emit(FunctionNames.getMapData, this.paper.createMap.bind(this.paper));

        // Map events, we only need to listen to them as soon as the map is loaded:
        this.socket.on(FunctionNames.setMapEntry, this.paper.setMapEntry.bind(this.paper));
        this.socket.on(FunctionNames.setMapEntry, this.voteCountHolder.onSetMapEntry.bind(this.voteCountHolder));

        this.socket.emit(
            FunctionNames.loadMap,
            (mapEntries: ContentEntryListElement[]) =>
            {
                this.paper?.loadMap(mapEntries);
                this.voteCountHolder?.onLoadMap(mapEntries);
            }
        );

        this.socket.emit(FunctionNames.getMapContents, this.palette.loadContents.bind(this.palette));
    }
}

const main = new Main();
main.run();
