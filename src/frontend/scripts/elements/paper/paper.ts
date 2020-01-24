import { ContentEntryListElement, MapData } from "../../shared/map";
import Point, { PointEvent, PointEvents } from "./point";
import Boundaries from "../../utility/boundaries";
import CoordinateController from "../coordinateController";
import MapUtility from "../../shared/mapUtility";
import Row from "./row";

type RowMap = Map<number, Row>;

export default class Paper
{
    private element: HTMLTableElement;

    private coordinates: CoordinateController;

    private clickListeners: PointEvent[];
    private mouseOverListeners: PointEvent[];

    private events: PointEvents;

    /**
     * A map of rows with the y coordinates as key and the row instance as value.
     */
    private rows: RowMap;

    public get boundaries (): Boundaries
    {
        return this.element;
    }

    constructor ()
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

        this.coordinates = new CoordinateController('paperCoordinates');

        this.clickListeners = [];
        this.mouseOverListeners = [];

        this.events = {
            onClick: this.onPointClick.bind(this),
            onMouseOver: this.onPointMouseOver.bind(this),
        };

        this.addMouseOverListener(this.coordinates.onChange.bind(this.coordinates));
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

    /**
     * Create a map by deleting all existing entries and creating new ones for the given mapData's width and height.
     * @param mapData The map data containing width and height.
     */
    public createMap (mapData: MapData): void
    {
        this.clearMap();

        const xLowAndHigh = MapUtility.axisLengthToLowAndHigh(mapData.width);
        const yLowAndHigh = MapUtility.axisLengthToLowAndHigh(mapData.height);

        // TODO: The lowest value must be at the bottom!
        for(let y = yLowAndHigh.low; y <= yLowAndHigh.high; y++)
        {
            const row = new Row(y, xLowAndHigh.low, xLowAndHigh.high, this.events, this.element);

            this.rows.set(y, row);
        }
    }

    public loadMap (mapEntries: ContentEntryListElement[]): void
    {
        // NOTE: We can asume a y-x order of the mapEntries here.

        let y = Number.NEGATIVE_INFINITY;
        let row: Row|undefined;

        for (const mapEntry of mapEntries)
        {
            if (mapEntry.y !== y)
            {
                y = mapEntry.y;

                row = this.rows.get(y);
            }

            if (row === undefined)
            {
                continue; // TODO: Should we do something here like making the paper bigger?
            }

            const point = row.getPoint(mapEntry.x);

            if (point === null)
            {
                continue; // TODO: Should we do something here like making the paper bigger?
            }

            point.loadContentEntries(mapEntry.contentEntries);
        }
    }

    public setMapEntry (x: number, y: number, userId: number|null, oldContentId: number|null, newContentId: number): void
    {
        const point = this.getPointAt(x, y);

        if (point === null)
        {
            return;
            // TODO: This should, theoretically, never happen. But couldn't we apply the same size increasing procedure as in loadMap?
        }

        if (userId === null)
        {
            point.setAnonymousEntry(oldContentId, newContentId);
        }
        else
        {
            point.setUserEntry(userId, oldContentId, newContentId);
        }
    }

    private clearMap (): void
    {
        for (const row of this.rows.values())
        {
            row.destroy();
        }

        this.rows.clear();
    }

    private getPointAt (x: number, y: number): Point|null
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
    private addPointEventListener (listener: PointEvent, list: PointEvent[]): void
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
    private removePointEventListener (listener: PointEvent, list: PointEvent[]): void
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
    private onPointClick (point: Point): void
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
    private onPointMouseOver (point: Point): void
    {
        for (const listener of this.mouseOverListeners)
        {
            listener(point);
        }
    }
}
