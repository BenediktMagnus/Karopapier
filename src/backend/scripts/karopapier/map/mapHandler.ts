import * as FunctionDefinitions from '../../shared/functionDefinitions';
import * as FunctionNames from '../../shared/functionNames';
import { MapContent, MapData } from '../../shared/map';
import Database from '../database/database';
import { MapEntrySetResult } from './mapEntry';
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

    protected onDisconnect (user: User): void
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

    protected onSelectMap (user: User, mapPublicIdentifier: string): void
    {
        if (!Validation.isNonEmptyString(mapPublicIdentifier))
        {
            return;
        }

        if (!this.database.hasMapPublicIdentifier(mapPublicIdentifier))
        {
            return; // TODO: Should we inform the user about this?
        }

        const map = this.database.getMapByPublicIdentifier(mapPublicIdentifier);
        if (!map.isActive)
        {
            return; // TODO: Should we inform the user about this?
        }

        const roomName = this.mapIdToRoomName(map.id);

        user.socket.join(roomName); // TODO: Do not ignore the callback, give an answer about success to the user.

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

    protected onGetMapData (user: User, reply: FunctionDefinitions.GetMapDataResponseFunction): void
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

    protected onGetMapContents (user: User, reply: FunctionDefinitions.GetMapContentsResponseFunction): void
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

    protected onLoadMap (user: User, reply: FunctionDefinitions.LoadMapResponseFunction): void
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

        const mapHolder = this.getOrCreateMapHolder(user.selectedMapId);

        const mapEntries = mapHolder.getEntries();

        reply(mapEntries);
    }

    protected onSetMapEntry (user: User, x: number, y: number, contentId: number): void
    {
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

        let mapEntrySetResult: MapEntrySetResult;

        if (this.userHandler.isLoggedIn(user))
        {
            mapEntrySetResult = mapHolder.setUserEntry(x, y, user.id, contentId);
        }
        else
        {
            mapEntrySetResult = mapHolder.setAnonymousEntry(x, y, user.ip, contentId);
        }

        // We only need to inform the users if something has actually changed:
        if (mapEntrySetResult.status != MapEntryStatus.Unchanged)
        {
            // TODO: This could lead to a bad user experience if the load is too high.
            //       Even if users do not change the vote rapidly, there could happen a lot of these changes if there are a couple of
            //       users active with the load growing exponentially.
            //       Maybe we should only inform the user if the entry really changes, meaning if the content the most users/sockets vote
            //       for change. This could reduce the load by a lot, but we would need a possibility for the user to get all votes
            //       for a specific entry.
            //       Furthermore, this would reduce client choices about vote weightings... but do we really need that?

            const roomName = this.mapIdToRoomName(user.selectedMapId);

            // Send the user ID if he is logged in, otherwise null for anonymous:
            const userId = this.userHandler.isLoggedIn(user) ? user.id : null;

            // Inform every other user in the room (on the map) about the change:
            // The user who made the change will not be notified.
            user.socket.to(roomName).emit(
                FunctionNames.setMapEntry,
                x, y,
                userId,
                mapEntrySetResult.oldContentId,
                mapEntrySetResult.newContentId
            );
        }
    }

    protected getOrCreateMapHolder (mapId: number): MapHolder
    {
        let mapHolder = this.mapIdToMapHolderMap.get(mapId);

        if (mapHolder === undefined)
        {
            mapHolder = new MapHolder(this.database, mapId);

            this.mapIdToMapHolderMap.set(mapId, mapHolder);
        }

        return mapHolder;
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

            callable(user, ...args);
        };

        return arrowFunction;
    }
}
