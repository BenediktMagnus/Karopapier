import { FrontendUtils } from '../utility/frontendUtils';

class LobbyPage
{
    private openMapForm: HTMLFormElement|null;
    private mapIdentifierInput: HTMLInputElement|null;

    constructor ()
    {
        this.openMapForm = null;
        this.mapIdentifierInput = null;

        FrontendUtils.callWhenDocumentIsReady(this.onDocumentLoaded.bind(this));
    }

    public run (): void
    {
        //
    }

    private onDocumentLoaded (): void
    {
        this.openMapForm = document.getElementById('openMapForm') as HTMLFormElement|null;

        if (this.openMapForm === null)
        {
            throw new ReferenceError('The open map form element could not be found.');
        }

        this.openMapForm.addEventListener('submit', this.onOpenMapFormSubmit.bind(this));

        this.mapIdentifierInput = this.openMapForm.querySelector<HTMLInputElement>('input[name="mapIdentifier"]');

        if (this.mapIdentifierInput === null)
        {
            throw new ReferenceError('The map identifier input element could not be found.');
        }
    }

    private onOpenMapFormSubmit (event: SubmitEvent): void
    {
        if ((this.openMapForm === null) || (this.mapIdentifierInput === null))
        {
            return;
        }

        event.preventDefault();

        window.location.assign(`/?map=${this.mapIdentifierInput.value}`);
    }
}

const lobbyPage = new LobbyPage();
lobbyPage.run();
