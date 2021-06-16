import * as Constants from "../../shared/constants";
import { ContentEntry } from "../../shared/map";
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

    private contentId: number;
    private highestVoteCount: number;

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
        this.highestVoteCount = 0;

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
     * Destroys the point by removing its element from its parent.
     */
    public destroy (): void
    {
        // Remove event listeners from the element to prevent any thinkable memory leaks:
        this.mainElement.onclick = null;
        this.mainElement.onmouseover = null;

        this.mainElement.parentNode?.removeChild(this.mainElement);
    }

    /**
     * Load a content entry list into the point, overwriting every previous content.
     * @param contentEntries The list of content entries.
     */
    public loadContentEntries (contentEntries: ContentEntry[]): void
    {
        this.resetContent();

        for (const contentEntry of contentEntries)
        {
            this.contentIdToContentEntryMap.set(contentEntry.contentId, contentEntry);

            if (contentEntry.voteCount > this.highestVoteCount)
            {
                this.highestVoteCount = contentEntry.voteCount;
                this.contentId = contentEntry.contentId;
            }
        }

        this.showContent();
    }

    public setEntry (oldContentId: number|null, newContentId: number): void
    {
        if (oldContentId !== null)
        {
            const oldEntry = this.contentIdToContentEntryMap.get(oldContentId);

            if (oldEntry !== undefined)
            {
                oldEntry.voteCount--;
            }
        }

        let newEntry = this.contentIdToContentEntryMap.get(newContentId);

        if (newEntry !== undefined)
        {
            newEntry.voteCount++;
        }
        else
        {
            newEntry = {
                contentId: newContentId,
                voteCount: 1,
            };

            this.contentIdToContentEntryMap.set(newContentId, newEntry);
        }

        // Set the content ID of this point if the new entry has a higher voter count:
        if (newEntry.voteCount > this.highestVoteCount)
        {
            this.highestVoteCount = newEntry.voteCount;
            this.contentId = newEntry.contentId;
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
        this.highestVoteCount = 0;

        this.contentIdToContentEntryMap.clear();

        this.showContent();
    }

    private showContent (): void
    {
        if (this.highestVoteCount > 0)
        {
            this.frontElement.style.backgroundImage = `url("/images/${this.contentId}.svg")`;
        }
        else
        {
            this.frontElement.style.backgroundImage = 'none';
        }
    }
}
