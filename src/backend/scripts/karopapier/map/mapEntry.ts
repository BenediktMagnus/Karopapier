import { ContentEntry, ParsableContentEntry } from "../../shared/map";
import MapEntryStatus from "./mapEntryStatus";

interface UserEntry
{
    userId: number;
    contentId: number;
}

interface AnonymousEntry
{
    ip: string;
    contentId: number;
}

export default class MapEntry
{
    protected userIdToUserEntryMap: Map<number, UserEntry>;
    protected ipToAnonymousEntryMap: Map<string, AnonymousEntry>;

    protected contentIdToContentEntryMap: Map<number, ContentEntry>;

    constructor ()
    {
        this.userIdToUserEntryMap = new Map<number, UserEntry>();
        this.ipToAnonymousEntryMap = new Map<string, AnonymousEntry>();
        this.contentIdToContentEntryMap = new Map<number, ContentEntry>();
    }

        {
            this.userEntries = [];
        }
        else
        {
            this.userEntries = userEntries;
        }

        this.contentIdToUserIdMap = new Map<number, number[]>();
        this.userIdToContentIdMap = new Map<number, number[]>();

        // Fill the maps:
        for (const userEntry of this.userEntries)
        {
            this.initialiseMapEntry(this.userIdToContentIdMap, userEntry.userId);

            const userEntries = this.userIdToContentIdMap.get(userEntry.userId);
            userEntries?.push(userEntry.contentId);

            this.initialiseMapEntry(this.contentIdToUserIdMap, userEntry.contentId);

            const userIds = this.contentIdToUserIdMap.get(userEntry.contentId);
            userIds?.push(userEntry.userId);
        }
    }

    protected initialiseMapEntry (map: Map<number, number[]>, key: number): void
    {
        if (!map.has(key))
        {
            map.set(key, []);
        }
    }

    public getContentEntries (): ParsableContentEntry[]
    {
        const contentEntries = Array.from(this.contentIdToContentEntryMap.values());

        const parsableContentEntries: ParsableContentEntry[] = [];

        // Convert the content entries' set of user IDs to an array for it being parsable:
        for (const contentEntry of contentEntries)
        {
            const userIds = Array.from(contentEntry.userIds.values());

            const parsableContentEntry: ParsableContentEntry = {
                ...contentEntry,
                userIds: userIds,
            };

            parsableContentEntries.push(parsableContentEntry);
        }

        return parsableContentEntries;
    }
}
