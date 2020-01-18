import MapEntry, { MapEntrySetResult } from "./mapEntry";
import { ContentEntryListElement } from "../../shared/map";
import Database from "../database/database";
import MapEntryAnonymousTable from "../database/tables/mapEntryAnonymousTable";
import MapEntryStatus from "./mapEntryStatus";
import MapEntryUserTable from "../database/tables/mapEntryUserTable";
import { MapTable } from "../database/tables/mapTable";
import MapUtility from "../../shared/mapUtility";

type MapEntryMap = Map<number, MapEntry>;

export default class MapHolder
{
    protected database: Database;

    protected minX: number;
    protected maxX: number;
    protected minY: number;
    protected maxY: number;

    /**
     * Structured as y-x (row-column), not x-y!
     */
    protected coordinates: Map<number, MapEntryMap>;

    /**
     * The highest number of anonymous voters for a content on an entry. \
     * Used as a scaling measurement for the "value" of such a vote.
     */
    protected highestVotingCount: number;

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

        this.highestVotingCount = 0;
        this.socketCount = 1;
        this.coordinates = new Map<number, MapEntryMap>();

        this.mapInfo = this.database.getMap(mapId);

        const xLowAndHigh = MapUtility.axisLengthToLowAndHigh(this.mapInfo.width);
        const yLowAndHigh = MapUtility.axisLengthToLowAndHigh(this.mapInfo.height);
        this.minX = xLowAndHigh.low;
        this.maxX = xLowAndHigh.high;
        this.minY = yLowAndHigh.low;
        this.maxY = yLowAndHigh.high;

        this.loadEntries();
    }

    public setUserEntry (x: number, y: number, userId: number, contentId: number): MapEntrySetResult
    {
        const mapEntry = this.getMapEntry(x, y);

        const entrySetResult = mapEntry.setUserEntry(userId, contentId);

        const userMapEntry: MapEntryUserTable = {
            mapId: this.mapInfo.id,
            userId: userId,
            x: x,
            y: y,
            contentId: contentId,
        };

        if (entrySetResult.status == MapEntryStatus.New)
        {
            this.database.insertUserMapEntry(userMapEntry);
        }
        else if (entrySetResult.status == MapEntryStatus.Updated)
        {
            this.database.updateUserMapEntry(userMapEntry);
        }

        return entrySetResult;
    }

    public setAnonymousEntry (x: number, y: number, ip: string, contentId: number): MapEntrySetResult
    {
        const mapEntry = this.getMapEntry(x, y);

        const entrySetResult = mapEntry.setAnonymousEntry(ip, contentId);

        const anonymousMapEntry: MapEntryAnonymousTable = {
            mapId: this.mapInfo.id,
            ip: ip,
            x: x,
            y: y,
            contentId: contentId,
        };

        if (entrySetResult.status == MapEntryStatus.New)
        {
            this.database.insertAnonymousMapEntry(anonymousMapEntry);
        }
        else if (entrySetResult.status == MapEntryStatus.Updated)
        {
            this.database.updateAnonymousMapEntry(anonymousMapEntry);
        }

        return entrySetResult;
    }

    /**
     * Get all entries as a list of elements containing the x and y coordinates and a list of all content entries for the coordinate pair.
     */
    public getEntries (): ContentEntryListElement[]
    {
        const contentEntryList: ContentEntryListElement[] = [];

        // NOTE: The following sort order of y-x must be kept for the client being able to efficient read in everything!
        for (const [y, row] of this.coordinates)
        {
            for (const [x, mapEntry] of row)
            {
                const parsableContentEntries = mapEntry.getContentEntries();

                const contentEntryListElement: ContentEntryListElement = {
                    x: x,
                    y: y,
                    contentEntries: parsableContentEntries,
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

    protected loadEntries (): void
    {
        const userMapEntries = this.database.getUserMapEntries(this.mapInfo.id);

        for (const userMapEntry of userMapEntries)
        {
            const mapEntry = this.getMapEntry(userMapEntry.x, userMapEntry.y);

            mapEntry.setUserEntry(userMapEntry.userId, userMapEntry.contentId);
        }

        const anonymousMapEntries = this.database.getAnonymousMapEntries(this.mapInfo.id);

        for (const anonymousMapEntry of anonymousMapEntries)
        {
            const mapEntry = this.getMapEntry(anonymousMapEntry.x, anonymousMapEntry.y);

            mapEntry.setAnonymousEntry(anonymousMapEntry.ip, anonymousMapEntry.contentId);
        }
    }

    /**
     * Tries to get a map entry at the given coordinates. If there is none, a map entry will be created.
     */
    protected getMapEntry (x: number, y: number): MapEntry
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
