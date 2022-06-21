import * as EventFunctionDefinitions from '../../../../shared/scripts/eventFunctionDefinitions';
import * as TypedSocketIo from '../typedSocketIo';
import { MapContent, MapData } from '../../../../shared/scripts/map';
import { ApiError } from '../../api/apiError';
import Database from '../database/database';
import MapEntryStatus from './mapEntryStatus';
import MapHolder from './mapHolder';
import Server from '../server';
import User from '../user/user';
import UserHandler from '../user/userHandler';
import ApiErrorMessage from '../../api/apiErrorMessage';
import Validation from '../../api/validation';

// TODO: We could use a z axis to allow multiple contents on the same x-y field!

export default class MapHandler
{
    private io: TypedSocketIo.Server;
    private database: Database;

    private userHandler: UserHandler;

    private mapIdToMapHolderMap: Map<number, MapHolder>;

    constructor (server: Server, database: Database, userHandler: UserHandler)
    {
        this.io = server.socketIo;
        this.database = database;
        this.userHandler = userHandler;

        this.mapIdToMapHolderMap = new Map<number, MapHolder>();

        this.io.on('connection', (socket) => this.onConnection(socket));
    }

    private onConnection (socket: TypedSocketIo.Socket): void
    {
        // We have to do the following here:
        // 1. Bind the functions to prevent suprising changes of the meaning for "this".
        // 2. Inject the user (get via socket) if needd for us to know which user does the action.

        // We need to add the disconnect event to the beginning of the list to
        // go sure that the userHandler hasn't removed the user yet.
        // TODO: Does this really work for socket.io EventEmitters?
        socket.prependListener('disconnect', this.wrapSocketAsUser(socket, this.onDisconnect.bind(this)));

        socket.on('getMapContents', this.wrapSocketAsUser(socket, this.onGetMapContents.bind(this)));
        socket.on('getMapData', this.wrapSocketAsUser(socket, this.onGetMapData.bind(this)));
        socket.on('loadMap', this.wrapSocketAsUser(socket, this.onLoadMap.bind(this)));
        socket.on('selectMap', this.wrapSocketAsUser(socket, this.onSelectMap.bind(this)));
        socket.on('setMapEntry', this.wrapSocketAsUser(socket, this.onSetMapEntry.bind(this)));
    }

    private onDisconnect (user: User): void
    {
        // On disconnect, check if there are no sockets left for the selected map and unload it.

        if (user.selectedMapId !== undefined)
        {
            const mapHolder = this.mapIdToMapHolderMap.get(user.selectedMapId);

            if (mapHolder !== undefined)
            {
                mapHolder.socketCount--;

                if (mapHolder.socketCount <= 0)
                {
                    // Unload map:
                    this.mapIdToMapHolderMap.delete(user.selectedMapId);
                }

                // Inform every user in the room (on the map) about the new user:
                const roomName = this.mapIdToRoomName(user.selectedMapId);
                this.io.in(roomName).emit('updateUserCount', mapHolder.socketCount);

                user.selectedMapId = undefined;
            }
        }
    }

    private onSelectMap (user: User, mapPublicIdentifier: string): void
    {
        if (!Validation.isNonEmptyString(mapPublicIdentifier))
        {
            user.socket.emit('reportError', ApiErrorMessage.forge('selectMap', ApiError.InvalidCallback));

            return;
        }

        const map = this.database.getMapByPublicIdentifier(mapPublicIdentifier);

        if (map === undefined)
        {
            user.socket.emit('reportError', ApiErrorMessage.forge('selectMap', ApiError.NoMapForIdentifier));

            return;
        }

        if (!map.isActive)
        {
            user.socket.emit('reportError', ApiErrorMessage.forge('selectMap', ApiError.MapNotActive));

            return;
        }

        const roomName = this.mapIdToRoomName(map.id);

        user.socket.join(roomName) as void; // NOTE: Since we are using the default adapter, join() returns void and not a promise.

        user.selectedMapId = map.id;

        let mapHolder = this.mapIdToMapHolderMap.get(map.id);

        if (mapHolder !== undefined)
        {
            // Increase the number of sockets using this map for us to later know when we can unload it again:
            mapHolder.socketCount++;
        }
        else
        {
            // This should never happen, but it cannot hurt to catch this case:
            mapHolder = new MapHolder(this.database, map.id);
            this.mapIdToMapHolderMap.set(map.id, mapHolder);
        }

        // Inform every user in the room (on the map) about the new user:
        this.io.in(roomName).emit('updateUserCount', mapHolder.socketCount);
    }

    private onGetMapData (user: User, reply: EventFunctionDefinitions.GetMapDataReply): void
    {
        if (!Validation.isCallable(reply))
        {
            user.socket.emit('reportError', ApiErrorMessage.forge('getMapData', ApiError.InvalidCallback));

            return;
        }

        if (user.selectedMapId === undefined)
        {
            user.socket.emit('reportError', ApiErrorMessage.forge('getMapData', ApiError.NoMapSelected));

            return;
        }

        const mapHolder = this.getOrCreateMapHolder(user.selectedMapId);

        const mapData = new MapData(mapHolder.mapInfo);

        reply(mapData);
    }

    private onGetMapContents (user: User, reply: EventFunctionDefinitions.GetMapContentsReply): void
    {
        if (!Validation.isCallable(reply))
        {
            user.socket.emit('reportError', ApiErrorMessage.forge('getMapContents', ApiError.InvalidCallback));

            return;
        }

        if (user.selectedMapId === undefined)
        {
            user.socket.emit('reportError', ApiErrorMessage.forge('getMapContents', ApiError.NoMapSelected));

            return;
        }

        const contentTableList = this.database.getContentsForMap(user.selectedMapId);

        const mapContents: MapContent[] = [];

        for (const contentTableEntry of contentTableList)
        {
            const mapContent = new MapContent(contentTableEntry);

            mapContents.push(mapContent);
        }

        reply(mapContents);
    }

    private onLoadMap (user: User, reply: EventFunctionDefinitions.LoadMapReply): void
    {
        if (!Validation.isCallable(reply))
        {
            user.socket.emit('reportError', ApiErrorMessage.forge('loadMap', ApiError.InvalidCallback));

            return;
        }

        if (user.selectedMapId === undefined)
        {
            user.socket.emit('reportError', ApiErrorMessage.forge('loadMap', ApiError.NoMapSelected));

            return;
        }

        const mapHolder = this.getOrCreateMapHolder(user.selectedMapId);

        const mapEntries = mapHolder.getEntries();

        reply(mapEntries);
    }

    private onSetMapEntry (user: User, x: number, y: number, contentId: number): void
    {
        // TODO: Rename to "onSetContentEntry".

        if (!Number.isSafeInteger(x)
            || !Number.isSafeInteger(y)
            || !Number.isSafeInteger(contentId))
        {
            user.socket.emit('reportError', ApiErrorMessage.forge('setMapEntry', ApiError.InvalidParameters));

            return;
        }

        if (user.selectedMapId === undefined)
        {
            user.socket.emit('reportError', ApiErrorMessage.forge('setMapEntry', ApiError.NoMapSelected));

            return;
        }

        if (!this.database.hasContent(contentId, user.selectedMapId))
        {
            user.socket.emit('reportError', ApiErrorMessage.forge('setMapEntry', ApiError.MapDoesNotHaveContent));

            return;
        }

        const mapHolder = this.getOrCreateMapHolder(user.selectedMapId);

        if (!mapHolder.isPointInsideMap(x, y))
        {
            user.socket.emit('reportError', ApiErrorMessage.forge('setMapEntry', ApiError.CordinatesAreOutsideOfMap));

            return;
        }

        const mapEntrySetResult = mapHolder.setEntry(x, y, user, contentId);

        // We only need to inform the users if something has actually changed:
        if (mapEntrySetResult.status != MapEntryStatus.Unchanged)
        {
            const roomName = this.mapIdToRoomName(user.selectedMapId);

            // Inform every user in the room (on the map) about the change:
            this.io.in(roomName).emit('updateMapEntry', x, y, mapEntrySetResult.oldContentId, mapEntrySetResult.newContentId);
        }
    }

    private getOrCreateMapHolder (mapId: number): MapHolder
    {
        let mapHolder = this.mapIdToMapHolderMap.get(mapId);

        if (mapHolder === undefined)
        {
            mapHolder = new MapHolder(this.database, mapId);

            this.mapIdToMapHolderMap.set(mapId, mapHolder);
        }

        return mapHolder;
    }

    private mapIdToRoomName (mapId: number): string
    {
        const result = `map-${mapId}`;

        return result;
    }

    /**
     * Wraps a socket as a user by autoconverting it for a method that needs a user.
     * @param socket The socket that shall be automatically converted.
     * @param callable The function/method that needs a user as parameter.
     */
    private wrapSocketAsUser (
        socket: TypedSocketIo.Socket,
        callable: (user: User, ...args: any[]) => void
    ): (...args: any[]) => void
    {
        const arrowFunction = (...args: any[]): void =>
        {
            const user = this.userHandler.getUserFromSocket(socket);

            if (user === null)
            {
                socket.emit('reportError', ApiErrorMessage.forge('Error', ApiError.NoUserForSocket));

                return;
            }

            callable(user, ...args);
        };

        return arrowFunction;
    }
}
