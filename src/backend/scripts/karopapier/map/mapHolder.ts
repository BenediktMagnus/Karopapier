import Database from "../database/database";

export default class MapHolder
{
    protected database: Database;

    protected id: number;

    /**
     * The highest number of anonymous voters for a content on an entry. \
     * Used as a scaling measurement for the "value" of such a vote.
     */
    protected highestVotingCount: number;

    constructor (database: Database, mapId: number)
    {
        this.database = database;
        this.id = mapId;

        this.highestVotingCount = 0;
    }
}
