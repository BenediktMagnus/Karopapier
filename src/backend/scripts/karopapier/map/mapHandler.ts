import * as FunctionDefinitions from '../../shared/functionDefinitions';
import * as FunctionNames from '../../shared/functionNames';
import { MapContent, MapData } from '../../shared/map';
import Database from '../database/database';
import MapEntryStatus from './mapEntryStatus';
import MapHolder from './mapHolder';
import Server from '../server';
import socketIo from 'socket.io';
import User from '../user/user';
import UserHandler from '../user/userHandler';
import Validation from '../../utility/validation';

// TODO: We could use a z axis to allow multiple contents on the same x-y field!

export default class MapHandler
{
    private io: socketIo.Server;
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

    private onConnection (socket: socketIo.Socket): void
    {
        // We have to do the following here:
        // 1. Bind the functions to prevent suprising changes of the meaning for "this".
        // 2. Inject the user (get via socket) if needd for us to know which user does the action.

        // We need to add the disconnect event to the beginning of the list to
        // go sure that the userHandler hasn't removed the user yet.
        // TODO: Does this really work for socket.io EventEmitters?
        socket.prependListener('disconnect', this.wrapSocketAsUser(socket, this.onDisconnect.bind(this)));

        socket.on(FunctionNames.getMapContents, this.wrapSocketAsUser(socket, this.onGetMapContents.bind(this)));
        socket.on(FunctionNames.getMapData, this.wrapSocketAsUser(socket, this.onGetMapData.bind(this)));
        socket.on(FunctionNames.loadMap, this.wrapSocketAsUser(socket, this.onLoadMap.bind(this)));
        socket.on(FunctionNames.selectMap, this.wrapSocketAsUser(socket, this.onSelectMap.bind(this)));
        socket.on(FunctionNames.setMapEntry, this.wrapSocketAsUser(socket, this.onSetMapEntry.bind(this)));
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
            }
        }
    }

    private onSelectMap (user: User, mapPublicIdentifier: string): void
    {
        if (!Validation.isNonEmptyString(mapPublicIdentifier))
        {
            return;
        }

        const map = this.database.getMapByPublicIdentifier(mapPublicIdentifier);

        if (map === undefined)
        {
            return; // TODO: Should we inform the user about this?
        }

        if (!map.isActive)
        {
            return; // TODO: Should we inform the user about this?
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
    }

    private onGetMapData (user: User, reply: FunctionDefinitions.GetMapDataResponseFunction): void
    {
        if (!Validation.isCallable(reply))
        {
            return;
        }

        if (user.selectedMapId === undefined)
        {
            return; // TODO: Should we inform the user about this?
        }

        const mapHolder = this.getOrCreateMapHolder(user.selectedMapId);

        const mapData = new MapData(mapHolder.mapInfo);

        reply(mapData);
    }

    private onGetMapContents (user: User, reply: FunctionDefinitions.GetMapContentsResponseFunction): void
    {
        if (!Validation.isCallable(reply))
        {
            return;
        }

        if (user.selectedMapId === undefined)
        {
            return; // TODO: Should we inform the user about this?
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

    private onLoadMap (user: User, reply: FunctionDefinitions.LoadMapResponseFunction): void
    {
        if (!Validation.isCallable(reply))
        {
            return;
        }

        if (user.selectedMapId === undefined)
        {
            return; // TODO: Should we inform the user about this?
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
            return;
        }

        if (user.selectedMapId === undefined)
        {
            return; // TODO: Should we inform the user about this?
        }

        if (!this.database.hasContent(contentId, user.selectedMapId))
        {
            return;
            // TODO: Should we inform the user? We should only do this if it is possible with the UI.
        }

        const mapHolder = this.getOrCreateMapHolder(user.selectedMapId);

        if (!mapHolder.isPointInsideMap(x, y))
        {
            return;
        }

        const mapEntrySetResult = mapHolder.setEntry(x, y, user, contentId);

        // We only need to inform the users if something has actually changed:
        if (mapEntrySetResult.status != MapEntryStatus.Unchanged)
        {
            const roomName = this.mapIdToRoomName(user.selectedMapId);

            // Inform every user in the room (on the map) about the change:
            this.io.in(roomName).emit(
                FunctionNames.setMapEntry,
                x,
                y,
                mapEntrySetResult.oldContentId,
                mapEntrySetResult.newContentId
            );
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
        socket: socketIo.Socket,
        callable: (user: User, ...args: any[]) => void
    ): (...args: any[]) => void
    {
        const arrowFunction = (...args: any[]): void =>
        {
            const user = this.userHandler.getUserFromSocket(socket);

            if (user === null)
            {
                return; // TODO: Should we inform the user about this? There should always be a user for a socket...
            }

            callable(user, ...args);
        };

        return arrowFunction;
    }
}
