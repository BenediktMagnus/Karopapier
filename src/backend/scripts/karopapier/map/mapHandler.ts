import * as FunctionNames from '../../shared/functionNames';
import Database from '../database/database';
import { LoadMapResponseFunction } from '../../shared/functionDefinitions';
import { MapDescriber } from '../../shared/map';
import MapHolder from './mapHolder';
import Server from '../server';
import socketIo from 'socket.io';
import User from '../user/user';
import UserHandler from '../user/userHandler';
import Validation from '../../utility/validation';

export default class MapHandler
{
    protected io: socketIo.Server;
    protected database: Database;

    protected userHandler: UserHandler;

    protected mapIdToMapHolderMap: Map<number, MapHolder>;

    constructor (server: Server, database: Database, userHandler: UserHandler)
    {
        this.io = server.socketIo;
        this.database = database;
        this.userHandler = userHandler;

        this.mapIdToMapHolderMap = new Map<number, MapHolder>();

        this.io.on('connection', (socket) => this.onConnection(socket));
    }

    protected onConnection (socket: socketIo.Socket): void
    {
        // We have to do the following here:
        // 1. Bind the functions to prevent suprising changes of the meaning for "this".
        // 2. Inject the user (get via socket) if needd for us to know which user does the action.

        socket.on(FunctionNames.listMaps, this.onListMaps.bind(this));
        socket.on(FunctionNames.selectMap, this.wrapSocketAsUser(socket, this.onSelectMap.bind(this)));
        socket.on(FunctionNames.loadMap, this.wrapSocketAsUser(socket, this.onLoadMap.bind(this)));
        socket.on(FunctionNames.setMapEntry, this.wrapSocketAsUser(socket, this.onSetMapEntry.bind(this)));
    }

    protected onListMaps (reply: (activeMaps: MapDescriber[]) => void): void
    {
        if (!Validation.isCallable(reply))
        {
            return;
        }

        const activeMaps = this.database.getMaps();

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

    protected onSelectMap (user: User, publicIdentifier: string): void
    {
        if (!Validation.isNonEmptyString(publicIdentifier))
        {
            return;
        }

        const hasMap = this.database.hasMapPublicIdentifier(publicIdentifier);
        if (!hasMap)
        {
            return; // TODO: Should we inform the user about this?
        }

        const map = this.database.getMapByPublicIdentifier(publicIdentifier);
        if (!map.isActive)
        {
            return; // TODO: Should we inform the user about this?
        }

        const roomName = this.mapIdToRoomName(map.id);

        user.socket.join(roomName); // TODO: Do not ignore the callback, give an answer about success to the user.

        user.selectedMapId = map.id;

        // TODO: Should this event return map meta data like name, description and tools?
    }

    protected onLoadMap (user: User, reply: LoadMapResponseFunction): void
    {
        // TODO: We need at least every user and anonymous entries here.
        //       Calculated map meta data like the highest number of people voting for a content on an entry
        //       is optional and should only be send if it is already calculated/known.

        if (!Validation.isCallable(reply))
        {
            return;
        }

        if (user.selectedMapId === undefined)
        {
            return; // TODO: Should we inform the user about this?
        }

        let mapHolder = this.mapIdToMapHolderMap.get(user.selectedMapId);

        if (mapHolder === undefined)
        {
            mapHolder = new MapHolder(this.database, user.selectedMapId);
        }

        const mapEntries = mapHolder.getEntries();

        reply(mapEntries);
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
