export type ToolEvent = (contentId: number) => void;

export default class Tool // TODO: Should be renamed as this includes votings, maybe "contents" all the way?
{
    public readonly mainElement: HTMLDivElement;
    private imageElement: HTMLImageElement;
    private voteCountElement: HTMLSpanElement;
    private hoverTextElement: HTMLSpanElement;

    protected readonly contentId: number;
    protected readonly name: string;

    /**
     * Create a point for the given coordinates.
     * @param id The content id for the tool.
     * @param name The name of the tool.
     * @param parentElement The parent element to attach the tool to.
     */
    constructor (contentId: number, name: string, onClick: ToolEvent, parentElement: HTMLElement)
    {
        this.contentId = contentId;
        this.name = name;

        this.mainElement = document.createElement('div');
        this.mainElement.classList.add('tool');
        parentElement.appendChild(this.mainElement);

        this.imageElement = document.createElement('img');
        this.imageElement.src = `/images/${contentId}.svg`;
        this.mainElement.appendChild(this.imageElement);

        this.voteCountElement = document.createElement('span');
        this.voteCountElement.classList.add('voteCount');
        this.voteCountElement.textContent = '0';
        this.mainElement.appendChild(this.voteCountElement);

        this.hoverTextElement = document.createElement('span');
        this.hoverTextElement.classList.add('tooltip', 'toolHoverText');
        this.hoverTextElement.textContent = name;
        this.mainElement.appendChild(this.hoverTextElement);

        this.mainElement.onclick = (): void => { onClick(this.contentId); };
    }

    public setPosition (column: number, row: number): void
    {
        this.mainElement.style.gridColumn = `${column}`;
        this.mainElement.style.gridRow = `${row}`;
    }

    /**
     * Destroys the tool by removing its element from its parent.
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
