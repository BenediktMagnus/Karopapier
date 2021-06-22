import * as EventFunctionDefinitions from './eventFunctionDefinitions';

export default interface ServerToClientEvents
{
    updateMapEntry: EventFunctionDefinitions.UpdateMapEntry;
    updateUserCount: EventFunctionDefinitions.UpdateUserCount;
}
