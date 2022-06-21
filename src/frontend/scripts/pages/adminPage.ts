import type * as TypedSocketIo from '../network/typedSocketIo';
import { AdminTabs } from '../elements/admin/adminTabs';
import Authenticator from '../network/authenticator';
import { FrontendUtils } from '../utility/frontendUtils';
// FIXME: This is not correct. "import type" should not be needed according to the documentation. What is wrong?
import type { io } from 'socket.io-client';
import Utils from '../shared/utils';

class AdminPage
{
    private readonly socket: TypedSocketIo.Socket;

    private readonly authenticator: Authenticator;

    private adminTabs: AdminTabs|null;

    constructor ()
    {
        this.adminTabs = null;

        // @ts-expect-error Error expected because of the import type hack.
        this.socket = io();

        FrontendUtils.callWhenDocumentIsReady(this.onDocumentLoaded.bind(this));

        // Socket.io events:
        this.socket.on('connect', Utils.catchVoidPromise(this.onConnect.bind(this)));
        this.socket.io.on('reconnect', Utils.catchVoidPromise(this.onReconnect.bind(this)));
        // Log errors to the console: // TODO: Should we do this in production?
        this.socket.on('reportError', console.error.bind(console));

        this.authenticator = new Authenticator(this.socket);
    }

    public run (): void
    {
        this.socket.connect();
    }

    private async onConnect (): Promise<void>
    {
        // After connection, the same has to happen as after a reconnect:
        await this.onReconnect();
    }

    private async onReconnect (): Promise<void>
    {
        await this.authenticator.run();
    }

    private onDocumentLoaded (): void
    {
        this.adminTabs = new AdminTabs();

        this.adminTabs.showTab('moderationTab');
    }
}

const adminPage = new AdminPage();
adminPage.run();
