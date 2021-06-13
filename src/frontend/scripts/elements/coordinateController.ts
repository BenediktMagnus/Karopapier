import Point from "./paper/point";

/**
 * Used to manage a coordinates element by automatically updating its content on changes.
 */
export default class CoordinateController
{
    private parentElement: HTMLElement;
    private xSpan: HTMLSpanElement;
    private ySpan: HTMLSpanElement;

    constructor (parentElementId: string)
    {
        const parentElement = document.getElementById(parentElementId);

        if (parentElement === null)
        {
            throw new ReferenceError('The given coordinates parent element could not be found.');
        }
        else
        {
            this.parentElement = parentElement;
        }

        const template = document.getElementById('coordinatesTemplate') as HTMLTemplateElement;

        const clone = template.content.cloneNode(true) as DocumentFragment;

        this.xSpan = clone.firstElementChild as HTMLSpanElement;
        this.ySpan = clone.lastElementChild as HTMLSpanElement;

        this.parentElement.appendChild(clone);
    }

    /**
     * Must be called when the coordinates change.
     * @param point The new point.
     */
    public onChange (point: Point): void
    {
        this.xSpan.textContent = `${point.x}`;
        this.ySpan.textContent = `${point.y}`;
    }
}
