import Boundaries from "../../utility/boundaries";
import Coordinates from "../coordinates";
import { MapContent } from "../../shared/map";
import Point from "../paper/point";
import Tool from "./tool";

export default class Palette
{
    private mainElement: HTMLDivElement;
    private toolsElement: HTMLDivElement;

    private coordinates: Coordinates;

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
            this.mainElement = mainElement;
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

        this.coordinates = new Coordinates('paletteCoordinates');

        // If there is a click on anything, close the palette:
        // TODO: What does the capture option exactly do? Is it associated with clicking on another point?
        document.body.addEventListener('onclick', this.hide.bind(this), {capture: true});

        // TODO: Tools: The server should define the toolset.
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

        let x = this.boundaries.offsetLeft + point.boundaries.offsetLeft + point.boundaries.clientWidth;
        if (x + this.mainElement.clientWidth > document.body.clientWidth)
        {
            x = document.body.clientWidth - this.mainElement.clientWidth;
        }

        let y = this.boundaries.offsetTop + point.boundaries.offsetTop;
        if (y + this.mainElement.clientHeight > document.body.clientHeight)
        {
            y = document.body.clientHeight - this.mainElement.clientHeight;
        }

        this.mainElement.style.left = `${x}px`;
        this.mainElement.style.top = `${y}px`;

        this.coordinates.onChange(point);
    }

    private show (): void
    {
        this.mainElement.style.display = 'inline';
    }

    private hide (): void
    {
        this.mainElement.style.display = 'none';
    }
}
