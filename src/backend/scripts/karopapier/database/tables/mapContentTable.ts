export interface MapContentGroupNumber
{
    groupNumber: number;
}

export default interface MapContentTable extends MapContentGroupNumber
{
    mapId: number;
    contentId: number;
}
