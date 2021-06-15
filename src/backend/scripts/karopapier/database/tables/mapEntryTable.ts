export default interface MapEntryTable
{
    mapId: number;
    userId: number;
    sessionId: number|null;
    ip: string|null;
    x: number;
    y: number;
    contentId: number;
}
