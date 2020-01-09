import Point, { PointEvents } from "./point";

type PointMap = Map<number, Point>;

export default class Row
{
    /**
     * A map of points, with the x coordinate as key and the point instance as value.
     */
    protected points: PointMap;

    public readonly element: HTMLTableRowElement;

    /**
     * Create a row of points at y, going from low to high.
     * @param y The y coordinate of this row.
     * @param low The lower limit (including) of the row.
     * @param high The higher limit (including) of this row.
     */
    constructor (y: number, low: number, high: number, events: PointEvents)
    {
        this.points = new Map<number, Point>();

        this.element = document.createElement('tr');

        for(let x = low; x <= high; x++)
        {
            const point = new Point(x, y, events);

            this.element.appendChild(point.element);

            this.points.set(x, point);
        }
    }
}
