import * as Constants from '../../shared/constants';
import * as fs from 'fs';
import { MapTable, MapTableInsert } from './tables/mapTable';
import SessionTable, { SessionTableInsert } from './tables/sessionTable';
import { UserTable, UserTableInsert } from './tables/userTable';
import { ContentTable } from './tables/contentTable';
import { MapContentGroupNumber } from './tables/mapContentTable';
import MapEntryTable from './tables/mapEntryTable';
import Sqlite = require('better-sqlite3');
import Utils from '../../shared/utils';

export default class Database
{
    private readonly databaseDescriberFileName = 'karopapier';
    private readonly dataPath = './data/';

    /**
     * The database containing all tables.
     */
    private database: Sqlite.Database;

    /**
     * Initialises the database connection.
     */
    constructor (databaseFileName: string, inMemory = false)
    {
        this.database = this.openOrCreateDatabase(databaseFileName, this.databaseDescriberFileName, inMemory);
    }

    private openOrCreateDatabase (databaseName: string, describerFileName: string, inMemory: boolean): Sqlite.Database
    {
        const databaseFilePath = inMemory ? ':memory:' : this.dataPath + databaseName + '.sqlite';

        const fileCreated = inMemory || !fs.existsSync(databaseFilePath);

        const database = Sqlite(databaseFilePath);

        // WAL journal mode for better performance:
        database.pragma('journal_mode = WAL');
        // We want save data, so full synchronous:
        database.pragma('synchronous = FULL');

        if (fileCreated || inMemory)
        {
            const databaseDescriberFilePath = this.dataPath + describerFileName + '.sql';

            const sql = fs.readFileSync(databaseDescriberFilePath, 'utf8');

            try
            {
                database.exec(sql);
            }
            catch (error)
            {
                // If an error has occured here, something went wrong with the
                // sql statement. We then have to close the connection and
                // delete the file to prevent that we accidently reopen it and
                // assume it to be ready to use.
                // Because this only can happen if we created the file ourselves
                // a couple of milliseconds ago, a deletion means no data loss.

                database.close();

                if (!inMemory && fs.existsSync(databaseFilePath))
                {
                    fs.unlinkSync(databaseFilePath);
                }

                throw error;
            }
        }
        else
        {
            // If this is an old file, call vaccuum to defragment the database file:
            database.exec('VACUUM;');
        }

        // One call to optimise after each closed database connection
        // is recommended, so we do it before we open one:
        database.pragma('optimize');

        return database;
    }

    /**
     * Copies all bindable properties from an object, returning a bindable object
     * that can be used as binding parameters when running SQLite statements.
     */
    private getBindablesFromObject<TObject> (object: TObject): TObject
    {
        // Objects can contain data that is not bindable for SQLite, for
        // example constructors, methods etc.
        // This spread operator shallow copies all properties from the object
        // into an empty one, leaving the methods alone.
        const bindableObject = { ...object };

        // SQLite3 does not support boolean values. So we have to convert
        // them into numbers, otherwise an error will be thrown.
        for (const [key, value] of Object.entries(bindableObject))
        {
            if ((typeof value) === 'boolean')
            {
                const valueAsNumber = value ? 1 : 0;

                const indexedBindableObject = bindableObject as {[key: string]: any};

                indexedBindableObject[key] = valueAsNumber;
            }
        }

        return bindableObject;
    }

    /**
     * Returns if the database has something with the given value for the given select query.
     * @param selectQuery The query to select something in the database to check if it exists.
     * @param value The value that will be given to the statement as execution parameter.
     * @returns True if something is found, otherwise false.
     */
    private hasSomething (selectQuery: string, value: any): boolean
    {
        const statement = this.database.prepare(
            `SELECT
                CASE
                    WHEN EXISTS
                        (${selectQuery} LIMIT 1)
                    THEN 1
                    ELSE 0
                END`
        );

        // Will make the get method to return the value of the first column instead of an object for all
        // columns. Since we only want one value this makes it much easier:
        statement.pluck(true);

        const result = !!statement.get(value);

        return result;
    }

    /**
     * Close the database connection.
     */
    public close (): void
    {
        this.database.close();
    }

    public insertUser (userTableInsert: UserTableInsert): UserTable
    {
        const statement = this.database.prepare(
            `INSERT INTO
                user (name, passwordHash, isAdmin)
            VALUES
                (:name, :passwordHash, :isAdmin)`
        );

        const insertObject = this.getBindablesFromObject(userTableInsert);

        const runResult = statement.run(insertObject);

        const userTable: UserTable = {
            id: runResult.lastInsertRowid as number,
            ...userTableInsert
        };

        return userTable;
    }

    public getUser (userId: number): UserTable|undefined
    {
        const statement = this.database.prepare(
            'SELECT * FROM user WHERE id = ?'
        );

        const user = statement.get(userId) as UserTable|undefined;

        if (user !== undefined)
        {
            // TODO: Instead of handling booleans at this level we should do this inside UserTable's constructor and call it here.
            user.isAdmin = !!user.isAdmin;
        }

        return user;
    }

    public getUserByName (userName: string): UserTable|undefined
    {
        const statement = this.database.prepare(
            'SELECT * FROM user WHERE name = ?'
        );

        const user = statement.get(userName) as UserTable|undefined;

        if (user !== undefined)
        {
            // TODO: Instead of handling booleans at this level we should do this inside UserTable's constructor and call it here.
            user.isAdmin = !!user.isAdmin;
        }

        return user;
    }

    /**
     * Insert a new session into the database.
     */
    public insertSession (sessionTableInsert: SessionTableInsert): SessionTable
    {
        const statement = this.database.prepare(
            `INSERT INTO
                session (userId, token, lastAccess)
            VALUES
                (:userId, :token, :lastAccess)`
        );

        const insertObject = this.getBindablesFromObject(
            {
                ...sessionTableInsert,
                lastAccess: Utils.getCurrentUnixTime()
            }
        );

        const runResult = statement.run(insertObject);

        const sessionTable: SessionTable = {
            id: runResult.lastInsertRowid as number,
            lastAccess: insertObject.lastAccess,
            ...sessionTableInsert
        };

        return sessionTable;
    }

    public getSession (sessionId: number): SessionTable|undefined
    {
        const statement = this.database.prepare(
            'SELECT * FROM session WHERE id = ?'
        );

        const session = statement.get(sessionId) as SessionTable|undefined;

        return session;
    }

    public updateSessionAccessTime (sessionId: number): void
    {
        const statement = this.database.prepare(
            `UPDATE
                session
            SET
                lastAccess = ?
            WHERE
                id = ?`
        );

        const currentUnixTime = Utils.getCurrentUnixTime();

        statement.run(currentUnixTime, sessionId);
    }

    public deleteSession (sessionId: number): void
    {
        const statement = this.database.prepare(
            'DELETE FROM session WHERE id = ?'
        );

        statement.run(sessionId);
    }

    public insertMap (mapTableInsert: MapTableInsert): MapTable
    {
        const statement = this.database.prepare(
            `INSERT INTO
                map (publicIdentifier, name, isActive, width, height)
            VALUES
                (:publicIdentifier, :name, :isActive, :width, :height)`
        );

        const insertObject = this.getBindablesFromObject(mapTableInsert);

        const runResult = statement.run(insertObject);

        const mapTable: MapTable = {
            id: runResult.lastInsertRowid as number,
            ...mapTableInsert
        };

        return mapTable;
    }

    /**
     * Get a map by its ID.
     * @returns The map.
     */
    public getMap (mapId: number): MapTable|undefined
    {
        const statement = this.database.prepare(
            'SELECT * FROM map WHERE id = ?'
        );

        const map = statement.get(mapId) as MapTable|undefined;

        return map;
    }

    /**
     * Get a map by its public identifier.
     * @returns The map.
     */
    public getMapByPublicIdentifier (publicIdentifier: string): MapTable|undefined
    {
        const statement = this.database.prepare(
            'SELECT * FROM map WHERE publicIdentifier = ?'
        );

        const map = statement.get(publicIdentifier) as MapTable|undefined;

        return map;
    }

    /**
     * Get all maps.
     * @returns The list of map entries.
     */
    public getMaps (): MapTable[]
    {
        const statement = this.database.prepare(
            'SELECT * FROM map'
        );

        const maps = statement.all() as MapTable[];

        return maps;
    }

    /**
     * Checks if the given content ID is available for the given map.
     * @param contentId The ID of the content to search for.
     * @param mapId The ID of the map to search in.
     * @returns True if found, otherwise false.
     */
    public hasContent (contentId: number, mapId: number): boolean
    {
        const selectQuery = 'SELECT 1 FROM mapContent WHERE mapId = ? AND contentId = ?';

        const result = this.hasSomething(selectQuery, [mapId, contentId]);

        return result;
    }

    public getContentsForMap (mapId: number): (ContentTable & MapContentGroupNumber)[]
    {
        const statement = this.database.prepare(
            `SELECT
                content.*, mapContent.groupNumber
            FROM
                mapContent
            LEFT JOIN
                content ON mapContent.contentId = content.id
            WHERE
                mapContent.mapId = ?
            ORDER BY
                mapContent.groupNumber ASC,
                content.id ASC
            `
        );

        const contents = statement.all(mapId) as (ContentTable & MapContentGroupNumber)[];

        return contents;
    }

    public insertMapEntry (mapEntry: MapEntryTable): void
    {
        const statement = this.database.prepare(
            `INSERT INTO
                mapEntry (mapId, userId, sessionId, ip, x, y, contentId)
            VALUES
                (:mapId, :userId, :sessionId, :ip, :x, :y, :contentId)`
        );

        const insertObject = this.getBindablesFromObject(mapEntry);

        statement.run(insertObject);
    }

    public updateMapEntry (mapEntry: MapEntryTable): void
    {
        const statement = this.database.prepare(
            `UPDATE
                mapEntry
            SET
                contentId = :contentId,
                sessionId = :sessionId,
                ip = :ip
            WHERE
                mapId = :mapId
                AND x = :x
                AND y = :y
                AND
                    CASE
                        WHEN userId != ${Constants.anonymousUserId}
                        THEN userId = :userId
                        ELSE (
                            sessionId = :sessionId
                            OR ip = :ip
                        )
                    END`
        );

        const updateObject = this.getBindablesFromObject(mapEntry);

        statement.run(updateObject);
    }

    public getMapEntries (mapId: number): MapEntryTable[]
    {
        const statement = this.database.prepare(
            'SELECT * FROM mapEntry WHERE mapId = ?'
        );

        const mapEntries = statement.all(mapId) as MapEntryTable[];

        return mapEntries;
    }
}
