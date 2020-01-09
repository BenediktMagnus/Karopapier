import MapContent from "../../map/mapContent";

export default interface MapEntryAnonymousTable
{
    mapId: number;
    ip: string;
    x: number;
    y: number;
    content: MapContent;
}
