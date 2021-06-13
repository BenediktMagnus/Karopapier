import { MapContent } from "../../shared/map";
import Point from "../paper/point";
import Tool from "./tool";

export type PaletteEvent = (x: number, y: number, contentId: number) => void; // TODO: Change this to Point.

export default class Palette
{
    private toolsElement: HTMLDivElement;

    private tools: Tool[];

    protected selectedPoint: Point|null;

    private onToolSelected: PaletteEvent; // TODO: This is not elegant and the naming scheme is ambiguous.

    /**
     * @param boundaries The element that restricts the position of the palette; it will not show
     *                   completely outside this given element (probably the paper).
     */
    constructor (onToolSelected: PaletteEvent)
    {
        this.onToolSelected = onToolSelected;

        this.tools = [];
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

        this.unselectPoint();
    }

    /**
     * Loads contents as tools into the palette.
     * @param mapContents The list of contents to load.
     */
    public loadContents (mapContents: MapContent[]): void
    {
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

            this.tools.push(tool);

            columnNumber++;
        }
    }

    /**
     * Called if there is a click on a point of the paper.
     * @param point The point that has been clicked.
     */
    public onPaperClick (point: Point): void
    {
        this.unselectPoint();

        this.selectedPoint = point;

        this.selectPoint();
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

        this.unselectPoint();
    }

    private selectPoint (): void
    {
        this.selectedPoint?.select();
    }

    private unselectPoint (): void
    {
        this.selectedPoint?.unselect();
        this.selectedPoint = null;
    }
}
