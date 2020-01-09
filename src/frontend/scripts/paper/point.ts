export type PointEvent = (point: Point) => void;

export class PointEvents
{
    public onClick?: PointEvent;
    public onMouseOver?: PointEvent;
}

export default class Point
{
    public readonly element: HTMLTableDataCellElement;

    public readonly x: number;
    public readonly y: number;

    protected events: PointEvents;

    constructor (x: number, y: number, events: PointEvents)
    {
        this.x = x;
        this.y = y;
        this.events = events;

        this.element = document.createElement('td');

        this.element.onclick = (): void => { this.events.onClick?.(this); };
        this.element.onmouseover = (): void => { this.events.onMouseOver?.(this); };
    }
}
