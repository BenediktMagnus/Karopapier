import Boundaries from "../../utility/boundaries";
import CoordinateController from "../coordinateController";
import { MapContent } from "../../shared/map";
import Point from "../paper/point";
import Tool from "./tool";

export default class Palette
{
    private paletteElement: HTMLDivElement;
    private toolsElement: HTMLDivElement;

    private coordinates: CoordinateController;

    private boundaries: Boundaries;

    private tools: Tool[];

    /**
     * @param boundaries The element that restricts the position of the palette; it will not show
     *                   completely outside this given element (probably the paper).
     */
    constructor (boundaries: Boundaries)
    {
        this.boundaries = boundaries;

        this.tools = [];

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

        // If there is a click on anything, close the palette:
        // TODO: What does the capture option exactly do? Is it associated with clicking on another point?
        document.body.addEventListener('click', this.hide.bind(this), {capture: true});

        this.hide();
    }

    /**
     * Loads contents as tools into the palette.
     * @param mapContents The list of contents to load.
     */
    public loadContents (mapContents: MapContent[]): void
    {
        let lastGroupNumber: number = Number.NEGATIVE_INFINITY;
        let rowElement: HTMLTableRowElement|null = null;

        for (const mapContent of mapContents)
        {
            // For every group a new row:
            if ((rowElement === null) || (lastGroupNumber !== mapContent.groupNumber))
            {
                rowElement = document.createElement('tr');
                this.toolsElement.appendChild(rowElement);

                lastGroupNumber = mapContent.groupNumber;
            }

            const tool = new Tool(mapContent.id, mapContent.name, rowElement);

            this.tools.push(tool);
        }
    }

    /**
     * Called if there is a click on a point of the paper.
     * @param point The point that has been clicked.
     */
    public onPaperClick (point: Point): void
    {
        this.show();

        let x = this.boundaries.offsetLeft + point.boundaries.offsetLeft + point.boundaries.offsetWidth;
        if (x + this.paletteElement.offsetWidth > document.body.offsetWidth)
        {
            x = document.body.offsetWidth - this.paletteElement.offsetWidth;
        }

        let y = this.boundaries.offsetTop + point.boundaries.offsetTop;
        if (y + this.paletteElement.offsetHeight > document.body.offsetHeight)
        {
            y = document.body.offsetHeight - this.paletteElement.offsetHeight;
        }

        this.paletteElement.style.left = `${x}px`;
        this.paletteElement.style.top = `${y}px`;

        this.coordinates.onChange(point);
    }

    private show (): void
    {
        this.paletteElement.style.display = 'inline';
    }

    private hide (): void
    {
        this.paletteElement.style.display = 'none';
    }
}
