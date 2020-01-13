import Point, { PointEvent, PointEvents } from "./point";
import Boundaries from "../../utility/boundaries";
import { ContentEntryListElement } from "../../shared/map";
import Row from "./row";

type RowMap = Map<number, Row>;

export default class Paper
{
    protected element: HTMLTableElement;

    protected clickListeners: PointEvent[];
    protected mouseOverListeners: PointEvent[];

    /**
     * A map of rows with the y coordinates as key and the row instance as value.
     */
    protected rows: RowMap;

    public get boundaries (): Boundaries
    {
        return this.element;
    }

    constructor (width: number, height: number)
    {
        this.clickListeners = [];
        this.mouseOverListeners = [];

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

    public addClickListener (listener: PointEvent): void
    {
        this.addPointEventListener(listener, this.clickListeners);
    }

    public removeClickListener (listener: PointEvent): void
    {
        this.removePointEventListener(listener, this.clickListeners);
    }

    public addMouseOverListener (listener: PointEvent): void
    {
        this.addPointEventListener(listener, this.mouseOverListeners);
    }

    public removeMouseOverListener (listener: PointEvent): void
    {
        this.removePointEventListener(listener, this.mouseOverListeners);
    }

    public loadMap (contentEntryListElements: ContentEntryListElement[]): void
    {
        // NOTE: We can asume a y-x order of the list here.

        let y = Number.NEGATIVE_INFINITY;
        let row: Row|undefined;

        for (const contentEntryListElement of contentEntryListElements)
        {
            if (contentEntryListElement.y !== y)
            {
                y = contentEntryListElement.y;

                row = this.rows.get(y);
            }

            if (row === undefined)
            {
                continue; // TODO: Should we do something here like making the paper bigger?
            }

            const point = row.getPoint(contentEntryListElement.x);

            if (point === null)
            {
                continue; // TODO: Should we do something here like making the paper bigger?
            }

            point.loadContentEntries(contentEntryListElement.contentEntries);
        }
    }

    protected getPointAt (x: number, y: number): Point|null
    {
        // TODO: We could build the automatic size increasing procedure in here and give back a point in every case.

        const row = this.rows.get(y);

        if (row === undefined)
        {
            return null;
        }

        const point = row.getPoint(x);

        return point;
    }

    /**
     * Add a listener to a point event list.
     * @param listener The listener to add.
     * @param list The list of point events to add the listener to.
     */
    protected addPointEventListener (listener: PointEvent, list: PointEvent[]): void
    {
        if (!list.includes(listener))
        {
            list.push(listener);
        }
    }

    /**
     * Remove a listener from a point event list.
     * @param listener The listener to renove.
     * @param list The list of point events to remove the listener from.
     */
    protected removePointEventListener (listener: PointEvent, list: PointEvent[]): void
    {
        const position = list.indexOf(listener);

        if (position > -1)
        {
            list.splice(position, 1);
        }
    }

    /**
     * Called if a point is clicked. Will call all listeners of the click event.
     * @param point The point that has been clicked.
     */
    protected onPointClick (point: Point): void
    {
        for (const listener of this.clickListeners)
        {
            listener(point);
        }
    }

    /**
     * Called if a mouse over on a point has happened. Will call all listeners of the mouse over event.
     * @param point The point the mouse is at.
     */
    protected onPointMouseOver (point: Point): void
    {
        for (const listener of this.mouseOverListeners)
        {
            listener(point);
        }
    }
}
