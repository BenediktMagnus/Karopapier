import * as EventFunctionDefinitions from './eventFunctionDefinitions';

export default interface ClientToServerEvents
{
    authenticate: EventFunctionDefinitions.Authenticate;
    getMapContents: EventFunctionDefinitions.GetMapContents;
    getMapData: EventFunctionDefinitions.GetMapData;
    loadMap: EventFunctionDefinitions.LoadMap;
    login: EventFunctionDefinitions.Login;
    selectMap: EventFunctionDefinitions.SelectMap;
    setMapEntry: EventFunctionDefinitions.SetMapEntry;
}
