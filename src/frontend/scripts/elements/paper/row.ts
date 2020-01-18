import Point, { PointEvents } from "./point";

type PointMap = Map<number, Point>;

export default class Row
{
    /**
     * A map of points, with the x coordinate as key and the point instance as value.
     */
    protected points: PointMap;

    protected element: HTMLTableRowElement;

    /**
     * Create a row of points at y, going from low to high.
     * @param y The y coordinate of this row.
     * @param low The lower limit (including) of the row.
     * @param high The higher limit (including) of this row.
     * @param parentElement The parent element to attach the row to.
     */
    constructor (y: number, low: number, high: number, events: PointEvents, parentElement: HTMLTableElement)
    {
        this.points = new Map<number, Point>();

        this.element = document.createElement('tr');
        parentElement.appendChild(this.element);

        for(let x = low; x <= high; x++)
        {
            const point = new Point(x, y, events, this.element);

            this.points.set(x, point);
        }
    }

    /**
     * Destroys the row by removing it's element from it's parent.
     */
    public destroy (): void
    {
        for (const point of this.points.values())
        {
            point.destroy();
        }

        this.points.clear();

        this.element.parentNode?.removeChild(this.element);
    }

    public getPoint (x: number): Point|null
    {
        const point = this.points.get(x);

        // Null is correct here instead of undefined because the structure (coordinates) do exist but there is no point there:
        if (point === undefined)
        {
            return null;
        }

        return point;
    }
}
