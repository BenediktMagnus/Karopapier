import * as EventFunctionDefinitions from './eventFunctionDefinitions';

export default interface ServerToClientEvents
{
    reportError: EventFunctionDefinitions.ReportError;
    updateMapEntry: EventFunctionDefinitions.UpdateMapEntry;
    updateUserCount: EventFunctionDefinitions.UpdateUserCount;
}
