import * as Constants from '../../../../shared/scripts/constants';
import { ContentEntry } from '../../../../shared/scripts/map';
import MapEntryStatus from './mapEntryStatus';

interface UserEntry
{
    userId: number;
    sessionId: number|null;
    ip: string|null;
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
    private userIdToEntryMap: Map<number, UserEntry>;
    private sessionIdToEntryMap: Map<number, UserEntry>;
    private ipToEntryMap: Map<string, UserEntry>;

    private contentIdToContentEntryMap: Map<number, ContentEntry>;

    constructor ()
    {
        this.userIdToEntryMap = new Map<number, UserEntry>();
        this.sessionIdToEntryMap = new Map<number, UserEntry>();
        this.ipToEntryMap = new Map<string, UserEntry>();
        this.contentIdToContentEntryMap = new Map<number, ContentEntry>();
    }

    /**
     * Set an entry and return its status.
     * @param userId The ID of the user.
     * @param sessionId The session ID of the user.
     * @param ip The ip of the user.
     * @param newContentId The ID of the entry's content to set.
     * @returns Wether the entry has been newly created or an existing entry updated.
     */
    public setEntry (userId: number, sessionId: number|null, ip: string|null, newContentId: number): MapEntrySetResult
    {
        const result = new InitialisedMapEntrySetResult(newContentId);

        const newContentEntry = this.getOrCreateContentEntry(newContentId);

        let entry: UserEntry|undefined = undefined;

        if (userId !== Constants.anonymousUserId)
        {
            entry = this.userIdToEntryMap.get(userId);
        }

        if ((entry === undefined) && (sessionId !== null))
        {
            entry = this.sessionIdToEntryMap.get(sessionId);
        }

        if ((entry === undefined) && (ip !== null))
        {
            entry = this.ipToEntryMap.get(ip);
        }

        if (entry !== undefined)
        {
            const oldContentEntry = entry.contentEntry;

            result.oldContentId = oldContentEntry.contentId;

            if (newContentId === oldContentEntry.contentId)
            {
                result.status = MapEntryStatus.Unchanged;
            }
            else
            {
                oldContentEntry.voteCount--;

                result.status = MapEntryStatus.Updated;

                newContentEntry.voteCount++;

                entry.contentEntry = newContentEntry;
            }
        }
        else
        {
            newContentEntry.voteCount++;

            entry = {
                userId: userId,
                sessionId: sessionId,
                ip: ip,
                contentEntry: newContentEntry,
            };

            // This is the result default, so we have to change nothing here.
        }

        // Update all maps in every case because one of the user properties (especially the IP) could have changed in the meantime:

        if (userId !== Constants.anonymousUserId)
        {
            this.userIdToEntryMap.set(userId, entry);
        }
        if (sessionId !== null)
        {
            this.sessionIdToEntryMap.set(sessionId, entry);
        }
        if (ip !== null)
        {
            this.ipToEntryMap.set(ip, entry);
        }

        return result;
    }

    public getContentEntries (): ContentEntry[]
    {
        const contentEntries = Array.from(this.contentIdToContentEntryMap.values());

        return contentEntries;
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
                voteCount: 0,
            };

            this.contentIdToContentEntryMap.set(contentId, contentEntry);
        }

        return contentEntry;
    }
}
