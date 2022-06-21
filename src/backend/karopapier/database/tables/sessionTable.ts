export interface SessionTableInsert
{
    userId: number;
    token: string;
}

export default interface SessionTable extends SessionTableInsert
{
    id: number;
    lastAccess: number;
}
