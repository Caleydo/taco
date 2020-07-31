export declare class AppConstants {
    /**
     * Static constant as identification for TACO views
     * Note: the string value is referenced for multiple view definitions in the package.json,
     *       i.e. be careful when refactor the value
     */
    static VIEW: string;
    static EVENT_RESIZE: string;
    /**
     * Event that is fired when a data set collection has been selected
     * @type {string}
     */
    static EVENT_DATA_COLLECTION_SELECTED: string;
    /**
     * Event that is fired when a data set has been selected
     * @type {string}
     */
    static EVENT_DATASET_SELECTED: string;
    static EVENT_DATASET_SELECTED_LEFT: string;
    static EVENT_DATASET_SELECTED_RIGHT: string;
    static EVENT_OPEN_DIFF_HEATMAP: string;
    static EVENT_OPEN_DETAIL_VIEW: string;
    static EVENT_DIFF_HEATMAP_LOADED: string;
    static EVENT_HEATMAP_LOADED: string;
    static EVENT_TIME_POINTS_SELECTED: string;
    static EVENT_TIME_POINT_HOVERED: string;
    static EVENT_SHOW_CHANGE: string;
    static EVENT_HIDE_CHANGE: string;
    static EVENT_FOCUS_ON_REORDER: string;
    /**
     * Parse the following date formats from strings using moment.js (see http://momentjs.com/docs/#/parsing/)
     * @type {string[]}
     */
    static PARSE_DATE_FORMATS: string[];
    static MAXIMAL_HEATMAP_LABEL_SIZE: number;
    static TIMELINE_BAR_WIDTH: number;
    /**
     * Initial size of a heatmap cell
     * @type {number}
     */
    static HEATMAP_CELL_SIZE: number;
    /**
     * Property for the URL hash
     * @type {{DATASET: string; TIME_POINTS: string; DETAIL_VIEW: string}}
     */
    static HASH_PROPS: {
        DATASET: string;
        TIME_POINTS: string;
        DETAIL_VIEW: string;
        FILTER: string;
        SELECTION: string;
    };
}
export declare module DiffColors {
    const COLOR_ADDED = "#a1d76a";
    const COLOR_DELETED = "#e9a3c9";
    const COLOR_NO_CHANGE = "#fff";
    const COLOR_CONTENT_NEGATIVE = "#8da0cb";
    const COLOR_CONTENT_POSITIVE = "#d8b365";
}
export interface IChangeType {
    type: string;
    ratioName: string;
    countName: string;
    label: string;
    isActive: boolean;
    abbr: string;
}
export declare class ChangeTypes {
    static NO_CHANGE: IChangeType;
    static CONTENT: IChangeType;
    static ADDED: IChangeType;
    static REMOVED: IChangeType;
    static REORDER: IChangeType;
    static TYPE_ARRAY: IChangeType[];
    static labelForType(type: string): string;
    /**
     * Filters only active changes and joins them for the URL
     * @returns {string}
     */
    static forURL(): string;
    static updateFilterHash(): void;
}
