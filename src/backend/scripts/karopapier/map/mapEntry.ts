import MapContent from "./mapContent";

type ContentToUserIdMap = Map<MapContent, number[]>;
type UserIdToContentMap = Map<number, MapContent[]>;

interface UserEntry
{
    userId: number;
    content: MapContent;
}

export default class MapEntry
{
    protected userEntries: UserEntry[];

    protected contentToUserIdMap: ContentToUserIdMap;
    protected userIdToContentMap: UserIdToContentMap;

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

        this.contentToUserIdMap = new Map<MapContent, number[]>();
        this.userIdToContentMap = new Map<number, MapContent[]>();

        // Fill the maps:
        for (const userEntry of this.userEntries)
        {
            this.initialiseMapEntry(this.userIdToContentMap, userEntry.userId);

            const userEntries = this.userIdToContentMap.get(userEntry.userId);
            userEntries?.push(userEntry.content);

            this.initialiseMapEntry(this.contentToUserIdMap, userEntry.content);

            const userIds = this.contentToUserIdMap.get(userEntry.content);
            userIds?.push(userEntry.userId);
        }
    }

    protected initialiseMapEntry (map: ContentToUserIdMap|UserIdToContentMap, key: MapContent|number): void
    {
        if (!map.has(key))
        {
            map.set(key, []);
        }
    }

    /*
    public getUserIds (content: MapContent): number[]
    {

    }

    public getContents (userId: number): MapContent[]
    {

    }
    */
}
