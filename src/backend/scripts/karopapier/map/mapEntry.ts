interface UserEntry
{
    userId: number;
    contentId: number;
}

export default class MapEntry
{
    protected userEntries: UserEntry[];

    protected contentIdToUserIdMap: Map<number, number[]>;
    protected userIdToContentIdMap: Map<number, number[]>;

    constructor (userEntries?: UserEntry[]|null)
    {
        if ((userEntries === undefined) || (userEntries === null))
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

    /*
    public getUserIds (contentId: number): number[]
    {

    }

    public getContents (userId: number): number[]
    {

    }
    */
}
