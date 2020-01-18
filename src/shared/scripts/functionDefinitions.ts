import { ContentEntryListElement, MapData } from "./map";

// TODO: Find a better, less generic name for this module.

export type AuthenticateResponseFunction = (successful: boolean) => void;
export type GetMapDataResponseFunction = (mapData: MapData) => void;
export type LoadMapResponseFunction = (mapEntries: ContentEntryListElement[]) => void;
export type LoginResponseFunction = (successful: boolean, sessionId?: number, sessionToken?: string) => void;
