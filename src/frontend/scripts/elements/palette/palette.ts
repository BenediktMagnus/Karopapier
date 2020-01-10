import Boundaries from "../../utility/boundaries";
import Coordinates from "../coordinates";
import Point from "../paper/point";

export default class Palette
{
    protected element: HTMLDivElement;

    protected coordinates: Coordinates;

    protected boundaries: Boundaries;

    /**
     * @param boundaries The element that restricts the position of the palette; it will not show
     *                   completely outside this given element (probably the paper).
     */
    constructor (boundaries: Boundaries)
    {
        this.boundaries = boundaries;

        const element = document.getElementById('palette') as HTMLDivElement;

        if (element === null)
        {
            throw new ReferenceError('The palette element could not be found.');
        }
        else
        {
            this.element = element;
        }

        this.coordinates = new Coordinates('paletteCoordinates');

        // If there is a click on anything, close the palette:
        // TODO: What does the capture option exactly do? Is it associated with clicking on another point?
        document.body.addEventListener('onclick', this.hide.bind(this), {capture: true});

        // TODO: Tools: The server should define the toolset.
    }

    /**
     * Called if there is a click on a point of the paper.
     * @param point The point that has been clicked.
     */
    public onPaperClick (point: Point): void
    {
        this.show();

        let x = this.boundaries.offsetLeft + point.boundaries.offsetLeft + point.boundaries.clientWidth;
        if (x + this.element.clientWidth > document.body.clientWidth)
        {
            x = document.body.clientWidth - this.element.clientWidth;
        }

        let y = this.boundaries.offsetTop + point.boundaries.offsetTop;
        if (y + this.element.clientHeight > document.body.clientHeight)
        {
            y = document.body.clientHeight - this.element.clientHeight;
        }

        this.element.style.left = x.toString() + 'px';
        this.element.style.top = y.toString() + 'px';

        this.coordinates.onChange(point);
    }

    protected show (): void
    {
        this.element.style.display = 'inline';
    }

    protected hide (): void
    {
        this.element.style.display = 'none';
    }
}
