import CoordinateController from "../coordinateController";
import { MapContent } from "../../shared/map";
import Point from "../paper/point";
import Tool from "./tool";

export type PaletteEvent = (x: number, y: number, contentId: number) => void; // TODO: Change this to Point.

export default class Palette
{
    private paletteElement: HTMLDivElement;
    private toolsElement: HTMLDivElement;

    private coordinates: CoordinateController;

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

        const mainElement = document.getElementById('palette') as HTMLDivElement;

        if (mainElement === null)
        {
            throw new ReferenceError('The palette element could not be found.');
        }
        else
        {
            this.paletteElement = mainElement;
        }

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

        this.hide();

        // TODO: Hide button for the palette.
    }

    /**
     * Loads contents as tools into the palette.
     * @param mapContents The list of contents to load.
     */
    public loadContents (mapContents: MapContent[]): void
    {
        let lastGroupNumber: number = Number.NEGATIVE_INFINITY;
        let rowElement: HTMLTableRowElement|null = null;

        // NOTE: We can assume a list ordered by the group number here.

        for (const mapContent of mapContents)
        {
            // For every group a new row:
            if ((rowElement === null) || (lastGroupNumber !== mapContent.groupNumber))
            {
                rowElement = document.createElement('tr');
                this.toolsElement.appendChild(rowElement);

                lastGroupNumber = mapContent.groupNumber;
            }

            const tool = new Tool(mapContent.id, mapContent.name, this.onToolClick.bind(this), rowElement);

            this.tools.push(tool);
        }
    }

    /**
     * Called if there is a click on a point of the paper.
     * @param point The point that has been clicked.
     */
    public onPaperClick (point: Point): void
    {
        this.hide();

        this.selectedPoint = point;

        this.show();

        let x = point.boundaries.offsetLeft + point.boundaries.offsetWidth;
        if (x + this.paletteElement.offsetWidth > document.body.offsetWidth)
        {
            x = document.body.offsetWidth - this.paletteElement.offsetWidth;
        }

        let y = point.boundaries.offsetTop;
        if (y + this.paletteElement.offsetHeight > document.body.offsetHeight)
        {
            y = document.body.offsetHeight - this.paletteElement.offsetHeight;
        }

        this.paletteElement.style.left = `${x}px`;
        this.paletteElement.style.top = `${y}px`;

        this.coordinates.onChange(point);
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

        this.hide();
    }

    private show (): void
    {
        this.paletteElement.style.display = 'inline';

        this.selectedPoint?.select();
    }

    private hide (): void
    {
        this.paletteElement.style.display = 'none';

        this.selectedPoint?.unselect();

        this.selectedPoint = null;
    }
}
