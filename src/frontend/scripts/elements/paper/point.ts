import * as Constants from "../../shared/constants";
import { ContentEntry } from "../../shared/map";
import EventHandler from "../../utility/eventHandler";

type PointEvent = (point: Point) => void;

export class PointEvents
{
    public readonly onClick: EventHandler<PointEvent>;
    public readonly onMouseOver: EventHandler<PointEvent>;
    public readonly onContentChange: EventHandler<PointEvent>;

    constructor ()
    {
        this.onClick = new EventHandler<PointEvent>();
        this.onMouseOver = new EventHandler<PointEvent>();
        this.onContentChange = new EventHandler<PointEvent>();
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

        this.x = x;
        this.y = y;
        this.events = events;

        this.contentIdToContentEntryMap = new Map<number, ContentEntry>();

        this.mainElement = document.createElement('td');
        parentElement.appendChild(this.mainElement);

        this.frontElement = document.createElement('div');
        this.mainElement.appendChild(this.frontElement);

        this.showContent();

        // TODO: It should be possible to unselect points after selection.
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

        let highestVoteCount = 0;

        for (const contentEntry of contentEntries)
        {
            this.contentIdToContentEntryMap.set(contentEntry.contentId, contentEntry);

            if (contentEntry.voteCount > highestVoteCount)
            {
                this.contentId = contentEntry.contentId;
                highestVoteCount = contentEntry.voteCount;
            }
        }

        this.showContent();
    }

    /**
     * Get the content entries for the point.
     */
    public getContentEntries (): ContentEntry[]
    {
        const contentEntries = Array.from(this.contentIdToContentEntryMap.values());

        return contentEntries;
    }

    public setOrUpdateEntry (oldContentId: number|null, newContentId: number): void
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

        // Find the new highest vote and set the contentId:
        let highestVoteCount = 0;
        for (const contentEntry of this.contentIdToContentEntryMap.values())
        {
            if (contentEntry.voteCount > highestVoteCount)
            {
                this.contentId = contentEntry.contentId;
                highestVoteCount = contentEntry.voteCount;
            }
        }

        this.showContent();

        this.events.onContentChange.dispatchEvent(this);
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

        this.contentIdToContentEntryMap.clear();

        this.showContent();
    }

    private showContent (): void
    {
        if (this.contentId == Constants.emptyContentId)
        {
            this.frontElement.style.backgroundImage = 'none';
        }
        else
        {
            this.frontElement.style.backgroundImage = `url("/images/${this.contentId}.svg")`;
        }
    }
}
