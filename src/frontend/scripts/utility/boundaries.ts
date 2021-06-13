/**
 * Describes the boundaries of something, meaning its (DOM) position and size.
 */
export default interface Boundaries
{
    /**
     * The element's height in pixels, including padding, borders and scrollbars. \
     * NOTE: This will be zero if the element is hidden ("display: none;").
     */
    readonly offsetHeight: number;
    /**
     * The element's width in pixels, including padding, borders and scrollbars. \
     * NOTE: This will be zero if the element is hidden ("display: none;").
     */
    readonly offsetWidth: number;
    /**
     * Number of pixels the upper left corner of the element is offset to the left within its parent node.
     */
    readonly offsetLeft: number;
    /**
     * Number of pixels the upper corner of the element is offset to the top within its parent node.
     */
    readonly offsetTop: number;

    /**
     * The element's inner height in pixels, includes padding but excludes borders, margins, and scrollbars. \
     * NOTE: This will be zero if the element has no CSS or inline layout boxes.
     */
    readonly clientHeight: number;
    /**
     * The element's inner width in pixels, includes padding but excludes borders, margins, and scrollbars. \
     * NOTE: This will be zero if the element has no CSS or inline layout boxes.
     */
    readonly clientWidth: number;
    /**
     * The width in pixels of the left border of the element. Includes scrollbar but not padding.
     */
    readonly clientLeft: number;
    /**
     * The width in pixels of the top border of the element. Includes scrollbar but not padding.
     */
    readonly clientTop: number;

    /**
     * The height in pixels of the element's content, including not visible overflown content.
     */
    readonly scrollHeight: number;
    /**
     * The width in pixels of the element's content, including not visible overflown content.
     */
    readonly scrollWidth: number;
    /**
     * Number of decimal pixels the content is scrolled from the left.
     */
    readonly scrollLeft: number;
    /**
     * Number of decimal pixels the content is scrolled from the top.
     */
    readonly scrollTop: number;
}
