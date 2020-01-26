import * as FunctionNames from "./shared/functionNames";
import Palette from "./elements/palette/palette";
import Paper from "./elements/paper/paper";

class Main
{
    private readonly socket: SocketIOClient.Socket;

    private mapPublicIdentifier: string|null;
    private paper?: Paper;
    private palette?: Palette;

    constructor ()
    {
        // Get the map from the URL query string:
        const urlParameters = new URLSearchParams(window.location.search);
        this.mapPublicIdentifier = urlParameters.get('map');

        // DOM events:
        document.addEventListener('DOMContentLoaded', this.onDocumentLoaded.bind(this), false);

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

        this.callOnReadyIfReady();
    }

    private onReconnect (): void
    {
        // TODO: Authenticate.

        this.socket.emit(FunctionNames.selectMap, this.mapPublicIdentifier);

        // TODO: Reload entries and palette.
    }

    private onDocumentLoaded (): void
    {
        this.paper = new Paper();
        this.palette = new Palette(this.paper.boundaries);

        this.paper.events.onClick.addEventListener(this.palette.onPaperClick.bind(this.palette));

        this.callOnReadyIfReady();
    }

    /**
     * Will check wether everything is read i.e. the document is completely loaded, the socket is connected etc.
     * and if yes it will call the associated event.
     */
    private callOnReadyIfReady (): void
    {
        if (this.socket.connected && (document.readyState != 'loading'))
        {
            // FIXME: This does not work! It is fired twice!
            this.onReady();
        }
    }

    /**
     * Called when everything is ready, i.e. the document is completely loaded, the socket is connected etc.
     */
    private onReady (): void
    {
        if (this.paper !== undefined)
        {
            this.socket.emit(FunctionNames.getMapData, this.paper.createMap.bind(this.paper));

            // Map events, we only need to listen to them as soon as the map is loaded:
            this.socket.on(FunctionNames.setMapEntry, this.paper.setMapEntry.bind(this.paper));

            this.socket.emit(FunctionNames.loadMap, this.paper.loadMap.bind(this.paper));
        }
        // TODO: Should we otherwise do something? It would mean a big error...

        if (this.palette !== undefined)
        {
            this.socket.emit(FunctionNames.getMapContents, this.palette.loadContents.bind(this.palette));
        }
        // TODO: Should we otherwise do something? It would mean a big error...

        // TODO:
        //       mapData: Name for the name display.
        //    X  mapData: Height and width for the paper to be created.
        //    X  mapEntries: For the paper to load the map entries.
        //    X  mapContents: For the toolbox to load and show the tools.
    }
}

const main = new Main();
main.run();
