import Server from './karopapier/server';

const httpPort = 8031;

export default class Karopapier
{
    protected readonly server: Server;

    constructor ()
    {
        this.server = new Server();

        this.server.httpPort = httpPort;

        this.server.start();
    }

    public terminate (): void
    {
        this.server.stop();
    }
}
