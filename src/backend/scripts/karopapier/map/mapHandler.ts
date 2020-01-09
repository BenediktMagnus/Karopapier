import * as FunctionNames from '../../shared/functionNames';
import Database from '../database/database';
import MapDescriber from '../../shared/mapDescriber';
import Server from '../server';
import socketIo from 'socket.io';
import User from '../user/user';
import UserHandler from '../user/userHandler';

export default class MapHandler
{
    protected io: socketIo.Server;
    protected database: Database;

    protected userHandler: UserHandler;

    constructor (server: Server, database: Database, userHandler: UserHandler)
    {
        this.io = server.socketIo;
        this.database = database;
        this.userHandler = userHandler;

        this.io.on('connection', (socket) => this.onConnection(socket));
    }

    protected onConnection (socket: socketIo.Socket): void
    {
        // We have to do the following here:
        // 1. Bind the functions to prevent suprising changes of the meaning for "this".
        // 2. Inject the user (get via socket) if needd for us to know which user does the action.

        socket.on(FunctionNames.listMaps, this.onListMaps.bind(this));
        socket.on(FunctionNames.loadMap, this.onLoadMap.bind(this));
        socket.on(FunctionNames.setMapEntry, this.wrapSocketAsUser(socket, this.onSetMapEntry.bind(this)));
    }

    protected onListMaps (reply: (activeMaps: MapDescriber[]) => void): void
    {
        const activeMaps = this.database.getActiveMaps();

        const mapDescribers: MapDescriber[] = [];

        // Convert MapTable[] to MapDescriber[]:
        for (const map of activeMaps)
        {
            const mapDescriber = new MapDescriber(map);

            mapDescribers.push(mapDescriber);
        }

        reply(mapDescribers);

        // TODO: Should only admins be allowed to list the maps?
        // TODO: Should this list all maps instead? With the information about them being active?
        // TODO: If we do that, we need to ship the mapDescriber information in onLoadMap.
    }

    protected onSelectMap (socket: socketIo.Socket, mapId: number): void
    {
        const map = this.database.getMap(mapId); // TODO: Handle map not being found.

        if (!map.isActive)
        {
            return; // TODO: Should we inform the user about this?
        }

        const roomName = this.mapIdToRoomName(mapId);

        socket.join(roomName); // TODO: Do not ignore the callback, give an answer about success to the user.
    }

    protected onLoadMap (reply: () => void): void
    {
        // TODO: We need at least every user and anonymous entries here.
        //       Calculated map meta data like the highest number of people voting for a content on an entry
        //       is optional and should only be send if it is already calculated/known.

        reply();
    }

    protected onSetMapEntry (user: User, x: number, y: number, content: number): void
    {
        // TODO: Implement.
        console.log(user.name, x, y, content);
    }

    protected mapIdToRoomName (mapId: number): string
    {
        // TODO: Is this really necessary? Couldn't we simply use the mapId without a prefix?

        const result = 'map-' + mapId.toString();

        return result;
    }

    /**
     * Wraps a socket as a user by autoconverting it for a method that needs a user.
     * @param socket The socket that shall be automatically converted.
     * @param callable The function/method that needs a user as parameter.
     */
    protected wrapSocketAsUser (
        socket: socketIo.Socket,
        callable: (user: User, ...args: any[]) => void
    ): (...args: any[]) => void
    {
        const arrowFunction = (...args: any[]): void =>
        {
            const user = this.userHandler.getUserFromSocket(socket);

            callable(user, args);
        };

        return arrowFunction;
    }
}
