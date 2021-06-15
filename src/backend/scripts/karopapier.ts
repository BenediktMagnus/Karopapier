import Database from './karopapier/database/database';
import MapHandler from './karopapier/map/mapHandler';
import Server from './karopapier/server';
import UserHandler from './karopapier/user/userHandler';

const httpPort = 8031;

export default class Karopapier
{
    private readonly database: Database;
    private readonly server: Server;
    protected readonly userHandler: UserHandler;
    protected readonly mapHandler: MapHandler;

    constructor (inMemory = false)
    {
        this.database = new Database('karopapier', inMemory);

        this.server = new Server();

        this.server.httpPort = httpPort;

        this.userHandler = new UserHandler(this.server, this.database);
        this.mapHandler = new MapHandler(this.server, this.database, this.userHandler);

        this.server.start();
    }

    /**
     * Call a method safely without throwing errors and write to the error log if one occurs.
     * @param method The method to call.
     */
    private callSafely (method: () => void): void
    {
        try
        {
            method();
        }
        catch (error)
        {
            console.error(error);
        }
    }

    /**
     * Terminates all processes running for the application.
     * NOTE: This method must be safe because it will be called when the programme
     *       is terminated. Therefore we must be sure to not throw any errors.
     */
    public terminate (): void
    {
        this.callSafely(
            () =>
            {
                if (this.server)
                {
                    this.server.stop(); // FIXME: Promises must be handled appropriately.
                    this.server.socketIo.close(); // TODO: Shouldn't this happen inside server.close()?
                }
            }
        );

        this.callSafely(
            () =>
            {
                if (this.database)
                {
                    this.database.close();
                }
            }
        );
    }
}
