import { ContentEntryListElement, MapData } from "../../shared/map";
import Point, { PointEvents } from "./point";
import Boundaries from "../../utility/boundaries";
import CoordinateController from "../coordinateController";
import MapUtility from "../../shared/mapUtility";
import Row from "./row";

type RowMap = Map<number, Row>;

export default class Paper
{
    private tableElement: HTMLTableElement;

    private coordinates: CoordinateController;

    public readonly events: PointEvents;

    /**
     * A map of rows with the y coordinates as key and the row instance as value.
     */
    private rows: RowMap;

    public get boundaries (): Boundaries
    {
        return this.tableElement;
    }

    constructor ()
    {
        const tableElement = document.getElementById('paper') as HTMLTableElement;

        if (tableElement === null)
        {
            throw new ReferenceError('The paper table element could not be found.');
        }
        else
        {
            this.tableElement = tableElement;
        }

        this.rows = new Map<number, Row>();

        this.coordinates = new CoordinateController('paperCoordinates');

        this.events = new PointEvents();

        this.events.onMouseOver.addEventListener(this.coordinates.onChange.bind(this.coordinates));
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
            const row = new Row(y, xLowAndHigh.low, xLowAndHigh.high, this.events, this.tableElement);

            this.rows.set(y, row);
        }

        // The styles need to now the exact map height and width to calculate the pixel values:
        this.tableElement.style.setProperty('--paper-x-count', `${mapData.width}`);
        this.tableElement.style.setProperty('--paper-y-count', `${mapData.height}`);
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
}
