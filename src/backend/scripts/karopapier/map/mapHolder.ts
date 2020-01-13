import { ContentEntryListElement } from "../../shared/map";
import Database from "../database/database";
import MapEntry from "./mapEntry";
import MapEntryAnonymousTable from "../database/tables/mapEntryAnonymousTable";
import MapEntryStatus from "./mapEntryStatus";
import MapEntryUserTable from "../database/tables/mapEntryUserTable";
import { MapTable } from "../database/tables/mapTable";

type MapEntryMap = Map<number, MapEntry>;

export default class MapHolder
{
    protected database: Database;

    protected map: MapTable;

    /**
     * Structured as y-x (row-column), not x-y!
     */
    protected coordinates: Map<number, MapEntryMap>;

    /**
     * The highest number of anonymous voters for a content on an entry. \
     * Used as a scaling measurement for the "value" of such a vote.
     */
    protected highestVotingCount: number;

    constructor (database: Database, mapId: number)
    {
        this.database = database;

        this.highestVotingCount = 0;
        this.coordinates = new Map<number, MapEntryMap>();

        this.map = this.database.getMap(mapId);

        this.loadEntries();
    }

    public setUserEntry (x: number, y: number, userId: number, contentId: number): void
    {
        const mapEntry = this.getMapEntry(x, y);

        const entryStatus = mapEntry.setUserEntry(userId, contentId);

        const userMapEntry: MapEntryUserTable = {
            mapId: this.map.id,
            userId: userId,
            x: x,
            y: y,
            contentId: contentId,
        };

        if (entryStatus == MapEntryStatus.New)
        {
            this.database.insertUserMapEntry(userMapEntry);
        }
        else
        {
            this.database.updateUserMapEntry(userMapEntry);
        }
    }

    public setAnonymousEntry (x: number, y: number, ip: string, contentId: number): void
    {
        const mapEntry = this.getMapEntry(x, y);

        const entryStatus = mapEntry.setAnonymousEntry(ip, contentId);

        const anonymousMapEntry: MapEntryAnonymousTable = {
            mapId: this.map.id,
            ip: ip,
            x: x,
            y: y,
            contentId: contentId,
        };

        if (entryStatus == MapEntryStatus.New)
        {
            this.database.insertAnonymousMapEntry(anonymousMapEntry);
        }
        else
        {
            this.database.updateAnonymousMapEntry(anonymousMapEntry);
        }
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

    protected loadEntries (): void
    {
        const userMapEntries = this.database.getUserMapEntries(this.map.id);

        for (const userMapEntry of userMapEntries)
        {
            const mapEntry = this.getMapEntry(userMapEntry.x, userMapEntry.y);

            mapEntry.setUserEntry(userMapEntry.userId, userMapEntry.contentId);
        }

        const anonymousMapEntries = this.database.getAnonymousMapEntries(this.map.id);

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
