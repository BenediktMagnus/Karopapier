import Point from "./paper/point";

/**
 * Used to manage coordinates element by automatically updating it's content on changes.
 */
export default class Coordinates
{
    private element: HTMLElement;

    constructor (elementId: string)
    {
        const element = document.getElementById(elementId);

        if (element === null)
        {
            throw new ReferenceError('The given coordinates element could not be found.');
        }
        else
        {
            this.element = element;
        }
    }

    /**
     * Must be called when the coordinates change.
     * @param point The new point.
     */
    public onChange (point: Point): void
    {
        this.element.textContent = `${point.x}:${point.y}`;
    }
}
