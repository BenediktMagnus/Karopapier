import Point from "./paper/point";

/**
 * Used to manage a coordinates element by automatically updating it's content on changes.
 */
export default class CoordinateController
{
    private element: HTMLElement;
    private spans: HTMLSpanElement[];

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

        this.spans = [];

        // Three spans, one for each coordinate and one for the splitter colon:
        while (this.spans.length < 3)
        {
            const span = document.createElement('span');
            this.element.appendChild(span);
            this.spans.push(span);
        }

        this.spans[0].textContent = '0';
        this.spans[0].classList.add('textAlignRight');

        this.spans[1].textContent = ':';
        this.spans[1].classList.add('coordinatesSplitter', 'textAlignCentre');

        this.spans[2].textContent = '0';
        this.spans[2].classList.add('textAlignLeft');
    }

    /**
     * Must be called when the coordinates change.
     * @param point The new point.
     */
    public onChange (point: Point): void
    {
        this.spans[0].textContent = `${point.x}`;
        this.spans[2].textContent = `${point.y}`;
    }
}
