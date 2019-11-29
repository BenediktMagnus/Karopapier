import MapContent from "../../map/mapContent";

export default interface MapEntryUserTable
{
    mapId: number;
    userId: number;
    x: number;
    y: number;
    content: MapContent;
}
