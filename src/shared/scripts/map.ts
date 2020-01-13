export class MapDescriber
{
    public id: number;
    public name: string;

    constructor (mapDescriber: MapDescriber)
    {
        // With this constructor everything that can be considered a MapDescriber (in it's function as an
        // interface) is being converted into a MapDescriber (in it's function as a class) without any
        // unrelated properties or methods.

        this.id = mapDescriber.id;
        this.name = mapDescriber.name;
    }
}

export interface ContentEntry
{
    contentId: number;
    userIds: Set<number>;
    anonymousCount: number;
}

/**
 * A parsable version of MapEntry's ContentEntry. \
 * Contains the user IDs and the number of anonymous votes for a content ID.
 */
export interface ParsableContentEntry
{
    contentId: number;
    userIds: number[];
    anonymousCount: number;
}

/**
 * Holds a list of content entries for a specific x-y coordinate pair. \
 * TODO: Better name? "ContentEntryData" or "ContentEntryDescriber" perhaps?
 */
export interface ContentEntryListElement
{
    x: number;
    y: number;
    contentEntries: ParsableContentEntry[];
}
