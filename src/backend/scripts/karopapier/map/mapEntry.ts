import { ContentEntry, ParsableContentEntry } from "../../shared/map";
import MapEntryStatus from "./mapEntryStatus";

interface UserEntry
{
    userId: number;
    contentEntry: ContentEntry;
}

interface AnonymousEntry
{
    ip: string;
    contentEntry: ContentEntry;
}

class InitialisedMapEntrySetResult
{
    public status: MapEntryStatus;
    public oldContentId: number|null;
    public newContentId: number;

    constructor (newContentId: number)
    {
        this.status = MapEntryStatus.New;
        this.oldContentId = null;
        this.newContentId = newContentId;
    }
}

// We export the class as a type to prevent instantiation outside this module:
export type MapEntrySetResult = InitialisedMapEntrySetResult;

export default class MapEntry
{
    private userIdToUserEntryMap: Map<number, UserEntry>;
    private ipToAnonymousEntryMap: Map<string, AnonymousEntry>;

    private contentIdToContentEntryMap: Map<number, ContentEntry>;

    constructor ()
    {
        this.userIdToUserEntryMap = new Map<number, UserEntry>();
        this.ipToAnonymousEntryMap = new Map<string, AnonymousEntry>();
        this.contentIdToContentEntryMap = new Map<number, ContentEntry>();
    }

    /**
     * Set a user entry and return it's status.
     * @param userId The ID of the user.
     * @param newContentId The ID of the entry's content to set.
     * @returns Wether the entry has been newly created or an existing entry updated.
     */
    public setUserEntry (userId: number, newContentId: number): MapEntrySetResult
    {
        const result = new InitialisedMapEntrySetResult(newContentId);

        const newContentEntry = this.getOrCreateContentEntry(newContentId);

        let userEntry = this.userIdToUserEntryMap.get(userId);

        if (userEntry !== undefined)
        {
            const oldContentEntry = userEntry.contentEntry;

            result.oldContentId = oldContentEntry.contentId;

            if (newContentId === oldContentEntry.contentId)
            {
                result.status = MapEntryStatus.Unchanged;

                return result; // We return because we have nothing left to do here.
            }
            else
            {
                // Remove the old entry in the content entry's user list:
                oldContentEntry.userIds.delete(userId);

                result.status = MapEntryStatus.Updated;

                userEntry.contentEntry = newContentEntry;
            }
        }
        else
        {
            userEntry = {
                userId: userId,
                contentEntry: newContentEntry,
            };

            this.userIdToUserEntryMap.set(userId, userEntry);

            // This is the result default, so we have to change nothing here.
        }

        newContentEntry.userIds.add(userId);

        return result;
    }

    /**
     * Set an anonymous entry and return it's status.
     * @param ip The IP of the anonymous user.
     * @param newContentId The ID of the entry's content to set.
     * @returns Wether the entry has been newly created or an existing entry updated.
     */
    public setAnonymousEntry (ip: string, newContentId: number): MapEntrySetResult
    {
        const result = new InitialisedMapEntrySetResult(newContentId);

        const newContentEntry = this.getOrCreateContentEntry(newContentId);

        let anonymousEntry = this.ipToAnonymousEntryMap.get(ip);

        if (anonymousEntry !== undefined)
        {
            const oldContentEntry = anonymousEntry.contentEntry;

            result.oldContentId = oldContentEntry.contentId;

            if (newContentId === oldContentEntry.contentId)
            {
                result.status = MapEntryStatus.Unchanged;

                return result; // We return because we have nothing left to do here.
            }
            else
            {
                // Decrease the old content entry's anonymous count:
                oldContentEntry.anonymousCount--;

                result.status = MapEntryStatus.Updated;

                anonymousEntry.contentEntry = newContentEntry;
            }
        }
        else
        {
            anonymousEntry = {
                ip: ip,
                contentEntry: newContentEntry,
            };

            this.ipToAnonymousEntryMap.set(ip, anonymousEntry);

            // This is the result default, so we have to change nothing here.
        }

        newContentEntry.anonymousCount++;

        return result;
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

    /**
     * Tries to get a content entry. If that fails because there is none with this content ID, it will be
     * created and inserted into the content ID to content entry map before returning.
     * @param contentId The ID of the content to get/create.
     */
    private getOrCreateContentEntry (contentId: number): ContentEntry
    {
        let contentEntry = this.contentIdToContentEntryMap.get(contentId);

        if (contentEntry === undefined)
        {
            contentEntry = {
                contentId: contentId,
                userIds: new Set(),
                anonymousCount: 0,
            };

            this.contentIdToContentEntryMap.set(contentId, contentEntry);
        }

        return contentEntry;
    }
}
