import Database from './karopapier/database/database';
import Server from './karopapier/server';
import UserHandler from './karopapier/userHandler';

const httpPort = 8031;

export default class Karopapier
{
    protected readonly database: Database;
    protected readonly server: Server;
    protected readonly userHandler: UserHandler;

    constructor (inMemory = false)
    {
        this.database = new Database('karopapier', inMemory);

        this.server = new Server();

        this.server.httpPort = httpPort;

        this.userHandler = new UserHandler(this.server.socketIo);

        this.server.start();
    }

    /**
     * Call a method safely without throwing errors and write to the error log if one occurs.
     * @param method The method to call.
     */
    protected callSafely (method: () => void): void
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
                    this.server.stop();
                    this.server.socketIo.close();
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
