import Point, { PointEvents } from "./point";
import Row from "./row";

type RowMap = Map<number, Row>;

export default class Paper
{
    protected element: HTMLTableElement;

    /**
     * A map of rows with the y coordinates as key and the row instance as value.
     */
    protected rows: RowMap;

    constructor (width: number, height: number)
    {
        const element = document.getElementById('paper') as HTMLTableElement;

        if (element === null)
        {
            throw new ReferenceError('The paper element could not be found.');
        }
        else
        {
            this.element = element;
        }

        this.rows = new Map<number, Row>();

        const events: PointEvents = {
            onClick: this.onPointClick.bind(this),
            onMouseOver: this.onPointMouseOver.bind(this),
        };

        const xDistanceFromZero = (width - 1) / 2;
        const xLow = -Math.floor(xDistanceFromZero);
        const xHigh = Math.ceil(xDistanceFromZero);

        const yDistanceFromZero = (height - 1) / 2;
        const yLow = -Math.floor(yDistanceFromZero);
        const yHigh = Math.ceil(yDistanceFromZero);

        for(let y = yLow; y <= yHigh; y++)
        {
            const row = new Row(y, xLow, xHigh, events);

            this.element.appendChild(row.element);

            this.rows.set(y, row);
        }
    }

    protected onPointClick (point: Point): void
    {
        // TODO: Implement.
    }

    protected onPointMouseOver (point: Point): void
    {
        // TODO: Implement.
    }
}
