import MapContent from "../../map/mapContent";

export default interface MapEntryAnonymousTable
{
    mapId: number;
    quantity: number;
    x: number;
    y: number;
    content: MapContent;
}
