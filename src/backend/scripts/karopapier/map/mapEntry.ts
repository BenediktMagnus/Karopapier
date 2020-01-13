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

    /**
     * Set a user entry and return it's status.
     * @param userId The ID of the user.
     * @param contentId The ID of the entry's content.
     * @returns Wether the entry has been newly created or an existing entry updated.
     */
    public setUserEntry (userId: number, contentId: number): MapEntryStatus
    {
        let entryStatus: MapEntryStatus;

        let userEntry = this.userIdToUserEntryMap.get(userId);

        if (userEntry !== undefined)
        {
            const contentEntry = this.contentIdToContentEntryMap.get(userEntry.contentId);

            // Remove the old entry in the content entry's user list:
            contentEntry?.userIds.delete(userId);

            userEntry.contentId = contentId;

            entryStatus = MapEntryStatus.Updated;
        }
        else
        {
            userEntry = {
                userId: userId,
                contentId: contentId,
            };

            this.userIdToUserEntryMap.set(userId, userEntry);

            entryStatus = MapEntryStatus.New;
        }

        let contentEntry = this.contentIdToContentEntryMap.get(contentId);

        // Add the new entry to the content entry's user list:
        if (contentEntry !== undefined)
        {
            contentEntry.userIds.add(userId);
        }
        else
        {
            contentEntry = {
                contentId: contentId,
                userIds: new Set([userId]),
                anonymousCount: 0,
            };

            this.contentIdToContentEntryMap.set(contentId, contentEntry);
        }

        return entryStatus;
    }

    /**
     * Set an anonymous entry and return it's status.
     * @param ip The IP of the anonymous user.
     * @param contentId The ID of the entry's content.
     * @returns Wether the entry has been newly created or an existing entry updated.
     */
    public setAnonymousEntry (ip: string, contentId: number): MapEntryStatus
    {
        let entryStatus: MapEntryStatus;

        let anonymousEntry = this.ipToAnonymousEntryMap.get(ip);

        if (anonymousEntry !== undefined)
        {
            const contentEntry = this.contentIdToContentEntryMap.get(anonymousEntry.contentId);

            // Decrease the old content entry's anonymous count:
            if (contentEntry !== undefined)
            {
                contentEntry.anonymousCount--;
            }

            entryStatus = MapEntryStatus.Updated;
        }
        else
        {
            anonymousEntry = {
                ip: ip,
                contentId: contentId,
            };

            this.ipToAnonymousEntryMap.set(ip, anonymousEntry);

            entryStatus = MapEntryStatus.New;
        }

        let contentEntry = this.contentIdToContentEntryMap.get(contentId);

        // Increase the new content entry's anonymous count:
        if (contentEntry !== undefined)
        {
            contentEntry.anonymousCount++;
        }
        else
        {
            contentEntry = {
                contentId: contentId,
                userIds: new Set(),
                anonymousCount: 1,
            };

            this.contentIdToContentEntryMap.set(contentId, contentEntry);
        }

        return entryStatus;
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
