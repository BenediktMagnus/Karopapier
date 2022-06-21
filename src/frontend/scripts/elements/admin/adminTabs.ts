export class AdminTabs
{
    private tabContents: HTMLCollectionOf<HTMLDivElement>;
    private tabButtons: HTMLCollectionOf<HTMLButtonElement>;

    constructor ()
    {
        this.tabContents = document.getElementsByClassName('tabContent') as HTMLCollectionOf<HTMLDivElement>;

        if (this.tabContents.length === 0)
        {
            throw new ReferenceError('The tab content elements could not be found.');
        }

        this.tabButtons = document.getElementsByClassName('tabButton') as HTMLCollectionOf<HTMLButtonElement>;

        if (this.tabButtons.length === 0)
        {
            throw new ReferenceError('The tab button elements could not be found.');
        }

        for (const tabButton of this.tabButtons)
        {
            tabButton.addEventListener('click', this.onTabButtonClick.bind(this, tabButton));
        }
    }

    /**
     * Called if there is a click on a tab button.
     * @param buttonElement The element of the button that has been clicked.
     */
    private onTabButtonClick (buttonElement: HTMLButtonElement): void
    {
        const tabContentId = buttonElement.getAttribute('forTab');

        if (tabContentId === null)
        {
            throw new ReferenceError('The tab button element has no "forTab" attribute.');
        }

        for (const tabContent of this.tabContents)
        {
            if (tabContent.id === tabContentId)
            {
                tabContent.style.display = 'block';
            }
            else
            {
                tabContent.style.display = 'none';
            }
        }

        for (const tabButton of this.tabButtons)
        {
            if (tabButton === buttonElement)
            {
                tabButton.classList.add('activeTabButton');
            }
            else
            {
                tabButton.classList.remove('activeTabButton');
            }
        }
    }

    public showTab (tabId: string): void
    {
        for (const tabButton of this.tabButtons)
        {
            if (tabButton.getAttribute('forTab') === tabId)
            {
                tabButton.click();
                break;
            }
        }
    }
}
