export const enum ApiError
{
    CordinatesAreOutsideOfMap = 'The given coordinates are not inside the selected map.',
    InvalidCallback = 'Invalid callback given.',
    InvalidParameters = 'Invalid parameters given.',
    MapDoesNotHaveContent = 'The selected map does not have the given content.',
    MapNotActive = 'The map for the given map identifier is not active.',
    NoMapForIdentifier = 'Could not find a map for the given map identifier.',
    NoMapSelected = 'No map selected. Call "selectMap" before trying to interact with a map.',
    NoUserForSocket = 'Your socket has no user. You need to log in (at least as anonymous) before interacting.'
}
