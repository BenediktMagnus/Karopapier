interface AxisLogAndHigh
{
    low: number;
    high: number;
}

export default abstract class MapUtility
{
    /**
     * Calculates the low and high values for an axis out of its length.
     * @param length The axis length.
     * @returns The pair of low and high values for the axis.
     */
    public static axisLengthToLowAndHigh (length: number): AxisLogAndHigh
    {
        const distanceFromZero = (length - 1) / 2;
        const low = -Math.floor(distanceFromZero);
        const high = Math.ceil(distanceFromZero);

        const axisLogAndHigh: AxisLogAndHigh = {
            low: low,
            high: high,
        };

        return axisLogAndHigh;
    }
}
