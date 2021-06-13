import * as Constants from "../../shared/constants";
import { ContentEntry, ParsableContentEntry } from "../../shared/map";
import Boundaries from "../../utility/boundaries";
import EventHandler from "../../utility/eventHandler";

type PointEvent = (point: Point) => void;

export class PointEvents
{
    public readonly onClick: EventHandler<PointEvent>;
    public readonly onMouseOver: EventHandler<PointEvent>;

    constructor ()
    {
        this.onClick = new EventHandler<PointEvent>();
        this.onMouseOver = new EventHandler<PointEvent>();
    }
}

export default class Point
{
    public readonly x: number;
    public readonly y: number;

    /**
     * The main element is the table data cell this point is represented by.
     */
    private mainElement: HTMLTableDataCellElement;
    /**
     * The front element is the inner div, filling the main element completely and is being used as the front visual element.
     */
    private frontElement: HTMLDivElement;

    private events: PointEvents;

    private contentIdToContentEntryMap: Map<number, ContentEntry>;

    protected contentId: number;
    private highestUserCount: number;
    protected anonymousContentVote: number;
    private highestAnonymousCount: number;

    public get boundaries (): Boundaries
    {
        return this.mainElement;
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

        this.mainElement = document.createElement('td');
        parentElement.appendChild(this.mainElement);

        this.frontElement = document.createElement('div');
        this.mainElement.appendChild(this.frontElement);

        this.showContent();

        this.mainElement.onclick = (): void => { this.events.onClick.dispatchEvent(this); };
        this.mainElement.onmouseover = (): void => { this.events.onMouseOver.dispatchEvent(this); };
    }

    /**
     * Destroys the point by removing it's element from it's parent.
     */
    public destroy (): void
    {
        // Remove event listeners from the element to prevent any thinkable memory leaks:
        this.mainElement.onclick = null;
        this.mainElement.onmouseover = null;

        this.mainElement.parentNode?.removeChild(this.mainElement);
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
                this.highestUserCount = parsableContentEntry.userIds.length;
                this.contentId = parsableContentEntry.contentId;
            }

            if (parsableContentEntry.anonymousCount > this.highestAnonymousCount)
            {
                this.highestAnonymousCount = parsableContentEntry.anonymousCount;
                this.anonymousContentVote = parsableContentEntry.contentId;
            }
        }

        this.showContent();
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

        // Set new content ID if the new entry has a higher user vote count now:
        if (newEntry.userIds.size > this.highestUserCount)
        {
            this.highestUserCount = newEntry.userIds.size;
            this.contentId = newEntry.contentId;
        }

        this.showContent();
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

        // Set new anonymous vote if the new entry has a higher anonymous voter count now:
        if (newEntry.anonymousCount > this.highestAnonymousCount)
        {
            this.highestAnonymousCount = newEntry.anonymousCount;
            this.anonymousContentVote = newEntry.contentId;
        }

        this.showContent();
    }

    /**
     * Select this point visually.
     */
    public select (): void
    {
        this.mainElement.classList.add('selectedPoint');
    }

    /**
     * Remove the visual selection from this point.
     */
    public unselect (): void
    {
        this.mainElement.classList.remove('selectedPoint');
    }

    private resetContent (): void
    {
        this.contentId = Constants.emptyContentId;
        this.anonymousContentVote = Constants.emptyContentId;
        this.highestUserCount = 0;
        this.highestAnonymousCount = 0;

        this.contentIdToContentEntryMap.clear();

        this.showContent();
    }

    private showContent (): void
    {
        let vote = 0;

        if (this.highestUserCount > 0)
        {
            vote = this.contentId;

            this.frontElement.style.removeProperty('--voting-count');
        }
        else if (this.highestAnonymousCount > 0)
        {
            vote = this.anonymousContentVote;

            this.frontElement.style.setProperty('--voting-count', `${this.highestAnonymousCount}`);
        }
        else
        {
            vote = 0;

            this.frontElement.style.removeProperty('--voting-count');
        }

        if (vote == 0)
        {
            this.frontElement.style.backgroundImage = 'none';
        }
        else
        {
            this.frontElement.style.backgroundImage = `url("/images/${vote}.svg")`;
        }
    }
}
