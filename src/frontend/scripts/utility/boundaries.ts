/**
 * Describes the boundaries of something, meaning it's (DOM) position and size.
 */
export default interface Boundaries
{
    // Offset
    readonly offsetHeight: number;
    readonly offsetLeft: number;
    readonly offsetTop: number;
    readonly offsetWidth: number;
    // Client
    readonly clientHeight: number;
    readonly clientLeft: number;
    readonly clientTop: number;
    readonly clientWidth: number;
    // Scroll
    readonly scrollHeight: number;
    readonly scrollLeft: number;
    readonly scrollTop: number;
    readonly scrollWidth: number;
}
