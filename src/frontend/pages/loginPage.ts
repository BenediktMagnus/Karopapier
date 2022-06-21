import type * as TypedSocketIo from '../network/typedSocketIo';
import Authenticator from '../network/authenticator';
import { FrontendUtils } from '../utility/frontendUtils';
// FIXME: This is not correct. "import type" should not be needed according to the documentation. What is wrong?
import type { io } from 'socket.io-client';
import Utils from '../../shared/utils';

class LoginPage
{
    private readonly socket: TypedSocketIo.Socket;

    private readonly authenticator: Authenticator;

    private loginForm: HTMLFormElement|null;
    private fieldset: HTMLFieldSetElement|null;
    private nameInput: HTMLInputElement|null;
    private passwordInput: HTMLInputElement|null;
    private loginErrorMessage: HTMLParagraphElement|null;

    constructor ()
    {
        this.loginForm = null;
        this.fieldset = null;
        this.nameInput = null;
        this.passwordInput = null;
        this.loginErrorMessage = null;

        // @ts-expect-error Error expected because of the import type hack.
        this.socket = io();

        FrontendUtils.callWhenDocumentIsReady(this.onDocumentLoaded.bind(this));

        // Socket.io events:
        // Log errors to the console: // TODO: Should we do this in production?
        this.socket.on('reportError', console.error.bind(console));

        this.authenticator = new Authenticator(this.socket);
    }

    public run (): void
    {
        this.socket.connect();
    }

    private onDocumentLoaded (): void
    {
        this.loginForm = document.getElementById('loginForm') as HTMLFormElement|null;

        if (this.loginForm === null)
        {
            throw new ReferenceError('The login form element could not be found.');
        }

        this.loginForm.addEventListener('submit', Utils.catchVoidPromise(this.onLoginFormSubmit.bind(this)));

        this.fieldset = this.loginForm.getElementsByTagName('fieldset')[0] as HTMLFieldSetElement|null;

        if (this.fieldset === null)
        {
            throw new ReferenceError('The login form fieldset element could not be found.');
        }

        this.nameInput = this.loginForm.querySelector<HTMLInputElement>('input[name="name"]');

        if (this.nameInput === null)
        {
            throw new ReferenceError('The login form name input element could not be found.');
        }

        this.passwordInput = this.loginForm.querySelector<HTMLInputElement>('input[name="password"]');

        if (this.passwordInput === null)
        {
            throw new ReferenceError('The login form password input element could not be found.');
        }

        this.loginErrorMessage = document.getElementById('loginErrorMessage') as HTMLParagraphElement|null;

        if (this.loginErrorMessage === null)
        {
            throw new ReferenceError('The login form error message element could not be found.');
        }
    }

    private async onLoginFormSubmit (event: SubmitEvent): Promise<void>
    {
        if ((this.loginForm === null)
            || (this.fieldset === null)
            || (this.nameInput === null)
            || (this.passwordInput === null)
            || (this.loginErrorMessage === null))
        {
            return;
        }

        event.preventDefault();

        this.fieldset.disabled = true;
        this.loginErrorMessage.style.visibility = 'hidden';
        this.loginErrorMessage.classList.remove('flash');

        try
        {
            await this.authenticator.login(this.nameInput.value, this.passwordInput.value);

            window.location.assign('/lobby');
        }
        catch
        {
            this.loginErrorMessage.style.visibility = 'visible';
            this.loginErrorMessage.classList.add('flash');

            this.passwordInput.value = '';

            this.fieldset.disabled = false;
        }
    }
}

const loginPage = new LoginPage();
loginPage.run();
