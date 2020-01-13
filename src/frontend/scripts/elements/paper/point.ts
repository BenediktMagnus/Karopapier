import * as Constants from "../../shared/constants";
import { ContentEntry, ParsableContentEntry } from "../../shared/map";
import Boundaries from "../../utility/boundaries";

export type PointEvent = (point: Point) => void;

export class PointEvents
{
    public onClick?: PointEvent;
    public onMouseOver?: PointEvent;
}

export default class Point
{
    public readonly element: HTMLTableDataCellElement;

    public readonly x: number;
    public readonly y: number;

    protected events: PointEvents;

    protected contentIdToContentEntryMap: Map<number, ContentEntry>;

    protected contentId: number;
    protected highestUserCount: number;
    protected anonymousContentVote: number;
    protected highestAnonymousCount: number;

    public get boundaries (): Boundaries
    {
        return this.element;
    }

    constructor (x: number, y: number, events: PointEvents)
    {
        this.contentId = Constants.emptyContentId;
        this.anonymousContentVote = Constants.emptyContentId;
        this.highestUserCount = 0;
        this.highestAnonymousCount = 0;

        this.x = x;
        this.y = y;
        this.events = events;

        this.contentIdToContentEntryMap = new Map<number, ContentEntry>();

        this.element = document.createElement('td');

        this.element.onclick = (): void => { this.events.onClick?.(this); };
        this.element.onmouseover = (): void => { this.events.onMouseOver?.(this); };
    }

    /**
     * Load a parsable content entry list into the point, overwriting every previous content.
     * @param parsableCntentEntries The list of parsable content entries.
     */
    public loadContentEntries (parsableContentEntries: ParsableContentEntry[]): void
    {
        this.resetContent();

        for (const parsableContentEntry of parsableContentEntries)
        {
            const userIds = new Set(parsableContentEntry.userIds);

            const contentEntry: ContentEntry = {
                ...parsableContentEntry,
                userIds: userIds,
            };

            this.contentIdToContentEntryMap.set(contentEntry.contentId, contentEntry);

            if (parsableContentEntry.userIds.length > this.highestUserCount)
            {
                this.contentId = parsableContentEntry.contentId;
            }

            if (parsableContentEntry.anonymousCount > this.highestAnonymousCount)
            {
                this.anonymousContentVote = parsableContentEntry.contentId;
            }
        }
    }
    protected resetContent (): void
    {
        this.contentId = Constants.emptyContentId;
        this.anonymousContentVote = Constants.emptyContentId;
        this.highestUserCount = 0;
        this.highestAnonymousCount = 0;

        this.contentIdToContentEntryMap.clear();
    }
}
