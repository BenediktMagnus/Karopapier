import CoordinateController from '../controllers/coordinateController';
import { MapContent } from '../../shared/map';
import Point from '../paper/point';
import Tool from './tool';

export type PaletteEvent = (x: number, y: number, contentId: number) => void; // TODO: Change this to Point.

export default class Palette
{
    private toolsElement: HTMLDivElement;

    private coordinates: CoordinateController;

    private contentIdToToolMap: Map<number, Tool>;

    private selectedPoint: Point|null;

    private onToolSelected: PaletteEvent; // TODO: This is not elegant and the naming scheme is ambiguous.

    constructor (onToolSelected: PaletteEvent)
    {
        this.onToolSelected = onToolSelected;

        this.contentIdToToolMap = new Map<number, Tool>();
        this.selectedPoint = null;

        const toolsElement = document.getElementById('tools') as HTMLDivElement;

        if (toolsElement === null)
        {
            throw new ReferenceError('The palette tools element could not be found.');
        }
        else
        {
            this.toolsElement = toolsElement;
        }

        this.coordinates = new CoordinateController('paletteCoordinates');

        this.unselectPoint();
    }

    /**
     * Loads contents as tools into the palette.
     * @param mapContents The list of contents to load.
     */
    public loadContents (mapContents: MapContent[]): void
    {
        this.clearContents();

        let lastGroupNumber: number = Number.NEGATIVE_INFINITY;
        let rowNumber = 0;
        let columnNumber = 1;

        for (const mapContent of mapContents)
        {
            // For every group a new row:
            if (lastGroupNumber !== mapContent.groupNumber)
            {
                rowNumber++;
                columnNumber = 1;

                lastGroupNumber = mapContent.groupNumber;
            }

            const tool = new Tool(mapContent.id, mapContent.name, this.onToolClick.bind(this), this.toolsElement);

            tool.setPosition(columnNumber, rowNumber);

            this.contentIdToToolMap.set(mapContent.id, tool);

            columnNumber++;
        }
    }

    private clearContents (): void
    {
        for (const tool of this.contentIdToToolMap.values())
        {
            tool.destroy();
        }

        this.contentIdToToolMap.clear();
    }

    /**
     * Called if there is a click on a point of the paper.
     * @param point The point that has been clicked.
     */
    public onPaperClick (point: Point): void
    {
        this.unselectPoint();

        this.selectedPoint = point;

        this.updateVoteCounts(point);

        this.selectPoint();
    }

    private updateVoteCounts (point: Point): void
    {
        // First, reset all vote counts to zero:
        for (const tool of this.contentIdToToolMap.values())
        {
            tool.setVoteCount(0);
        }

        // Then, update the vote counts that differ from zero to their actual values:

        const contentEntries = point.getContentEntries();

        for (const contentEntry of contentEntries)
        {
            const tool = this.contentIdToToolMap.get(contentEntry.contentId);

            if (tool === undefined)
            {
                // TODO: What to do? We must have inconsistent data here... Can this even happen?
                continue;
            }

            tool.setVoteCount(contentEntry.voteCount);
        }
    }

    /**
     * Called if the content for a coordinate changes.
     * @param point The point of the content that has been changed.
     */
    public onContentChange (point: Point): void
    {
        if (this.selectedPoint === point)
        {
            const contentEntries = point.getContentEntries();

            for (const contentEntry of contentEntries)
            {
                const tool = this.contentIdToToolMap.get(contentEntry.contentId);

                if (tool === undefined)
                {
                    // TODO: What should we do? This must mean outdated data, right?

                    return;
                }

                tool.setVoteCount(contentEntry.voteCount);
            }
        }
    }

    /**
     * Called when one of the tools has been clicked/selected.
     * @param contentId The content ID of the clicked tool.
     */
    private onToolClick (contentId: number): void
    {
        if (this.selectedPoint !== null)
        {
            this.onToolSelected(this.selectedPoint.x, this.selectedPoint.y, contentId);
        }
    }

    private selectPoint (): void
    {
        if (this.selectedPoint !== null)
        {
            this.selectedPoint.select(); // TODO: The point, as it calls the click event, should select itself.

            this.coordinates.onChange(this.selectedPoint);
        }
    }

    private unselectPoint (): void
    {
        this.selectedPoint?.unselect(); // TODO: The point, as it calls the click event, should unselect itself.
        this.selectedPoint = null;

        for (const tool of this.contentIdToToolMap.values())
        {
            tool.setVoteCount(0);
        }

        this.coordinates.reset();
    }
}
