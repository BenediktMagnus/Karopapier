export default class Tool
{
    private mainElement: HTMLTableCellElement;
    private imageElement: HTMLImageElement;
    private hoverTextElement: HTMLSpanElement;

    protected readonly id: number;
    protected readonly name: string;

    /**
     * Create a point for the given coordinates.
     * @param id The id of the tool.
     * @param name The name of the tool.
     * @param parentElement The parent element to attach the tool to (meaning the palette row).
     */
    constructor (id: number, name: string, parentElement: HTMLTableRowElement)
    {
        this.id = id;
        this.name = name;

        this.mainElement = document.createElement('td');
        this.mainElement.classList.add('tool');
        parentElement.appendChild(this.mainElement);

        this.imageElement = document.createElement('img');
        this.imageElement.src = `/images/${id}.png`;
        this.mainElement.appendChild(this.imageElement);

        this.hoverTextElement = document.createElement('span');
        this.hoverTextElement.classList.add('toolHoverText');
        this.hoverTextElement.textContent = name;
        this.mainElement.appendChild(this.hoverTextElement);

        //this.mainElement.onclick = this.onClick.bind(this);
    }

    /**
     * Destroys the point by removing it's element from it's parent.
     */
    public destroy (): void
    {
        // Remove event listeners from the element to prevent any thinkable memory leaks:
        this.mainElement.onclick = null;
        this.mainElement.onmouseover = null;
        this.mainElement.onmouseout = null;

        this.mainElement.parentNode?.removeChild(this.mainElement);
    }
}
