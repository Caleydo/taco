/**
 * Created by Holger Stitz on 26.08.2016.
 */
import { AppContext } from 'phovea_core';
export class AppConstants {
}
/**
 * Static constant as identification for TACO views
 * Note: the string value is referenced for multiple view definitions in the package.json,
 *       i.e. be careful when refactor the value
 */
AppConstants.VIEW = 'tacoView';
AppConstants.EVENT_RESIZE = 'eventResize';
/**
 * Event that is fired when a data set collection has been selected
 * @type {string}
 */
AppConstants.EVENT_DATA_COLLECTION_SELECTED = 'eventDataCollectionSelected';
/**
 * Event that is fired when a data set has been selected
 * @type {string}
 */
AppConstants.EVENT_DATASET_SELECTED = 'eventDataSetSelected';
AppConstants.EVENT_DATASET_SELECTED_LEFT = 'eventDataSetSelectedLeft';
AppConstants.EVENT_DATASET_SELECTED_RIGHT = 'eventDataSetSelectedRight';
AppConstants.EVENT_OPEN_DIFF_HEATMAP = 'eventDrawDiffHeatmap';
AppConstants.EVENT_OPEN_DETAIL_VIEW = 'eventOpenDetailView';
AppConstants.EVENT_DIFF_HEATMAP_LOADED = 'eventDiffHeatmapLoaded';
AppConstants.EVENT_HEATMAP_LOADED = 'eventHeatmapLoaded';
AppConstants.EVENT_TIME_POINTS_SELECTED = 'eventTimePointsSelected';
AppConstants.EVENT_TIME_POINT_HOVERED = 'eventTimePointHovered';
AppConstants.EVENT_SHOW_CHANGE = 'eventShowChange';
AppConstants.EVENT_HIDE_CHANGE = 'eventHideChange';
AppConstants.EVENT_FOCUS_ON_REORDER = 'eventFocusOnReorder';
/**
 * Parse the following date formats from strings using moment.js (see http://momentjs.com/docs/#/parsing/)
 * @type {string[]}
 */
AppConstants.PARSE_DATE_FORMATS = ['YYYY_MM_DD', 'YYYY-MM-DD', 'YYYY'];
AppConstants.MAXIMAL_HEATMAP_LABEL_SIZE = 70;
AppConstants.TIMELINE_BAR_WIDTH = 16;
/**
 * Initial size of a heatmap cell
 * @type {number}
 */
AppConstants.HEATMAP_CELL_SIZE = 5;
/**
 * Property for the URL hash
 * @type {{DATASET: string; TIME_POINTS: string; DETAIL_VIEW: string}}
 */
AppConstants.HASH_PROPS = {
    DATASET: 'ds',
    TIME_POINTS: 'tp',
    DETAIL_VIEW: 'detail',
    FILTER: 'f',
    SELECTION: 's'
};
export var DiffColors;
(function (DiffColors) {
    DiffColors.COLOR_ADDED = '#a1d76a';
    DiffColors.COLOR_DELETED = '#e9a3c9';
    DiffColors.COLOR_NO_CHANGE = '#fff';
    DiffColors.COLOR_CONTENT_NEGATIVE = '#8da0cb';
    DiffColors.COLOR_CONTENT_POSITIVE = '#d8b365';
})(DiffColors || (DiffColors = {}));
const defaultFilter = AppContext.getInstance().hash.getProp(AppConstants.HASH_PROPS.FILTER, 'NCAR');
export class ChangeTypes {
    static labelForType(type) {
        return this.TYPE_ARRAY.filter((d) => d.type === type)[0].label;
    }
    /**
     * Filters only active changes and joins them for the URL
     * @returns {string}
     */
    static forURL() {
        return this.TYPE_ARRAY
            .filter((d) => d.isActive)
            .map((d) => (d === this.REMOVED || d === this.ADDED) ? 'structure' : d.type)
            .join(',');
    }
    static updateFilterHash() {
        AppContext.getInstance().hash.setProp(AppConstants.HASH_PROPS.FILTER, ChangeTypes.TYPE_ARRAY.filter((d) => d.isActive).map((d) => d.abbr).join(''));
    }
}
ChangeTypes.NO_CHANGE = {
    type: 'nochange',
    ratioName: 'no_ratio',
    countName: 'no_counts',
    label: 'No changes',
    abbr: 'N',
    isActive: defaultFilter.includes('N')
};
ChangeTypes.CONTENT = {
    type: 'content',
    ratioName: 'c_ratio',
    countName: 'c_counts',
    label: 'Content',
    abbr: 'C',
    isActive: defaultFilter.includes('C')
};
ChangeTypes.ADDED = {
    type: 'added',
    ratioName: 'a_ratio',
    countName: 'a_counts',
    label: 'Added',
    abbr: 'A',
    isActive: defaultFilter.includes('A')
};
ChangeTypes.REMOVED = {
    type: 'removed',
    ratioName: 'd_ratio',
    countName: 'd_counts',
    label: 'Removed',
    abbr: 'R',
    isActive: defaultFilter.includes('R')
};
ChangeTypes.REORDER = {
    type: 'reorder',
    ratioName: 'r_ratio',
    countName: 'r_counts',
    label: 'Reorder',
    abbr: 'O',
    isActive: defaultFilter.includes('O')
};
ChangeTypes.TYPE_ARRAY = [ChangeTypes.ADDED, ChangeTypes.REMOVED, ChangeTypes.CONTENT, ChangeTypes.REORDER, ChangeTypes.NO_CHANGE];
//# sourceMappingURL=AppConstants.js.map