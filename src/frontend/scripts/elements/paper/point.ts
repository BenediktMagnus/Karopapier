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
    public readonly x: number;
    public readonly y: number;

    protected element: HTMLTableDataCellElement;

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

    /**
     * Create a point for the given coordinates.
     * @param x
     * @param y
     * @param events The events to forward to when a point event is fired.
     * @param parentElement The parent element to attach the point to.
     */
    constructor (x: number, y: number, events: PointEvents, parentElement: HTMLTableRowElement)
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
        parentElement.appendChild(this.element);

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

    public setUserEntry (userId: number, oldContentId: number|null, newContentId: number): void
    {
        if (oldContentId !== null)
        {
            const oldEntry = this.contentIdToContentEntryMap.get(oldContentId);

            if (oldEntry !== undefined)
            {
                oldEntry.userIds.delete(userId);
            }
        }

        let newEntry = this.contentIdToContentEntryMap.get(newContentId);

        if (newEntry !== undefined)
        {
            newEntry.userIds.add(userId);
        }
        else
        {
            const userIds = new Set([userId]);

            newEntry = {
                contentId: newContentId,
                userIds: userIds,
                anonymousCount: 0,
            };

            this.contentIdToContentEntryMap.set(newContentId, newEntry);
        }
    }

    public setAnonymousEntry (oldContentId: number|null, newContentId: number): void
    {
        if (oldContentId !== null)
        {
            const oldEntry = this.contentIdToContentEntryMap.get(oldContentId);

            if (oldEntry !== undefined)
            {
                oldEntry.anonymousCount--;
            }
        }

        let newEntry = this.contentIdToContentEntryMap.get(newContentId);

        if (newEntry !== undefined)
        {
            newEntry.anonymousCount++;
        }
        else
        {
            newEntry = {
                contentId: newContentId,
                userIds: new Set(),
                anonymousCount: 1,
            };

            this.contentIdToContentEntryMap.set(newContentId, newEntry);
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
