import * as FunctionNames from "./shared/functionNames";

class Main
{
    protected readonly socket: SocketIOClient.Socket;

    constructor ()
    {
        this.socket = io();
    }

    protected onDocumentLoaded (): void
    {
        this.socket.emit(FunctionNames.login, 'myName', 'myPassword');

        console.log('ID: ' + this.socket.id);
    }

    public run (): void
    {
        document.addEventListener('DOMContentLoaded', this.onDocumentLoaded.bind(this), false);
    }
}

const main = new Main();
main.run();
