import * as Constants from "./shared/constants";
import * as FunctionNames from "./shared/functionNames";
import Coordinates from "./elements/coordinates";
import Palette from "./elements/palette/palette";
import Paper from "./elements/paper/paper";

class Main
{
    protected readonly socket: SocketIOClient.Socket;

    protected mapPublicIdentifier: string|null;
    protected paper?: Paper;
    protected palette?: Palette;
    protected coordinates?: Coordinates;

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

    protected onConnect (): void
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

    protected onReconnect (): void
    {
        // TODO: Authenticate.

        this.socket.emit(FunctionNames.selectMap, this.mapPublicIdentifier);
    }

    protected onDocumentLoaded (): void
    {
        this.paper = new Paper(Constants.mapWidth, Constants.mapHeight);
        this.palette = new Palette(this.paper.boundaries);

        this.paper.addClickListener(this.palette.onPaperClick.bind(this.palette));

        this.coordinates = new Coordinates('coordinates');
        this.paper.addMouseOverListener(this.coordinates.onChange.bind(this.coordinates));
    }
}

const main = new Main();
main.run();
