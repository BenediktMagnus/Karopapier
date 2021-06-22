import { ContentEntryListElement, MapContent, MapData } from "./map";

export type Authenticate = (sessionId: number, sessionToken: string, reply: AuthenticateReply) => void;
export type AuthenticateReply = (successful: boolean) => void;

export type GetMapContents = (reply: GetMapContentsReply) => void;
export type GetMapContentsReply = (mapContents: MapContent[]) => void;

export type GetMapData = (reply: GetMapDataReply) => void;
export type GetMapDataReply = (mapData: MapData) => void;

export type LoadMap = (reply: LoadMapReply) => void;
export type LoadMapReply = (mapEntries: ContentEntryListElement[]) => void;

export type Login = (name: string, password: string, reply: LoginReply) => void;
export type LoginReply = (successful: boolean, sessionId?: number, sessionToken?: string) => void;
/* TODO: LoginReply is not optimally typed. "sessionId" and "sessionToken" are given if "successful" is true otherwise they are undefined.
         How is it possible in Typescript to type such a function so we do not need to check for "sessionId" and "sessionToken"? */

export type SelectMap = (mapPublicIdentifier: string) => void;

export type SetMapEntry = (x: number, y: number, contentId: number) => void;

export type UpdateMapEntry = (x: number, y: number, oldContentId: number|null, newContentId: number) => void;

export type UpdateUserCount = (userCount: number) => void;
