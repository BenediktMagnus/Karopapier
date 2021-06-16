import { ContentEntry, ContentEntryListElement } from "../../shared/map";
import EventHandler from "../../utility/eventHandler";

class ContentEntryMap extends Map<number, ContentEntry> {}
class YContentEntriesMap extends Map<number, ContentEntryMap> {}
class XYContentEntriesMap extends Map<number, YContentEntriesMap> {}

type ContentChangedEvent = (x: number, y: number, contentEntry: ContentEntry) => void;

export default class VoteCountHolder
{
    /** Inserted in X-Y order, so use map.get(x).get(y) to get an entry. */
    private coordinates: XYContentEntriesMap;

    public readonly contentChanged: EventHandler<ContentChangedEvent>; // TODO: The public should not be able to fire this event.

    constructor ()
    {
        this.coordinates = new XYContentEntriesMap();
        this.contentChanged = new EventHandler<ContentChangedEvent>();
    }

    /**
     * Called when the map is loaded. Used to set the vote counts on the tools.
     * @param mapEntries
     */
    public onLoadMap (mapEntries: ContentEntryListElement[]): void
    {
        for (const mapEntry of mapEntries)
        {
            let yMap = this.coordinates.get(mapEntry.x);

            if (yMap === undefined)
            {
                yMap = new YContentEntriesMap();
                this.coordinates.set(mapEntry.x, yMap);
            }

            const contentEntryMap = new ContentEntryMap();

            for (const contentEntry of mapEntry.contentEntries)
            {
                contentEntryMap.set(contentEntry.contentId, contentEntry);
            }

            yMap.set(mapEntry.y, contentEntryMap);
        }
    }

    /**
     * Called when one of the map entries has been set by someone.
     * @param x The x coordinate of the entry.
     * @param y The y coordinate of the entry.
     * @param oldContentId The old content ID the entry had, if there was any (is set when the entry was updated).
     * @param newContentId The new content ID the entry was changed to.
     */
    public onSetMapEntry (x: number, y: number, oldContentId: number|null, newContentId: number): void
    {
        // TODO: Rename to "setContentEntry".

        const contentEntries = this.coordinates.get(x)?.get(y);

        if (contentEntries === undefined)
        {
            // TODO: Should we do something here like making the map bigger? In theory, this should never happen.

            return;
        }

        if (oldContentId !== null)
        {
            const oldContentEntry = contentEntries.get(oldContentId);

            if (oldContentEntry === undefined)
            {
                // TODO: Outdated data detected. Could that happen? What to do?

                return;
            }

            oldContentEntry.voteCount--;

            this.contentChanged.dispatchEvent(x, y, oldContentEntry);
        }

        const newContentEntry = contentEntries.get(newContentId);

        if (newContentEntry === undefined)
        {
            // TODO: Outdated data detected. Could that happen? What to do?

            return;
        }

        newContentEntry.voteCount++;

        this.contentChanged.dispatchEvent(x, y, newContentEntry);
    }

    /**
     * Get the content entries for a given x-y coordinate.
     * @param x
     * @param y
     */
    public getContentEntries (x: number, y: number): ContentEntry[]
    {
        const contentEntries = this.coordinates.get(x)?.get(y)?.values();

        // TODO: Should we check if the x-y coordinate is out of range?

        if (contentEntries === undefined)
        {
            return [];
        }

        return Array.from(contentEntries);
    }
}
