import * as Constants from "./shared/constants";
import * as FunctionNames from "./shared/functionNames";
import Paper from "./paper/paper";

class Main
{
    protected readonly socket: SocketIOClient.Socket;

    protected mapId: number|null;
    protected paper: Paper|undefined;

    constructor ()
    {
        this.mapId = null;

        this.socket = io();

        this.socket.on('connect', this.onConnect.bind(this));
        this.socket.on('reconnect', this.onReconnect.bind(this));

        this.socket.connect();
    }

    public run (): void
    {
        document.addEventListener('DOMContentLoaded', this.onDocumentLoaded.bind(this), false);
    }

    protected onConnect (): void
    {
        // Get the map from the URL query string:
        const urlParameters = new URLSearchParams(window.location.search);
        const mapId = urlParameters.get('map');

        if (mapId === null)
        {
            this.socket.disconnect();

            return;

            // TODO: Should we inform the user about the missing map ID?
            //       If we let him draw for himself we must go sure this has no unforeseen consequences.
        }
        else
        {
            this.mapId = parseInt(mapId);
        }

        // After connection, the same has to happen as after a reconnect:
        this.onReconnect();
    }

    protected onReconnect (): void
    {
        // TODO: Authenticate.

        // TODO: The following currently uses the map ID to identify a map. It would be much nicer
        //       to have a readable name in the URL. Maybe use that instead and add a "description"
        //       field to maps to have a well readably, non-URL-encoded description for it to show.
        this.socket.emit(FunctionNames.selectMap, this.mapId);
    }

    protected onDocumentLoaded (): void
    {
        console.log('ID: ' + this.socket.id);

        this.paper = new Paper(Constants.mapWidth, Constants.mapHeight);
    }
}

const main = new Main();
main.run();
