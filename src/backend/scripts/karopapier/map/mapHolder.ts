import MapEntry, { MapEntrySetResult } from './mapEntry';
import { ContentEntryListElement } from '../../../../shared/scripts/map';
import Database from '../database/database';
import MapEntryStatus from './mapEntryStatus';
import MapEntryTable from '../database/tables/mapEntryTable';
import { MapTable } from '../database/tables/mapTable';
import MapUtility from '../../../../shared/scripts/mapUtility';
import User from '../user/user';

type MapEntryMap = Map<number, MapEntry>;

export default class MapHolder
{
    private database: Database;

    private minX: number;
    private maxX: number;
    private minY: number;
    private maxY: number;

    /**
     * Structured as y-x (row-column), not x-y!
     */
    private coordinates: Map<number, MapEntryMap>;

    /**
     * Additional information about the map.
     */
    public readonly mapInfo: MapTable;

    /**
     * The number of sockets currently using this map.
     */
    public socketCount: number;

    constructor (database: Database, mapId: number)
    {
        this.database = database;

        this.socketCount = 1;
        this.coordinates = new Map<number, MapEntryMap>();

        const mapInfo = this.database.getMap(mapId);

        if (mapInfo === undefined)
        {
            throw new Error(`Could not create mapHolder for map ID "${mapId}" because the database returned no map with this ID.`);
        }

        this.mapInfo = mapInfo;

        const xLowAndHigh = MapUtility.axisLengthToLowAndHigh(this.mapInfo.width);
        const yLowAndHigh = MapUtility.axisLengthToLowAndHigh(this.mapInfo.height);
        this.minX = xLowAndHigh.low;
        this.maxX = xLowAndHigh.high;
        this.minY = yLowAndHigh.low;
        this.maxY = yLowAndHigh.high;

        this.loadEntries();
    }

    public setEntry (x: number, y: number, user: User, contentId: number): MapEntrySetResult
    {
        const mapEntry = this.getMapEntry(x, y);

        const entrySetResult = mapEntry.setEntry(user.id, user.sessionId, user.ip, contentId);

        const mapEntryTable: MapEntryTable = {
            mapId: this.mapInfo.id,
            userId: user.id,
            sessionId: user.sessionId,
            ip: user.ip,
            x: x,
            y: y,
            contentId: contentId,
        };

        if (entrySetResult.status == MapEntryStatus.New)
        {
            this.database.insertMapEntry(mapEntryTable);
        }
        else if (entrySetResult.status == MapEntryStatus.Updated)
        {
            this.database.updateMapEntry(mapEntryTable);
        }

        return entrySetResult;
    }

    /**
     * Get all entries as a list of elements containing the x and y coordinates and a list of all content entries for the coordinate pair.
     */
    public getEntries (): ContentEntryListElement[]
    {
        const contentEntryList: ContentEntryListElement[] = [];

        // NOTE: The following sort order of y-x must be kept for the client being able to efficiently read in everything!
        for (const [y, row] of this.coordinates)
        {
            for (const [x, mapEntry] of row)
            {
                const contentEntries = mapEntry.getContentEntries();

                const contentEntryListElement: ContentEntryListElement = {
                    x: x,
                    y: y,
                    contentEntries: contentEntries,
                };

                contentEntryList.push(contentEntryListElement);
            }
        }

        return contentEntryList;
    }

    /**
     * Checks if the coordinates are inside the map boundaries.
     * @param x
     * @param y
     * @returns True if they are, false if not.
     */
    public isPointInsideMap (x: number, y: number): boolean
    {
        const result = (x >= this.minX)
                       && (x <= this.maxX)
                       && (y >= this.minY)
                       && (y <= this.maxY);

        return result;
    }

    private loadEntries (): void
    {
        const mapEntryTables = this.database.getMapEntries(this.mapInfo.id);

        for (const mapEntryTable of mapEntryTables)
        {
            const mapEntry = this.getMapEntry(mapEntryTable.x, mapEntryTable.y);

            mapEntry.setEntry(mapEntryTable.userId, mapEntryTable.sessionId, mapEntryTable.ip, mapEntryTable.contentId);
        }
    }

    /**
     * Tries to get a map entry at the given coordinates. If there is none, a map entry will be created.
     */
    private getMapEntry (x: number, y: number): MapEntry
    {
        let row = this.coordinates.get(y);
        let mapEntry: MapEntry|undefined;

        if (row === undefined)
        {
            row = new Map<number, MapEntry>();

            this.coordinates.set(y, row);
        }
        else
        {
            mapEntry = row.get(x);
        }

        if (mapEntry === undefined)
        {
            mapEntry = new MapEntry();

            row.set(x, mapEntry);
        }

        return mapEntry;
    }
}
