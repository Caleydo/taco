/**
 * Created by Holger Stitz on 19.12.2016.
 */
import { ITacoTimePoint } from './interfaces';
export declare class TimePointUtils {
    static getTotalWidth(items: ITacoTimePoint[], itemWidth: number, totalWidth: number): number;
    static getTimeScale(items: ITacoTimePoint[], totalWidth: number, padding?: number): any;
    static selectedTimePoints: ITacoTimePoint[];
    /**
     * Stores a selected time point and sends an event with all stored time points
     * If two time points are stored, the array is cleared
     * @param timepoints
     */
    static selectTimePoint(...timepoints: ITacoTimePoint[]): void;
    /**
     * Filters list of time points from given keys in the URL hash and fires the event
     * @param timepoints
     */
    static selectTimePointFromHash(timepoints: ITacoTimePoint[]): void;
}
